import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { connect } from 'node:net';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const directory = await mkdtemp('/tmp/cvforge-f3-offline-');
const routes = (await readFile('/proc/net/route','utf8')).trim().split('\n').slice(1);
const interfaces = Object.keys(networkInterfaces());
assert.equal(routes.length,0); assert(interfaces.every(name=>name==='lo'));
const externalConnection = await new Promise(resolve => {
  const socket = connect({host:'1.1.1.1',port:443}); socket.setTimeout(2000);
  socket.once('connect',()=>{socket.destroy();resolve('CONNECTED');});
  socket.once('error',error=>resolve(error.code)); socket.once('timeout',()=>{socket.destroy();resolve('TIMEOUT');});
});
assert.equal(externalConnection,'ENETUNREACH');
const commands = [];
for (const [name,command,args] of [
  ['f3-tests','npm',['run','test:f3']],
  ['electron','node',['scripts/f3-electron-check.mjs']],
]) {
  const child = spawn(command,args,{env:process.env,stdio:['ignore','pipe','pipe']});
  let log=''; child.stdout.on('data',b=>{log+=b;}); child.stderr.on('data',b=>{log+=b;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),120000);
  const result = await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));}); clearTimeout(timer);
  await writeFile(join(directory,`${name}.log`),log); commands.push({name,command,args,...result});
  assert.equal(result.code,0,`Offline ${name} failed; inspect ${directory}/${name}.log`); console.log(`Offline ${name}: PASS`);
}
const proof={method:'unshare --user --map-current-user --net before starting Node/Electron',routes,interfaces,externalConnection,commands};
await writeFile(join(directory,'proof.json'),JSON.stringify(proof,null,2)+'\n'); console.log(JSON.stringify({output:directory,...proof}));
