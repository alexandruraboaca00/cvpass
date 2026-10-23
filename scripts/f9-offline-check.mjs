import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import {connect} from 'node:net';
import assert from 'node:assert/strict';
if(!process.argv.includes('--isolated')){const r=spawnSync('unshare',['--user','--map-current-user','--keep-caps','--net','sh','-c','ip link set lo up && exec setpriv --bounding-set=-all --inh-caps=-all --ambient-caps=-all "$@"','cvforge-f9-offline',process.execPath,fileURLToPath(import.meta.url),'--isolated'],{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);}
const output=process.env.CVFORGE_F9_OUTPUT??'/tmp/cvforge-f9/final-offline';await mkdir(output,{recursive:true});
const interfaces=Object.keys(networkInterfaces()),routes=(await readFile('/proc/net/route','utf8')).trim().split('\n');assert(interfaces.every(i=>i==='lo'));assert.equal(routes.length,1);
assert(/^CapEff:\s+0+$/m.test(await readFile('/proc/self/status','utf8')),'Acceptance must run without effective capabilities');
const external=await new Promise(r=>{const s=connect({host:'1.1.1.1',port:443});s.once('connect',()=>{s.destroy();r('CONNECTED');});s.once('error',e=>r(e.code));s.setTimeout(1000,()=>{s.destroy();r('TIMEOUT');});});assert.equal(external,'ENETUNREACH');
const env={...process.env,APPIMAGELAUNCHER_DISABLE:'1',CVFORGE_UI_PLATFORM:'x11',CVFORGE_F1_OUTPUT:join(output,'f1'),CVFORGE_F4_OUTPUT:join(output,'ui'),CVFORGE_F4_REPORT:join(output,'ui/report.json'),CVFORGE_F9_PACKAGE_OUTPUT:join(output,'package'),CVFORGE_F9_LAUNCH_OUTPUT:join(output,'normal-launch'),CVFORGE_F8_OUTPUT:join(output,'pdf'),CVFORGE_F7_OUTPUT:join(output,'simple'),CVFORGE_F9_PRIVATE_OUTPUT:join(output,'private')};
const run=async(name,command,args)=>{const r=spawnSync(command,args,{env,encoding:'utf8',maxBuffer:40*1024*1024});await writeFile(join(output,name+'.log'),(r.stdout??'')+(r.stderr??''));if(r.error)throw r.error;assert.equal(r.status,0,name+' failed: '+join(output,name+'.log'));console.log(name+' PASS');};
await run('f1','unshare',['--user','--map-current-user','--net',process.execPath,'spikes/f1/offline-check.cjs']);
await run('tests',process.execPath,['--test',...(await readdir('dist/tests')).filter(f=>f.endsWith('.test.js')).map(f=>'dist/tests/'+f)]);
await run('ui','npm',['exec','--','playwright','test','--config','playwright.config.ts','f4.spec.ts','f5.spec.ts','f6.spec.ts','f7.spec.ts','f8.spec.ts','layout.spec.ts','visibility.spec.ts']);
await run('appimage',process.execPath,['scripts/f9-package-check.mjs']);
await run('normal-launch',process.execPath,['scripts/f9-launch-check.mjs']);
await run('pdf-render',process.execPath,['scripts/f8-render-check.mjs']);await run('pdf-inspect',process.execPath,['scripts/f8-inspect-pdfs.mjs']);
await run('simple-render',process.execPath,['scripts/f7-render-check.mjs']);await run('simple-inspect',process.execPath,['scripts/f7-inspect-pdfs.mjs']);
await run('simple-equivalence',process.execPath,['scripts/ui-pdf-equivalence.mjs','/tmp/cvforge-f8/baseline/pdf',join(output,'simple'),join(output,'simple-equivalence.json')]);
if(process.env.CVFORGE_F9_PRIVATE_INPUT_FILE){const paths=JSON.parse(await readFile(process.env.CVFORGE_F9_PRIVATE_INPUT_FILE,'utf8'));assert.equal(paths.length,2);await run('private',process.execPath,['scripts/f9-private-check.mjs',...paths]);}
await writeFile(join(output,'network-proof.json'),JSON.stringify({interfaces,routes,external,effectiveCapabilitiesZero:true,method:'unshare user/network namespace; loopback only for CDP; drop capabilities before tests and AppImage',localPipeline:true},null,2));
console.log('F9 full offline regression PASS '+resolve(output));
