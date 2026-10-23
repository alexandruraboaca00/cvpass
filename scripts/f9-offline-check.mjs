import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import {connect} from 'node:net';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
if(!process.argv.includes('--isolated')){const r=spawnSync('unshare',['--user','--map-current-user','--keep-caps','--net','sh','-c','ip link set lo up && exec setpriv --bounding-set=-all --inh-caps=-all --ambient-caps=-all "$@"','cvforge-f9-offline',process.execPath,fileURLToPath(import.meta.url),'--isolated',...process.argv.slice(2)],{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);}
const output=process.env.CVFORGE_F9_OUTPUT??'/tmp/cvforge-f9/final-offline';await mkdir(output,{recursive:true});
const interfaces=Object.keys(networkInterfaces()),routes=(await readFile('/proc/net/route','utf8')).trim().split('\n');assert(interfaces.every(i=>i==='lo'));assert.equal(routes.length,1);
assert(/^CapEff:\s+0+$/m.test(await readFile('/proc/self/status','utf8')),'Acceptance must run without effective capabilities');
const external=await new Promise(r=>{const s=connect({host:'1.1.1.1',port:443});s.once('connect',()=>{s.destroy();r('CONNECTED');});s.once('error',e=>r(e.code));s.setTimeout(1000,()=>{s.destroy();r('TIMEOUT');});});assert.equal(external,'ENETUNREACH');
const env={...process.env,APPIMAGELAUNCHER_DISABLE:'1',CVFORGE_UI_PLATFORM:'x11',CVFORGE_F1_OUTPUT:join(output,'f1'),CVFORGE_F4_OUTPUT:join(output,'ui'),CVFORGE_F4_REPORT:join(output,'ui/report.json'),CVFORGE_F9_PACKAGE_OUTPUT:join(output,'package'),CVFORGE_F9_LAUNCH_OUTPUT:join(output,'normal-launch'),CVFORGE_F8_OUTPUT:join(output,'pdf'),CVFORGE_F7_OUTPUT:join(output,'simple'),CVFORGE_F9_PRIVATE_OUTPUT:join(output,'private')};
const run=async(name,command,args)=>{const r=spawnSync(command,args,{env,encoding:'utf8',maxBuffer:40*1024*1024});await writeFile(join(output,name+'.log'),(r.stdout??'')+(r.stderr??''));if(r.error)throw r.error;assert.equal(r.status,0,name+' failed: '+join(output,name+'.log'));console.log(name+' PASS');};
const resumedPrivateAudit=process.argv.includes('--resume-private');
if(resumedPrivateAudit){
 // Resume only the local privacy audit after a source-document redaction. Every
 // preceding receipt must belong to this exact AppImage and have no failures.
 const json=async p=>JSON.parse(await readFile(join(output,p),'utf8'));
 const proof=await json('package/proof.json');assert(proof.packagedUiPassed&&proof.effectiveCapabilitiesZero);assert.equal(proof.artifactSha256,createHash('sha256').update(await readFile('out/f9/CVForge-0.1.0-x86_64.AppImage')).digest('hex'));
 for(const [p,n] of [['ui/report.json',23],['package/ui/report.json',7]]){const r=await json(p);assert.equal(r.stats.expected,n);assert.equal(r.stats.unexpected+r.stats.skipped+r.stats.flaky+r.errors.length,0);}
 for(const [p,n] of [['f1.log',3],['tests.log',170]]){const s=await readFile(join(output,p),'utf8');assert(s.includes('pass '+n)&&s.includes('fail 0'));}
 for(const [p,n] of [['pdf/inspection.json',26],['simple/inspection.json',7]]){const r=await json(p);assert.equal(r.results.length,n);assert(r.results.every(r=>r.payloadMatches));}
 assert((await json('simple-equivalence.json')).results.every(r=>r.equalExceptExistingClockDates));assert((await json('normal-launch/results.json')).results.every(r=>r.pass&&r.noSandboxDisabled));
 console.log('Prior F1/tests/UI/AppImage/PDF receipts verified for the same artifact; resuming private audit');
}else{
await run('f1','unshare',['--user','--map-current-user','--net',process.execPath,'spikes/f1/offline-check.cjs']);
await run('tests',process.execPath,['--test',...(await readdir('dist/tests')).filter(f=>f.endsWith('.test.js')).map(f=>'dist/tests/'+f)]);
await run('ui','npm',['exec','--','playwright','test','--config','playwright.config.ts','f4.spec.ts','f5.spec.ts','f6.spec.ts','f7.spec.ts','f8.spec.ts','layout.spec.ts','visibility.spec.ts']);
await run('appimage',process.execPath,['scripts/f9-package-check.mjs']);
await run('normal-launch',process.execPath,['scripts/f9-launch-check.mjs']);
await run('pdf-render',process.execPath,['scripts/f8-render-check.mjs']);await run('pdf-inspect',process.execPath,['scripts/f8-inspect-pdfs.mjs']);
await run('simple-render',process.execPath,['scripts/f7-render-check.mjs']);await run('simple-inspect',process.execPath,['scripts/f7-inspect-pdfs.mjs']);
await run('simple-equivalence',process.execPath,['scripts/ui-pdf-equivalence.mjs','/tmp/cvforge-f8/baseline/pdf',join(output,'simple'),join(output,'simple-equivalence.json')]);
}
if(process.env.CVFORGE_F9_PRIVATE_INPUT_FILE){const paths=JSON.parse(await readFile(process.env.CVFORGE_F9_PRIVATE_INPUT_FILE,'utf8'));assert.equal(paths.length,2);await run('private',process.execPath,['scripts/f9-private-check.mjs',...paths]);}
await writeFile(join(output,'network-proof.json'),JSON.stringify({interfaces,routes,external,effectiveCapabilitiesZero:true,resumedPrivateAudit,method:'unshare user/network namespace; loopback only for CDP; drop capabilities before tests and AppImage',localPipeline:true},null,2));
console.log('F9 full offline regression PASS '+resolve(output));
