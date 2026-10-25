// Diagnostic, NOT the official benchmark: one process with progressive history.
// Copy its closed baseline, never the final mutated run from another campaign.
import {_electron as electron} from '@playwright/test';
import {readFile,writeFile,mkdir,mkdtemp,cp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const output=process.env.CVFORGE_F9_HISTORY_OUTPUT??'/tmp/cvforge-f9-history';await mkdir(output,{recursive:true});
const data=process.env.CVFORGE_F9_HISTORY_DATA;assert(data&&process.argv[2],'SSD data directory and closed baseline/library path required');await mkdir(data,{recursive:true});
const root=await mkdtemp(join(data,'history-'));await cp(process.argv[2],join(root,'library'),{recursive:true});
const executable=resolve('out/f9/CVForge-0.1.0-x86_64.AppImage'),sha=createHash('sha256').update(await readFile(executable)).digest('hex');
const app=await electron.launch({chromiumSandbox:true,executablePath:executable,args:['--user-data-dir='+root,'--ozone-platform=x11'],env:{...process.env,APPIMAGELAUNCHER_DISABLE:'1',APPIMAGE_EXTRACT_AND_RUN:'1',GDK_BACKEND:'x11',GTK_USE_PORTAL:'0',CVFORGE_CONFIRM_TRACE:join(output,'stages.ndjson')},timeout:60000});
const samples=[];
try{
  const page=await app.firstWindow();await page.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();
  const getCounts=()=>app.evaluate(({app})=>{
    const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json'),Database=require('better-sqlite3');
    const db=new Database(app.getPath('userData')+'/library/library.sqlite3',{readonly:true,fileMustExist:true});
    try{return {cvs:db.prepare("SELECT count(*) FROM entities WHERE kind='cv'").pluck().get(),revisions:db.prepare('SELECT count(*) FROM revisions').pluck().get(),drafts:db.prepare('SELECT count(*) FROM drafts').pluck().get(),pages:db.pragma('page_count',{simple:true}),freelist:db.pragma('freelist_count',{simple:true})};}finally{db.close();}
  });
  const initial=await getCounts();assert.equal(initial.cvs,100);assert.equal(initial.revisions,0);assert.equal(initial.drafts,0);
  for(let i=0;i<50;i++){
    const timing=await page.evaluate(async n=>{const ok=r=>{if(!r.ok)throw Error(r.error.code);return r.value;};const list=ok(await window.cvforge.list()),cv=ok(await window.cvforge.open(list.cvs[1].id)).cv,f=ok(await window.cvforge.begin(cv.id,cv.revision,{kind:'personal'}));f.cv.personalInformation.displayName='History diagnostic '+n;ok(await window.cvforge.stage(f));ok(await window.cvforge.flush());const start=performance.now(),startedAt=performance.timeOrigin+start;ok(await window.cvforge.confirm(f));const finishedAt=performance.timeOrigin+performance.now();return {ms:performance.now()-start,startedAt,finishedAt};},i);
    const state=await getCounts();assert.equal(state.revisions,i+1);assert.equal(state.drafts,0);assert.equal(state.cvs,100);samples.push({historyBefore:i,...timing,...state});
    await writeFile(join(output,'samples-in-progress.json'),JSON.stringify(samples));
  }
  const stat=v=>{const s=[...v].sort((a,b)=>a-b);return {n:s.length,p50:s[Math.ceil(s.length*.5)-1],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1)};};
  // Additional real form, reported separately from the 50 progressive samples.
  await page.getByRole('complementary').getByRole('button',{name:/F9 002 medium/}).click();
  await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();const dialog=page.getByRole('dialog');
  await dialog.getByLabel(/^Nombre para mostrar/).fill('History diagnostic real form');await page.evaluate(()=>window.cvforge.flush());
  await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.evaluate(()=>new Promise(requestAnimationFrame));
  const formStages=await page.evaluate(()=>performance.getEntriesByType('measure').filter(e=>e.name.startsWith('cvforge:confirm:')).map(e=>({stage:e.name,ms:e.duration})));
  assert.equal((await getCounts()).revisions,51);
  const result={diagnosticOnly:true,executableSha256:sha,method:'50 successive confirmations in one real AppImage process; same frozen medium CV and real local resources; new revision each time; counts outside timed interval on short-lived readonly connections; no explicit checkpoint; one additional real GUI form reported separately',initial,first10:stat(samples.slice(0,10).map(s=>s.ms)),last10:stat(samples.slice(-10).map(s=>s.ms)),samples,formStages};
  await writeFile(join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({first10:result.first10,last10:result.last10,final: samples.at(-1)}));
}finally{const exit=app.waitForEvent('close');const p=await app.firstWindow();await p.evaluate(()=>window.close());await exit;}
