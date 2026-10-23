// Reproducible product benchmark. Run alone, after build/package, inside the
// offline driver. No thresholds are invented here: budgets come from NF-05.
import {_electron as electron} from '@playwright/test';
import {readFile,writeFile,mkdir,cp,mkdtemp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {cpus,totalmem,release,platform,networkInterfaces} from 'node:os';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {f9Workspace} from '../dist/tests/f9-fixtures.js';
import {xmlBytes,syntheticPdf} from '../dist/tests/f6/fixtures.js';
import {SqliteLibraryRepository} from '../dist/src/adapters/sqlite/repository.js';
import {LibraryService} from '../dist/src/application/library.js';
import {cvprojCodec} from '../dist/src/adapters/library-cvproj.js';
import {loadSimpleResources} from '../dist/src/adapters/pdf/resources.js';

const output=process.env.CVFORGE_F9_PERF_OUTPUT??'/tmp/cvforge-f9/performance';await mkdir(output,{recursive:true});
const dataRoot=process.env.CVFORGE_F9_PERF_DATA??output;await mkdir(dataRoot,{recursive:true});
const repetitions=Number(process.env.CVFORGE_F9_PERF_REPETITIONS??20);assert(Number.isInteger(repetitions)&&repetitions>=5);
const executable=resolve(process.env.CVFORGE_F9_EXECUTABLE??'out/f9/CVForge-0.1.0-x86_64.AppImage');
const ctx={newId:randomUUID,now:()=>new Date().toISOString()},seed=f9Workspace(),resources=await loadSimpleResources('resources/fonts');assert.equal(seed.snapshot.scope,'workspace');
for(const cv of Object.values(seed.snapshot.workspace.cvsById))cv.presentation.templateRef={id:'simple',version:1};
// Only Simple is initially referenced. Lateral installs itself on selection.
seed.snapshot.templates=[resources.template];
Object.assign(seed.snapshot.assetsById,resources.resources.assetsById);for(const [h,b] of resources.resources.blobs)seed.blobs.set(h,b);
const seedBytes=cvprojCodec.encode(seed,'2026-10-23T12:00:00.000Z'),base=await mkdtemp(join(dataRoot,'baseline-')),repo=await SqliteLibraryRepository.open(join(base,'library')),lib=new LibraryService(repo,ctx,cvprojCodec);await lib.initialize();await lib.importCvproj(seedBytes,{mode:'emptyWorkspace'});await repo.close();
const doc=await PDFDocument.load(await syntheticPdf([{name:'renamed.data',bytes:xmlBytes()}]));doc.addPage().drawText('Synthetic import page 2');doc.addPage().drawText('Synthetic import page 3');const input=Array.from(await doc.save());
const results={startup:[],library:[],openCv:[],confirm:[],importAnalysis:[],importCommit:[],importTotal:[],previewSimple:[],previewLateral:[],previewSimpleWithDebounce:[],previewLateralWithDebounce:[],exportSimple:[],exportLateral:[],exportLongSimple:[],exportLongLateral:[],typing:[]},details=[];
let versions,active;
const hash=b=>createHash('sha256').update(b).digest('hex');
const executableSha256=hash(await readFile(executable)),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const interfaces=Object.keys(networkInterfaces()),routes=(await readFile('/proc/net/route','utf8')).trim().split('\n');assert(interfaces.every(i=>i==='lo'));assert.equal(routes.length,1);
let viewport;
async function ok(p){const r=await p;if(!r.ok)throw Error(r.error.code);return r.value;}
async function select(page,cvId){await page.getByRole('complementary').getByRole('button',{name:/F9 002 medium/}).click();await page.getByRole('heading',{name:'F9 002 medium',exact:true}).waitFor();return (await ok(page.evaluate(id=>window.cvforge.open(id),cvId))).cv;}
try{
 for(let i=0;i<repetitions;i++){
  const dir=await mkdtemp(join(dataRoot,'run-'));await cp(join(base,'library'),join(dir,'library'),{recursive:true});
  const start=performance.now();active=await electron.launch({chromiumSandbox:true,executablePath:executable,env:{...process.env,APPIMAGELAUNCHER_DISABLE:'1',APPIMAGE_EXTRACT_AND_RUN:'1',GDK_BACKEND:'x11',GTK_USE_PORTAL:'0'},args:['--user-data-dir='+dir,'--ozone-platform=x11'],timeout:60000});
  const page=await active.firstWindow();await page.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();await page.getByRole('complementary').locator('.cv-list li').nth(99).waitFor({state:'attached'});results.startup.push(performance.now()-start);
  assert.equal(await active.evaluate(({app})=>app.commandLine.hasSwitch('no-sandbox')),false);
  viewport??=await page.evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}));
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));active.context().on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  versions??=await active.evaluate(({app})=>({app:app.getVersion(),electron:process.versions.electron,node:process.versions.node,chromium:process.versions.chrome}));
  let t=performance.now(),view=await ok(page.evaluate(()=>window.cvforge.list()));results.library.push(performance.now()-t);assert.equal(view.cvs.length,100);const cvId=view.cvs[1].id;
  t=performance.now();let cv=await select(page,cvId);results.openCv.push(performance.now()-t);
  // Timing the durable IPC boundary excludes typing, debounce and user think time.
  const confirmation=await page.evaluate(async({id,n})=>{const unwrap=r=>{if(!r.ok)throw Error(r.error.code);return r.value;};const cv=unwrap(await window.cvforge.open(id)).cv,f=unwrap(await window.cvforge.begin(id,cv.revision,{kind:'personal'}));f.cv.personalInformation.displayName='F9 benchmark '+n;unwrap(await window.cvforge.stage(f));unwrap(await window.cvforge.flush());const t=performance.now();unwrap(await window.cvforge.confirm(f));return performance.now()-t;},{id:cvId,n:i});results.confirm.push(confirmation);
  const imported=await page.evaluate(async data=>{const unwrap=r=>{if(!r.ok)throw Error(r.error.code);return r.value;},t=performance.now(),v=unwrap(await window.cvforge.importFile(crypto.randomUUID(),new Uint8Array(data),'benchmark-three-pages.pdf')),analysis=performance.now()-t;const s=performance.now();unwrap(await window.cvforge.importConfirm(v.id,{cv:v.draft.cv,rawDates:v.draft.rawDates,rawNumbers:v.draft.rawNumbers,documentLocale:v.draft.documentLocale,acknowledgeIssues:true}));return {analysis,commit:performance.now()-s};},input);results.importAnalysis.push(imported.analysis);results.importCommit.push(imported.commit);results.importTotal.push(imported.analysis+imported.commit);
  cv=await select(page,cvId);
  for(const template of ['simple','lateral']){
   await page.getByRole('button',{name:'Presentación',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel('Plantilla',{exact:true}).selectOption(template);await d.getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});
   cv=(await ok(page.evaluate(id=>window.cvforge.open(id),cvId))).cv;
   const panel=page.getByRole('region',{name:'Vista previa PDF',exact:true});if(!await panel.count())await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();
   await page.waitForFunction(revision=>{const p=document.querySelector('.pdf-preview');return p?.getAttribute('data-state')==='ready'&&p.getAttribute('data-revision')===String(revision);},cv.revision,{timeout:30000});
   const m=await panel.evaluate(el=>({...el.dataset}));assert(Number(m.pageCount)<=3);results[template==='simple'?'previewSimple':'previewLateral'].push(Number(m.previewMs)-400);results[template==='simple'?'previewSimpleWithDebounce':'previewLateralWithDebounce'].push(Number(m.previewMs));
   const path=join(dir,template+'.pdf');await active.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},path);
   const ms=await page.evaluate(async({id,sha})=>{const t=performance.now(),r=await window.cvforge.pdfExport(id,sha);if(!r.ok)throw Error(r.error.code);return performance.now()-t;},{id:m.generationId,sha:m.sha256});results[template==='simple'?'exportSimple':'exportLateral'].push(ms);assert.equal(hash(await readFile(path)),m.sha256);details.push({repetition:i+1,template,pages:Number(m.pageCount),bytes:Number(m.pdfBytes),snapshotToPdfMs:Number(m.pdfMs),previewMs:Number(m.previewMs),exportMs:ms,sha256:m.sha256});
  }
  if(i===0){
   await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();const d=page.getByRole('dialog'),field=d.getByLabel(/^Nombre para mostrar/);await field.focus();
   await page.evaluate(()=>{globalThis.__f9Typing=[];const input=document.activeElement;input.addEventListener('input',()=>{const t=performance.now();requestAnimationFrame(()=>globalThis.__f9Typing.push(performance.now()-t));});});
   await field.pressSequentially(' Keyboard performance acceptance ',{delay:25});results.typing.push(...await page.evaluate(()=>globalThis.__f9Typing));await d.getByRole('button',{name:'Cancelar',exact:true}).click();await d.waitFor({state:'hidden'});
   await page.screenshot({path:join(output,'100-cv-library.png'),fullPage:true});
   await page.getByRole('button',{name:'Cerrar preview',exact:true}).click();
   const longId=view.cvs[2].id;
   await page.evaluate(async id=>{const unwrap=r=>{if(!r.ok)throw Error(r.error.code);return r.value;},cv=unwrap(await window.cvforge.open(id)).cv;
    const s=Object.values(cv.sectionsById).find(s=>s.kind==='projects'),entry=s.entriesById[s.entryOrder[0]],f=unwrap(await window.cvforge.begin(id,cv.revision,{kind:'entry',sectionId:s.id,entryId:entry.id})),e=f.cv.sectionsById[s.id].entriesById[entry.id];
    const paragraphs=e.fields.description.current.value.content;e.fields.description.current.value.content=Array.from({length:4},()=>structuredClone(paragraphs)).flat();unwrap(await window.cvforge.stage(f));unwrap(await window.cvforge.flush());unwrap(await window.cvforge.confirm(f));
   },longId);
   for(const template of ['simple','lateral']){
    await page.evaluate(async({id,template})=>{const cv=(await window.cvforge.open(id)).value.cv,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=cv.presentation;const r=await window.cvforge.presentation(id,cv.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:template,version:1}});if(!r.ok)throw Error(r.error.code);},{id:longId,template});
    for(let j=0;j<repetitions;j++){
     const path=join(dir,'long-'+template+'.pdf');await active.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},path);
     const m=await page.evaluate(async id=>{const cv=(await window.cvforge.open(id)).value.cv,t=performance.now(),g=await window.cvforge.pdfGenerate(id,cv.revision);if(!g.ok)throw Error(g.error.code);const r=await window.cvforge.pdfExport(g.value.id,g.value.sha256);if(!r.ok)throw Error(r.error.code);return {ms:performance.now()-t,pages:g.value.metrics.pageCount,bytes:g.value.bytes.length,sha256:g.value.sha256};},longId);
     assert(m.pages>=10);assert.equal(hash(await readFile(path)),m.sha256);results[template==='simple'?'exportLongSimple':'exportLongLateral'].push(m.ms);details.push({kind:'long-generation-and-export',template,repetition:j+1,...m});
    }
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);const exit=active.waitForEvent('close');await page.evaluate(()=>window.close());await exit;active=undefined;
  console.log('F9 performance repetition '+(i+1)+'/'+repetitions+' complete');
  await writeFile(join(output,'samples-in-progress.json'),JSON.stringify({results,details},null,2));
 }
}finally{if(active)await active.close();}
const p95=v=>[...v].sort((a,b)=>a-b)[Math.ceil(v.length*.95)-1];
const budgets={startup:3000,confirm:300,importTotal:3000,previewSimple:2000,previewLateral:2000,exportLongSimple:5000,exportLongLateral:5000,typing:100};
const metrics=Object.fromEntries(Object.entries(results).map(([name,samples])=>[name,{n:samples.length,p95Ms:p95(samples),minMs:Math.min(...samples),maxMs:Math.max(...samples),budgetMs:budgets[name]??null,status:budgets[name]===undefined?'measured-no-prior-threshold':p95(samples)<=budgets[name]?'PASS':'FAIL',samples}]));
assert.equal(hash(await readFile(executable)),executableSha256);
const report={date:new Date().toISOString(),versions,executable,executableSha256,sourceCommit,offlineIsolation:{interfaces,routeCount:routes.length-1},corpus:{seed:'tests/f9-fixtures.ts',cvs:100,variants:6,sourceProjectSha256:hash(seedBytes),measuredCv:'medium: eight MVP areas and photo',newCvPerImport:1,inputPdfPages:3},method:{percentile:'nearest rank ceil(0.95*n), no trimming',repetitions,cold:'new process and new Electron profile each repetition; OS file cache not forcibly dropped',preview:'actual PDF.js ready; report both with and without existing 400ms debounce',confirm:'IPC durable confirmation after draft flush; ordinary user typing time excluded',export:'existing preview bytes, real fsync/rename and durable ExportRecord; controlled dialog excludes user choice time',library:'IPC list response; startup separately includes rendering the 100-item list',offline:'caller isolates network; renderer HTTP requests asserted empty',viewport},machine:{cpu:cpus()[0]?.model,logicalCpus:cpus().length,ramBytes:totalmem(),platform:platform(),kernel:release(),os:await readFile('/etc/os-release','utf8'),disk:execFileSync('findmnt',['-T',dataRoot,'-n','-o','FSTYPE'],{encoding:'utf8'}).trim()},metrics,details};
await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(Object.fromEntries(Object.entries(metrics).map(([k,v])=>[k,{p95Ms:v.p95Ms,status:v.status,n:v.n}]))));
