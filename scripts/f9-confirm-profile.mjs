// Diagnostic only. The official acceptance benchmark remains f9-performance.mjs.
import {_electron as electron} from '@playwright/test';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {f9Workspace} from '../dist/tests/f9-fixtures.js';
import {SqliteLibraryRepository} from '../dist/src/adapters/sqlite/repository.js';
import {LibraryService} from '../dist/src/application/library.js';
import {cvprojCodec} from '../dist/src/adapters/library-cvproj.js';
const output=process.env.CVFORGE_F9_PROFILE_OUTPUT??'/tmp/cvforge-f9/confirm-profile-before';await mkdir(output,{recursive:true});
const dataRoot=process.env.CVFORGE_F9_PROFILE_DATA??output;await mkdir(dataRoot,{recursive:true});
const directory=await mkdtemp(join(dataRoot,'library-')),ctx={newId:randomUUID,now:()=>new Date().toISOString()},repo=await SqliteLibraryRepository.open(join(directory,'library')),library=new LibraryService(repo,ctx,cvprojCodec);
await library.initialize();await library.importCvproj(cvprojCodec.encode(f9Workspace(),'2026-10-23T12:00:00.000Z'),{mode:'emptyWorkspace'});await repo.close();
const trace=join(output,'stages.ndjson'),app=await electron.launch({chromiumSandbox:true,executablePath:resolve(process.env.CVFORGE_F9_EXECUTABLE??'out/f9/linux-unpacked/cvforge'),env:{...process.env,CVFORGE_CONFIRM_TRACE:trace,APPIMAGELAUNCHER_DISABLE:'1',APPIMAGE_EXTRACT_AND_RUN:'1'},args:['--user-data-dir='+directory,'--ozone-platform=x11']});
const page=await app.firstWindow();await page.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();
const samples=[];
try{for(let i=0;i<10;i++)samples.push(await page.evaluate(async n=>{const ok=r=>{if(!r.ok)throw Error(r.error.code);return r.value;},v=ok(await window.cvforge.list()),cv=ok(await window.cvforge.open(v.cvs[1].id)).cv,f=ok(await window.cvforge.begin(cv.id,cv.revision,{kind:'personal'}));f.cv.personalInformation.displayName='Diagnostic synthetic '+n;ok(await window.cvforge.stage(f));ok(await window.cvforge.flush());const start=performance.now(),startedAt=performance.timeOrigin+start;ok(await window.cvforge.confirm(f));const finishedAt=performance.timeOrigin+performance.now(),ipc=performance.now()-start;const ui=performance.now();await new Promise(requestAnimationFrame);return {ipc,startedAt,finishedAt,uiFrame:performance.now()-ui};},i));

 await page.getByRole('complementary').getByRole('button',{name:/F9 002 medium/}).click();
 await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel(/^Nombre para mostrar/).fill('Diagnostic real form');await page.evaluate(()=>window.cvforge.flush());
 await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.evaluate(()=>new Promise(requestAnimationFrame));
 const formStages=await page.evaluate(()=>performance.getEntriesByType('measure').filter(x=>x.name.startsWith('cvforge:confirm:')).map(x=>({stage:x.name,ms:x.duration})));await writeFile(join(output,'form-stages.json'),JSON.stringify(formStages,null,2));
}finally{const exit=app.waitForEvent('close');await page.evaluate(()=>window.close());await exit;}
const traces=(await readFile(trace,'utf8')).trim().split('\n').map(JSON.parse),stages={};
for(const row of traces){const sum={};for(const t of row.timings)sum[t.stage]=(sum[t.stage]??0)+t.ms;for(const [k,v] of Object.entries(sum))(stages[k]??=[]).push(v);}
const stats=a=>{const s=[...a].sort((a,b)=>a-b);return {n:s.length,p50:s[Math.ceil(.5*s.length)-1],p90:s[Math.ceil(.9*s.length)-1],p95:s[Math.ceil(.95*s.length)-1],max:s.at(-1)};};
assert.equal(traces.length,11);for(let i=0;i<samples.length;i++){samples[i].requestIpc=traces[i].ipcReceivedAt-samples[i].startedAt;samples[i].responseIpc=samples[i].finishedAt-traces[i].replyReadyAt;}const results={corpus:'same f9Workspace(100), medium CV; 10 diagnostic confirmations in one real GUI process',confirm:stats(samples.map(s=>s.ipc)),requestIpc:stats(samples.map(s=>s.requestIpc)),responseIpc:stats(samples.map(s=>s.responseIpc)),uiFrame:stats(samples.map(s=>s.uiFrame)),stages:Object.fromEntries(Object.entries(stages).map(([k,v])=>[k,stats(v)])),samples};await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
