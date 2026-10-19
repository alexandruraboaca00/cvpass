import {test,expect,_electron as electron} from '@playwright/test';
import type {ElectronApplication,Page} from '@playwright/test';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {completeProjectFixture} from '../fixtures.js';
import {f8Corpus} from '../f8-fixtures.js';
import {projectForCv,canonical} from '../../src/domain/index.js';
import {encodeCvproj,decodeCvproj} from '../../src/adapters/cvproj.js';
const hash=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
async function harness(){
 const directory=await mkdtemp('/tmp/cvforge-f8-ui-'),errors:string[]=[],requests:string[]=[];let app:ElectronApplication,page:Page;
 const launch=async()=>{app=await electron.launch({env:{...process.env,GDK_BACKEND:'x11',GTK_USE_PORTAL:'0'},...process.env.CVFORGE_F8_EXECUTABLE?{executablePath:process.env.CVFORGE_F8_EXECUTABLE}:{},args:[...process.env.CVFORGE_F8_EXECUTABLE?[]:[process.cwd()],'--user-data-dir='+directory,'--no-sandbox','--ozone-platform=x11'],timeout:30000});page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});app.context().on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await expect(page.getByRole('heading',{name:'Tu biblioteca',exact:true})).toBeVisible();return page;};
 const close=async()=>{const exited=app.waitForEvent('close');await page.evaluate(()=>window.close());await exited;};await launch();
 return {get page(){return page;},get app(){return app;},directory,errors,requests,async restart(){await close();return launch();},async choose(name:string){const path=join(directory,name);await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},path);return path;},async dispose(){await page.screenshot({path:test.info().outputPath('final-'+directory.split('/').pop()+'.png'),fullPage:true}).catch(()=>{});try{await close();}catch{await app.close();}await writeFile(test.info().outputPath('errors-'+directory.split('/').pop()+'.json'),JSON.stringify(errors));await writeFile(test.info().outputPath('requests-'+directory.split('/').pop()+'.json'),JSON.stringify(requests));await rm(directory,{recursive:true,force:true});expect(errors).toEqual([]);expect(requests).toEqual([]);}};
}
async function importFile(page:Page,buffer:Uint8Array,name:string,confirm=true){
 await page.getByRole('button',{name:'Importar archivo',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(buffer)});await expect(dialog.getByRole('button',{name:'Confirmar importación',exact:true})).toBeEnabled();
 if(confirm){await dialog.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(dialog).not.toBeVisible();}return dialog;
}
async function current(page:Page){return page.evaluate(async()=>{const l=await window.cvforge.list();if(!l.ok)throw Error(l.error.code);const v=await window.cvforge.open(l.value.cvs.at(-1)!.id);if(!v.ok)throw Error(v.error.code);return v.value.cv;});}
const contentHash=(cv:Awaited<ReturnType<typeof current>>)=>{const {presentation,revision,updatedAt,...content}=cv;return hash(canonical(content));};
async function select(page:Page,id:string){await page.getByRole('button',{name:'Presentación',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Plantilla',{exact:true}).selectOption(id);await expect(dialog.getByLabel('Color de acento')).toBeVisible();await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(dialog).not.toBeVisible();}
async function seeded(rig:Awaited<ReturnType<typeof harness>>){const f=completeProjectFixture();if(f.snapshot.scope!=='workspace')throw Error();const p=projectForCv(f.snapshot,f.snapshot.workspace.cvOrder[0]!);if(p.scope!=='cv')throw Error();const cv=f8Corpus().find(c=>c.name==='custom')!.cv;cv.presentation.templateRef=p.cv.presentation.templateRef;cv.name='F8 synthetic library';p.cv=cv;await importFile(rig.page,encodeCvproj({...f,snapshot:p},f.ctx.now()),'synthetic.cvproj');}
test('F8 selector preserves content hash, preview/export bytes for both templates and durable receipts after restart',async()=>{
 const rig=await harness();let page=rig.page;try{
  await seeded(rig);const before=await current(page);await select(page,'simple');await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();let preview=page.getByRole('region',{name:'Vista previa PDF',exact:true});const metrics=[];
  for(const template of ['simple','lateral']){
   if(template==='lateral')await select(page,template);await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});expect(contentHash(await current(page))).toBe(contentHash(before));
   const digest=await preview.getAttribute('data-sha256'),path=await rig.choose(template+'.pdf');await preview.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(preview.locator('[data-export-sha256]')).toHaveAttribute('data-export-sha256',digest!);expect(hash(await readFile(path))).toBe(digest);await writeFile(test.info().outputPath(template+'.pdf'),await readFile(path));
   metrics.push({template,...await preview.evaluate(el=>({...((el as HTMLElement).dataset)}))});await page.screenshot({path:test.info().outputPath(template+'-preview.png'),fullPage:true});
  }
  const records=await page.evaluate(async id=>window.cvforge.pdfRecords(id),before.id);expect(records.ok&&records.value.length).toBe(2);if(!records.ok)throw Error();for(const r of records.value)expect(hash(await readFile(join(rig.directory,r.templateRef.id+'.pdf')))).toBe(r.sha256);
  await rig.app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true,filePath:''});});await preview.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(preview.locator('[data-export-sha256]')).toHaveCount(0);expect(await page.evaluate(async id=>window.cvforge.pdfRecords(id),before.id)).toEqual(records);
  await page.getByRole('button',{name:'Presentación',exact:true}).click();await page.getByRole('dialog').getByLabel('Plantilla',{exact:true}).selectOption('simple');await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();expect((await current(page)).presentation.templateRef.id).toBe('lateral');
  page=await rig.restart();await page.getByRole('complementary').getByRole('button',{name:/F8 synthetic library/}).click();const after=await current(page);expect(after.presentation.templateRef.id).toBe('lateral');expect(contentHash(after)).toBe(contentHash(before));expect(await page.evaluate(async id=>window.cvforge.pdfRecords(id),before.id)).toEqual(records);
  await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();preview=page.getByRole('region',{name:'Vista previa PDF',exact:true});await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});await preview.locator('summary').filter({hasText:'Registro de exportaciones'}).click();await expect(preview).toContainText(records.value[0]!.sha256);
  await writeFile(test.info().outputPath('preview-metrics.json'),JSON.stringify(metrics,null,2));
 }finally{await rig.dispose();}
});
test('F8 actual exported PDF and cvproj open in independent empty libraries after review/cancel/confirm and real reopening',async()=>{
 const a=await harness();let b:Awaited<ReturnType<typeof harness>>|undefined,c:Awaited<ReturnType<typeof harness>>|undefined;
 try{
  await seeded(a);await select(a.page,'lateral');const original=await current(a.page);await a.page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();const preview=a.page.getByRole('region',{name:'Vista previa PDF',exact:true});await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});const digest=await preview.getAttribute('data-sha256'),pdfPath=await a.choose('portable.pdf');await preview.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(preview.locator('[data-export-sha256]')).toHaveAttribute('data-export-sha256',digest!);const pdf=await readFile(pdfPath);
  const projectPath=await a.choose('full.cvproj');await a.page.getByRole('button',{name:'Exportar proyecto (.cvproj)',exact:true}).click();await expect(a.page.getByRole('status').filter({hasText:'Proyecto completo exportado'})).toBeVisible();const project=await readFile(projectPath),decoded=decodeCvproj(project);expect(decoded.snapshot.scope).toBe('cv');if(decoded.snapshot.scope==='cv')expect(decoded.snapshot.cv).toEqual(original);
  b=await harness();let page=b.page;let d=await importFile(page,pdf,'portable.pdf',false);await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();await expect(d).not.toBeVisible();expect(await page.evaluate(async()=>{const r=await window.cvforge.list();return r.ok?r.value.cvs.length:-1;})).toBe(0);
  await importFile(page,pdf,'portable.pdf');const imported=await current(page);expect(imported.presentation.templateRef.id).toBe('lateral');expect(imported.personalInformation.displayName).toBe(original.personalInformation.displayName);expect(Object.keys(imported.sectionsById).length).toBe(original.sectionOrder.length);expect(imported.personalInformation.photo).not.toBeNull();
  page=await b.restart();await page.getByRole('complementary').getByRole('button',{name:/portable/}).click();await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();await expect(page.getByRole('region',{name:'Vista previa PDF',exact:true})).toHaveAttribute('data-state','ready',{timeout:30000});
  c=await harness();await importFile(c.page,project,'backup.cvproj');const copy=await current(c.page);expect(copy.presentation.templateRef.id).toBe('lateral');expect(copy.sensitiveTranslationMemory).not.toEqual({});expect(copy.personalInformation.photo).not.toBeNull();page=await c.restart();await page.getByRole('complementary').getByRole('button',{name:/F8 synthetic library/}).click();expect((await current(page)).presentation.templateRef.id).toBe('lateral');
 }finally{if(c)await c.dispose();if(b)await b.dispose();await a.dispose();}
});
test('F8 a new name-only CV renders one Lateral page without empty section blocks or a reserved photo gap',async()=>{
 const rig=await harness();try{
  const page=rig.page;await page.getByRole('button',{name:'Crear CV',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel(/^Nombre del CV/).fill('Minimal F8');await dialog.getByLabel(/^Nombre para mostrar/).fill('Minimal synthetic Ștefan');await dialog.getByRole('button',{name:'Crear CV',exact:true}).click();await expect(dialog).not.toBeVisible();
  await select(page,'lateral');await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();const preview=page.getByRole('region',{name:'Vista previa PDF',exact:true});await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});await expect(preview).toHaveAttribute('data-page-count','1');await expect(preview.locator('.textLayer')).toContainText('Minimal synthetic Ștefan');
 }finally{await rig.dispose();}
});
