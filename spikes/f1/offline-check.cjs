// Runs entirely inside an unshared Linux network namespace, before Electron starts.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
async function main(){
 const root=process.env.CVFORGE_F1_OUTPUT;assert(root&&path.isAbsolute(root));fs.mkdirSync(root,{recursive:true});
 const routes=fs.readFileSync('/proc/net/route','utf8').trim().split('\n').slice(1);assert.equal(routes.length,0,'Namespace still has IPv4 routes');
 const interfaces=os.networkInterfaces();assert(Object.keys(interfaces).every(name=>name==='lo'));
 const externalConnection=await new Promise(resolve=>{const socket=net.connect({host:'1.1.1.1',port:443});socket.setTimeout(2000);socket.once('connect',()=>{socket.destroy();resolve('CONNECTED');});socket.once('error',e=>resolve(e.code));socket.once('timeout',()=>{socket.destroy();resolve('TIMEOUT');});});
 assert.notEqual(externalConnection,'CONNECTED');
 const executable=path.join(__dirname,'out/linux-unpacked/cvforge-f1-spike');
 const commands=[];
 for(const mode of ['create','reopen']){
  const args=['--closure',...(mode==='create'?['--create']:[])];
  const result=spawnSync(executable,args,{env:process.env,encoding:'utf8',timeout:180000,maxBuffer:10*1024*1024});
  fs.writeFileSync(path.join(root,`offline-${mode}.log`),(result.stdout||'')+(result.stderr||''));
  commands.push({mode,args,exitCode:result.status,signal:result.signal});
  console.log(`${mode}: exit ${result.status}`);if(result.status!==0){console.error(result.stdout,result.stderr);throw new Error(`Packaged ${mode} failed`);}
 }
 const tests=spawnSync(process.execPath,['--test',path.join(__dirname,'closure.test.cjs')],{env:process.env,encoding:'utf8',timeout:60000});
 fs.writeFileSync(path.join(root,'tests.log'),(tests.stdout||'')+(tests.stderr||''));console.log(tests.stdout,tests.stderr);assert.equal(tests.status,0);
 fs.writeFileSync(path.join(root,'offline-proof.json'),JSON.stringify({method:'unshare --user --map-current-user --net',routes,interfaces:Object.keys(interfaces),externalConnection,commands,testsExitCode:tests.status},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
