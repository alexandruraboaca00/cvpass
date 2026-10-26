import {spawnSync} from 'node:child_process';
import {readFile,writeFile,stat,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.platform,'linux');assert.equal(process.arch,'x64');
const epoch=process.env.SOURCE_DATE_EPOCH??'1792756800'; // 2026-10-23 12:00 UTC
assert(/^\d+$/.test(epoch));
const env={...process.env,SOURCE_DATE_EPOCH:epoch};
const hasIcon=await access('assets/icons/256x256.png').then(()=>true,()=>false);
if(!hasIcon)console.warn('CVPass branding master missing: provisional build uses Electron default icon. See assets/branding/README.md.');
for(const args of [['run','build'],['exec','--','electron-builder','--linux','AppImage','--x64','--config','electron-builder.yml','--publish','never',...(hasIcon?['--config.linux.icon=assets/icons']:[])]]){
 const result=spawnSync('npm',args,{env,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);
}
const metadata=JSON.parse(await readFile('package.json','utf8')),name=`CVPass-${metadata.version}-x86_64.AppImage`,path='out/f9/'+name,bytes=await readFile(path),sha256=createHash('sha256').update(bytes).digest('hex');
await writeFile(path+'.sha256',sha256+'  '+name+'\n');
await writeFile('out/f9/SHA256SUMS',sha256+'  '+name+'\n');
await writeFile('SHA256SUMS',sha256+'  '+name+'\n');
await writeFile('out/f9/release.json',JSON.stringify({version:metadata.version,artifact:name,byteLength:(await stat(path)).size,sha256,sourceDateEpoch:Number(epoch),electron:metadata.devDependencies.electron,builder:metadata.devDependencies['electron-builder']},null,2));
console.log(JSON.stringify({artifact:path,sha256,bytes:bytes.length,sourceDateEpoch:epoch}));
