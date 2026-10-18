import { spawnSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createConnection } from 'node:net';
import assert from 'node:assert/strict';

if (!process.argv.includes('--isolated')) {
  // Preserve the invoking UID for desktop D-Bus authentication; keep namespace
  // capabilities only long enough for the local loopback setup across exec(ip).
  const result=spawnSync('unshare',['--user','--map-current-user','--keep-caps','--net','sh','-c','ip link set lo up && exec "$@"','cvforge-f7-network',process.execPath,fileURLToPath(import.meta.url),'--isolated'],{stdio:'inherit'});
  if(result.error)throw result.error;process.exit(result.status ?? 1);
}
// Playwright controls Chromium through loopback CDP; no external interface or route.
const interfaces=networkInterfaces(),route=await readFile('/proc/net/route','utf8');
assert(interfaces.lo?.length,'Loopback is required for local CDP');
assert(Object.keys(interfaces).every(name=>name==='lo'));
assert.equal(route.trim().split('\n').length,1,'An external route exists');
const externalError=await new Promise(resolve=>{const socket=createConnection({host:'1.1.1.1',port:443});socket.setTimeout(2000);socket.once('connect',()=>{socket.destroy();resolve('CONNECTED');});socket.once('error',error=>resolve(error.code));socket.once('timeout',()=>{socket.destroy();resolve('TIMEOUT');});});
assert.equal(externalError,'ENETUNREACH');
const output=process.env.CVFORGE_F7_OFFLINE_OUTPUT ?? '/tmp/cvforge-f7-offline-results';await mkdir(output,{recursive:true});
const receipt={method:'Linux user + network namespace; lo up only for local CDP; no external interface or route',interfaces:Object.keys(interfaces),externalTcp:externalError,route:route.trim()};
const checks=[];
for(const phase of ['f4','f5','f6','f7']){
  const directory=join(output,phase);
  const result=spawnSync('npm',['run',`test:${phase}:ui`],{stdio:'inherit',env:{...process.env,CVFORGE_UI_PLATFORM:'x11',CVFORGE_F4_OUTPUT:directory,CVFORGE_F4_REPORT:join(directory,'report.json')}});
  checks.push({suite:phase+'-ui',exitCode:result.status});
  await writeFile(join(output,'network-proof.json'),JSON.stringify({...receipt,checks},null,2)+'\n');
  if(result.error)throw result.error;assert.equal(result.status,0,'Offline editor workflows failed');
}
const node=spawnSync(process.execPath,['--test',...(await readdir('dist/tests')).filter(f=>f.endsWith('.test.js')).map(f=>'dist/tests/'+f)],{stdio:'inherit'});
checks.push({suite:'f2-f7-domain-application',exitCode:node.status});
await writeFile(join(output,'network-proof.json'),JSON.stringify({...receipt,checks},null,2)+'\n');
if(node.error)throw node.error;assert.equal(node.status,0,'Offline domain/application workflows failed');
console.log(JSON.stringify(receipt));

for(const script of ['scripts/f7-render-check.mjs','scripts/f7-inspect-pdfs.mjs']){
 const check=spawnSync(process.execPath,[script],{stdio:'inherit',env:{...process.env,CVFORGE_F7_OUTPUT:join(output,'pdf')}});checks.push({suite:script,exitCode:check.status});await writeFile(join(output,'network-proof.json'),JSON.stringify({...receipt,checks},null,2)+'\n');if(check.error)throw check.error;assert.equal(check.status,0,'Offline PDF rendering/inspection failed');
}
