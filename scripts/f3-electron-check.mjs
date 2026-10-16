import { mkdtemp, readdir, mkdir, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(fileURLToPath(new URL('..',import.meta.url)));
const source = join(root,'spikes/f1/out/linux-unpacked');
const directory = await mkdtemp('/tmp/cvforge-f3-electron-'), runtime = join(directory,'runtime');
await mkdir(runtime);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const before = hash(await readFile(join(source,'resources/app.asar')));
async function linkTree(from,to) {
  await mkdir(to,{recursive:true});
  for (const entry of await readdir(from,{withFileTypes:true})) {
    if (entry.isDirectory()) await linkTree(join(from,entry.name),join(to,entry.name));
    else await copyFile(join(from,entry.name),join(to,entry.name));
  }
}
// Reuse the closed F1 runtime without modifying any F1 file or launching its app.
for (const entry of await readdir(source,{withFileTypes:true})) {
  if (entry.name === 'resources') continue;
  if (entry.isDirectory()) await linkTree(join(source,entry.name),join(runtime,entry.name));
  else await copyFile(join(source,entry.name),join(runtime,entry.name));
}
const app = join(runtime,'resources/app'); await mkdir(app,{recursive:true});
await writeFile(join(app,'package.json'),JSON.stringify({name:'cvforge-f3-technical-probe',version:'0.0.1',main:'main.cjs'}));
await writeFile(join(app,'main.cjs'),`require(${JSON.stringify(join(root,'scripts/f3-electron-main.cjs'))});\n`);
await mkdir(join(directory,'userData'));
try {
  for (const mode of ['create','reopen']) {
    const args = mode === 'create' ? ['--create'] : [];
    const child = spawn(join(runtime,'cvforge-f1-spike'),args,{env:{...process.env,CVFORGE_F3_OUTPUT:directory},stdio:['ignore','pipe','pipe']});
    let log = ''; child.stdout.on('data',b => {log += b;}); child.stderr.on('data',b => {log += b;});
    const timer = setTimeout(() => child.kill('SIGKILL'),60000);
    const status = await new Promise((resolve,reject) => {child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));}); clearTimeout(timer);
    await writeFile(join(directory,`${mode}.log`),log); assert.equal(status.code,0,`Electron ${mode} failed: ${status.signal ?? ''}; inspect ${directory}/${mode}.log`);
    console.log(`Electron ${mode}: PASS`);
  }
  assert.equal(hash(await readFile(join(source,'resources/app.asar'))),before);
  const proof = {method:'two real Electron main processes, dedicated SQLite workers, technical harness without renderer',f1AsarUnchanged:true,...JSON.parse(await readFile(join(directory,'electron-reopen.json'),'utf8'))};
  await writeFile(join(directory,'proof.json'),JSON.stringify(proof,null,2)+'\n'); console.log(JSON.stringify({output:directory,...proof}));
} finally { await rm(runtime,{recursive:true,force:true}); }
