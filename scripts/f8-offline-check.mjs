import {spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
import {join} from 'node:path';
import {connect} from 'node:net';
import assert from 'node:assert/strict';
if(!process.argv.includes('--isolated')){
 const result=spawnSync('unshare',['--user','--map-current-user','--keep-caps','--net','sh','-c','ip link set lo up && exec "$@"','cvforge-f8-offline',process.execPath,fileURLToPath(import.meta.url),'--isolated'],{stdio:'inherit'});
 if(result.error)throw result.error;process.exit(result.status??1);
}
const output=process.env.CVFORGE_F8_OFFLINE_OUTPUT??'/tmp/cvforge-f8/offline';await mkdir(output,{recursive:true});
const interfaces=Object.keys(networkInterfaces()),routes=(await readFile('/proc/net/route','utf8')).trim().split('\n');assert(interfaces.every(n=>n==='lo'));assert.equal(routes.length,1);
const external=await new Promise(resolve=>{const socket=connect({host:'1.1.1.1',port:443});socket.once('connect',()=>{socket.destroy();resolve('CONNECTED');});socket.once('error',e=>resolve(e.code));socket.setTimeout(1000,()=>{socket.destroy();resolve('TIMEOUT');});});assert.equal(external,'ENETUNREACH');
const env={...process.env,CVFORGE_UI_PLATFORM:'x11',CVFORGE_F4_OUTPUT:join(output,'ui'),CVFORGE_F4_REPORT:join(output,'ui/report.json'),CVFORGE_F8_OUTPUT:join(output,'pdf'),CVFORGE_F7_OUTPUT:join(output,'simple')};
const run=(name,command,args)=>{const result=spawnSync(command,args,{env,encoding:'utf8',maxBuffer:30*1024*1024});return writeFile(join(output,name+'.log'),(result.stdout??'')+(result.stderr??'')).then(()=>{if(result.error)throw result.error;assert.equal(result.status,0,name+' failed: '+join(output,name+'.log'));console.log(name+' PASS');});};
await run('tests',process.execPath,['--test',...(await readdir('dist/tests')).filter(f=>f.endsWith('.test.js')).map(f=>'dist/tests/'+f)]);
await run('ui','npm',['exec','--','playwright','test','--config','playwright.config.ts']);
await run('pdf-render',process.execPath,['scripts/f8-render-check.mjs']);
await run('pdf-inspect',process.execPath,['scripts/f8-inspect-pdfs.mjs']);
await run('simple-render',process.execPath,['scripts/f7-render-check.mjs']);
await run('simple-inspect',process.execPath,['scripts/f7-inspect-pdfs.mjs']);
await run('simple-equivalence',process.execPath,['scripts/ui-pdf-equivalence.mjs','/tmp/cvforge-f8/baseline/pdf',join(output,'simple'),join(output,'simple-equivalence.json')]);
await writeFile(join(output,'network-proof.json'),JSON.stringify({method:'unshare --user --map-current-user --keep-caps --net; loopback for local CDP only',interfaces,routes,external,localPipeline:true},null,2));
console.log('F8 full offline PASS '+output);
