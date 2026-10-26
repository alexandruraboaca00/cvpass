// Real packaged CVForge -> CVPass, normal XDG identity, no source/private CVs.
import {_electron as electron} from '@playwright/test';
import {normalizedCv,pdfProjection,visibleEquivalent} from '../dist/tests/ui/f9-harness.js';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {releaseDemo} from '../dist/tests/release-demo.js';
import {cvprojCodec} from '../dist/src/adapters/library-cvproj.js';
import {createHash} from 'node:crypto';
const root=process.env.CVPASS_RELEASE_DATA;assert(root,'SSD data directory outside the repository required');await mkdir(root,{recursive:true});
const screenshots=resolve('docs/screenshots');await mkdir(screenshots,{recursive:true});
const old=process.env.CVPASS_LEGACY_APPIMAGE;assert(old,'Preserved original CVForge AppImage required');
const renamed=resolve('out/f9/CVPass-0.1.0-x86_64.AppImage'),primary=await mkdtemp(join(root,'upgrade-')),seed=cvprojCodec.encode(await releaseDemo(),'2026-10-26T12:00:00.000Z');
const ok=r=>{if(!r.ok)throw Error(r.error.code);return r.value;},hash=b=>createHash('sha256').update(b).digest('hex');
let active;
async function launch(executable,dir,name){
 const app=await electron.launch({chromiumSandbox:true,executablePath:executable,cwd:dir,args:['--ozone-platform=x11'],env:{...process.env,XDG_CONFIG_HOME:join(dir,'config'),APPIMAGELAUNCHER_DISABLE:'1',APPIMAGE_EXTRACT_AND_RUN:'1',GDK_BACKEND:'x11',GTK_USE_PORTAL:'0'},timeout:60000});active=app;
 const page=await app.firstWindow();await page.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();
 const metadata=await app.evaluate(({app})=>({name:app.getName(),version:app.getVersion(),path:app.getPath('userData'),session:app.getPath('sessionData'),noSandbox:app.commandLine.hasSwitch('no-sandbox')}));
 assert.equal(metadata.name,name);assert.equal(metadata.version,'0.1.0');assert.equal(metadata.path,join(dir,'config/CVForge'));assert.equal(metadata.noSandbox,false);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));app.context().on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 return {app,page,metadata,errors,requests};
}
async function close(rig){const exited=rig.app.waitForEvent('close');await rig.page.evaluate(()=>window.cvforge.close()).catch(e=>{if(!/closed/i.test(String(e)))throw e;});await exited;assert.deepEqual(rig.errors,[]);assert.deepEqual(rig.requests,[]);active=undefined;}
async function call(rig,method,...args){return ok(await rig.page.evaluate(async({method,args})=>window.cvforge[method](...args),{method,args}));}
async function destination(rig,path){await rig.app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},path);}
async function project(rig,bytes,workspace=false){const view=await call(rig,'importFile',crypto.randomUUID(),new Uint8Array(bytes),'legacy.cvproj');if(workspace)return call(rig,'importRestore',view.id,'emptyWorkspace',false);assert(view.draft);return call(rig,'importConfirm',view.id,{cv:view.draft.cv,rawDates:view.draft.rawDates,rawNumbers:view.draft.rawNumbers,documentLocale:view.draft.documentLocale,acknowledgeIssues:true});}
try{
 let rig=await launch(old,primary,'CVForge');await project(rig,Array.from(seed),true);let list=await call(rig,'list');assert.equal(list.cvs.length,6);const id=list.cvs[1].id;
 const form=await call(rig,'begin',id,list.cvs[1].revision,{kind:'personal'});form.cv.personalInformation.contacts[0].value='demo-confirmed@example.test';await call(rig,'stage',form);await call(rig,'flush');await call(rig,'confirm',form);
 const confirmed=(await call(rig,'open',id)).cv,profile=(await call(rig,'profileOpen')).profile,revisions=await call(rig,'revisions',id);
 const pdfPath=join(primary,'legacy.pdf');await destination(rig,pdfPath);const g=await call(rig,'pdfGenerate',id,confirmed.revision);await call(rig,'pdfExport',g.id,g.sha256);assert.equal(hash(await readFile(pdfPath)),g.sha256);
 const records=await call(rig,'pdfRecords',id);assert.equal(records.length,1);
 const cvPath=join(primary,'legacy-cv.cvproj');await destination(rig,cvPath);await call(rig,'projectExport',id,confirmed.revision);
 const wsPath=join(primary,'legacy-workspace.cvproj');await destination(rig,wsPath);await call(rig,'workspaceExport');const legacyWorkspace=cvprojCodec.decode(new Uint8Array(await readFile(wsPath)));assert(legacyWorkspace.snapshot.revisions.length>0);
 const draftCv=(await call(rig,'open',list.cvs[0].id)).cv,draft=await call(rig,'begin',draftCv.id,draftCv.revision,{kind:'personal'});draft.cv.personalInformation.displayName='Unconfirmed synthetic draft';await call(rig,'stage',draft);await call(rig,'flush');await close(rig);
 rig=await launch(renamed,primary,'CVPass');assert.equal(rig.metadata.session,rig.metadata.path);assert.equal(await rig.page.title(),'CVPass 0.1.0');assert.equal(await rig.page.locator('.brand').textContent(),'CVPass 0.1.0');
 list=await call(rig,'list');assert.equal(list.cvs.length,6);assert.equal(list.recovery.length,1);assert.deepEqual((await call(rig,'open',id)).cv,confirmed);assert.deepEqual((await call(rig,'profileOpen')).profile,profile);assert.deepEqual(await call(rig,'revisions',id),revisions);assert.deepEqual(await call(rig,'pdfRecords',id),records);
 await rig.page.getByRole('button',{name:/^Descartar borrador de /}).click();await rig.page.getByText('Trabajo sin confirmar',{exact:true}).waitFor({state:'hidden'});
 await rig.page.screenshot({path:join(screenshots,'library.png')});
 await rig.page.getByRole('button',{name:'Perfil maestro',exact:true}).click();await rig.page.getByRole('heading',{name:'Perfil maestro',exact:true}).waitFor();await rig.page.screenshot({path:join(screenshots,'profile.png')});
 await rig.page.getByRole('complementary').getByRole('button',{name:/CV demo · completo/}).click();await rig.page.getByRole('button',{name:'Editar datos personales',exact:true}).click();const dialog=rig.page.getByRole('dialog');await dialog.getByLabel(/^Email \(/).fill('demo-updated@example.test');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await dialog.waitFor({state:'hidden'});
 const updated=(await call(rig,'open',id)).cv;assert.equal(updated.personalInformation.contacts[0].value,'demo-updated@example.test');assert.deepEqual((await call(rig,'profileOpen')).profile,profile);await rig.page.screenshot({path:join(screenshots,'editor.png')});await close(rig);
 rig=await launch(renamed,primary,'CVPass');assert.deepEqual((await call(rig,'open',id)).cv,updated);assert.deepEqual(await call(rig,'pdfRecords',id),records);const upgradedPath=join(primary,'upgraded-workspace.cvproj');await destination(rig,upgradedPath);await call(rig,'workspaceExport');const upgraded=cvprojCodec.decode(new Uint8Array(await readFile(upgradedPath)));assert.deepEqual(upgraded.snapshot.revisions.slice(0,legacyWorkspace.snapshot.revisions.length),legacyWorkspace.snapshot.revisions);assert.deepEqual(upgraded.blobs,legacyWorkspace.blobs);await rig.page.getByRole('complementary').getByRole('button',{name:/CV demo · completo/}).click();
 for(const template of ['simple','lateral']){
  await rig.page.getByRole('button',{name:'Presentación',exact:true}).click();const d=rig.page.getByRole('dialog');await d.getByLabel('Plantilla',{exact:true}).selectOption(template);await d.getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});
  let panel=rig.page.getByRole('region',{name:'Vista previa PDF',exact:true});if(!await panel.count())await rig.page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();const revision=(await call(rig,'open',id)).cv.revision;await rig.page.waitForFunction(revision=>{const el=document.querySelector('.pdf-preview');return el?.getAttribute('data-state')==='ready'&&el.getAttribute('data-revision')===String(revision);},revision,{timeout:30000});
  const png=await panel.locator('canvas').first().evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]);await writeFile(join(screenshots,template+'.png'),Buffer.from(png,'base64'));if(template==='lateral'){await panel.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-90));await rig.page.screenshot({path:join(screenshots,'preview.png')});}
 }
 await close(rig);
 // Independent empty-library restoration using files actually written by old CVForge.
 for(const [name,path,workspace]of [['cv',cvPath,false],['workspace',wsPath,true],['pdf',pdfPath,false]]){
  const dir=await mkdtemp(join(root,'portable-'+name+'-'));rig=await launch(renamed,dir,'CVPass');await project(rig,Array.from(await readFile(path)),workspace);const imported=await call(rig,'list');assert.equal(imported.cvs.length,workspace?6:1);const cv=(await call(rig,'open',imported.cvs[workspace?1:0].id)).cv;assert.equal(cv.personalInformation.displayName,confirmed.personalInformation.displayName);assert(cv.personalInformation.photo);assert.equal(cv.personalInformation.contacts[0].value,confirmed.personalInformation.contacts[0].value);
  if(name==='cv'){assert.equal(cv.revision,confirmed.revision+1);assert.deepEqual(normalizedCv({...cv,revision:confirmed.revision,updatedAt:confirmed.updatedAt,importRecords:cv.importRecords.slice(0,confirmed.importRecords?.length??0)}),normalizedCv({...confirmed,importRecords:confirmed.importRecords??[]}));}
  if(name==='pdf')visibleEquivalent(cv,await pdfProjection(new Uint8Array(await readFile(pdfPath))));
  if(workspace){const exported=join(dir,'restored.cvproj');await destination(rig,exported);await call(rig,'workspaceExport');const decoded=cvprojCodec.decode(new Uint8Array(await readFile(exported)));assert.deepEqual(decoded.snapshot,legacyWorkspace.snapshot);assert.deepEqual(decoded.blobs,legacyWorkspace.blobs);}
  await close(rig);rig=await launch(renamed,dir,'CVPass');assert.equal((await call(rig,'list')).cvs.length,workspace?6:1);await close(rig);
 }
 await writeFile(join(root,'compatibility.json'),JSON.stringify({syntheticOnly:true,oldAppName:'CVForge',newAppName:'CVPass',userDataRetained:true,sessionDataRetained:true,oldSqlite:true,profile:true,assets:true,draftRecovery:true,revisions:true,exportRecord:true,editConfirmReopen:true,oldCvproj:true,oldCvprojContentExact:true,oldPdf:true,oldPdfProjectionExact:true,oldWorkspaceExact:true,portableReopen:true,httpRequests:0,screenshots:6,originalOldArtifactSha256:hash(await readFile(old)),renamedArtifactSha256:hash(await readFile(renamed))},null,2));console.log('CVForge -> CVPass real packaged compatibility and screenshots PASS');
}finally{if(active)await active.close();}
