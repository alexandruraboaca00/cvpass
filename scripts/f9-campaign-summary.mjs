// No sample filtering. Three independent, complete official campaigns are
// required; pooling is information only and cannot override an individual FAIL.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [output,...paths]=process.argv.slice(2);assert(output&&paths.length===3,'output and exactly three results.json paths required');
const reports=await Promise.all(paths.map(async path=>JSON.parse(await readFile(path,'utf8'))));
const runnerSha256=createHash('sha256').update(await readFile('scripts/f9-performance.mjs')).digest('hex');
assert.equal(runnerSha256,'5441ee4ed607620c896aae372154a8d205cf35a9d31f0c27982afde09e4806b2');
for(const r of reports){
  assert.equal(r.metrics.confirm.n,20);assert.equal(r.metrics.startup.n,20);assert.equal(r.metrics.confirm.budgetMs,300);assert.equal(r.metrics.startup.budgetMs,3000);
  assert.equal(r.corpus.cvs,100);assert.equal(r.corpus.sourceProjectSha256,'83ae157d013de8c0423655186059076407449db8217d08659e892016b4577380');
  for(const key of ['sourceCommit','executableSha256','versions','machine','method','corpus'])assert.deepEqual(r[key],reports[0][key],key+' differs between campaigns');
}
function stats(samples){const s=[...samples].sort((a,b)=>a-b),p=n=>s[Math.ceil(s.length*n)-1];return {n:s.length,p50Ms:p(.5),p90Ms:p(.9),p95Ms:p(.95),maxMs:s.at(-1),samples};}
const campaigns=reports.map((r,i)=>({campaign:['A','B','C'][i],date:r.date,confirm:r.metrics.confirm,startup:r.metrics.startup,openCv:r.metrics.openCv,allBudgetsPass:Object.values(r.metrics).every(m=>m.status!=='FAIL')}));
const result={runnerSha256,sourceCommit:reports[0].sourceCommit,executableSha256:reports[0].executableSha256,versions:reports[0].versions,machine:reports[0].machine,corpus:reports[0].corpus,method:reports[0].method,campaigns,
  combinedConfirm:{...stats(reports.flatMap(r=>r.metrics.confirm.samples)),informationalOnly:true},
  stable:campaigns.every(r=>r.confirm.p95Ms<=300&&r.startup.p95Ms<=3000&&r.allBudgetsPass)};
await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({campaigns:campaigns.map(c=>({campaign:c.campaign,confirm:c.confirm.p95Ms,startup:c.startup.p95Ms,pass:c.allBudgetsPass})),combinedP95:result.combinedConfirm.p95Ms,stable:result.stable}));
if(!result.stable)process.exitCode=1;
