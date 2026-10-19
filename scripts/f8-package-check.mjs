import { listPackage } from '@electron/asar';
import { resolve, join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
if(!process.argv.includes('--isolated')){
 const result=spawnSync('unshare',['--user','--map-current-user','--keep-caps','--net','sh','-c','ip link set lo up && exec "$@"','cvforge-f8-package-network',process.execPath,fileURLToPath(import.meta.url),'--isolated'],{stdio:'inherit'});
 if(result.error)throw result.error;process.exit(result.status??1);
}
assert(Object.keys(networkInterfaces()).every(name=>name==='lo'));assert.equal((await readFile('/proc/net/route','utf8')).trim().split('\n').length,1);
const directory=process.env.CVFORGE_F8_PACKAGE_OUTPUT??'/tmp/cvforge-f8/package';await mkdir(directory,{recursive:true});
const root=resolve('out/f8/linux-unpacked'),asar=join(root,'resources/app.asar'),files=listPackage(asar),sha256=b=>createHash('sha256').update(b).digest('hex'),before=sha256(await readFile(asar));
for(const name of ['dist/src/adapters/pdf/lateral.js','dist/src/application/export-record.js','dist/src/desktop/main.js','dist/src/desktop/preload.cjs','dist/src/adapters/pdf/finalize-worker.js','resources/fonts/LiberationSans-Regular.ttf','resources/fonts/LiberationSans-BoldItalic.ttf','resources/fonts/OFL.txt','node_modules/pdf-lib/LICENSE.md','node_modules/pdfjs-dist/LICENSE'])assert(files.includes('/'+name),name);
assert(files.some(f=>/\/dist\/renderer\/assets\/pdf\.worker.*\.mjs$/.test(f)));
assert(!files.some(f=>/^\/(tests|docs|spikes|src|private|data|\.git)(\/|$)/.test(f)));
assert(!files.some(f=>/\.(pdf|cvproj|sqlite|db)$/i.test(f)));
const result=spawnSync('npm',['run','test:f8:ui'],{stdio:'inherit',env:{...process.env,CVFORGE_F8_EXECUTABLE:join(root,'cvforge'),CVFORGE_F4_OUTPUT:join(directory,'ui'),CVFORGE_F4_REPORT:join(directory,'ui/report.json')}});
assert.equal(result.status,0,'Packaged Linux UI/render/export/reopen failed');assert.equal(sha256(await readFile(asar)),before);
await writeFile(join(directory,'proof.json'),JSON.stringify({platform:'linux-x64',offline:'user/network namespace; loopback only; no external route',asarSha256:before,files:files.length,localFonts:true,pdfjsWorker:true,noPrivateFiles:true,noSourceTestsOrSpikes:true,realPackagedUiPassed:true,asarUnchanged:true},null,2));console.log('F8 packaged Linux PASS '+directory);
