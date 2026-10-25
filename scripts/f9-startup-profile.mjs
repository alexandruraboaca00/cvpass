// Diagnostic only. Official acceptance remains scripts/f9-performance.mjs.
import {_electron as electron} from '@playwright/test';
import {mkdir,readFile,writeFile,mkdtemp,cp,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {f9Workspace} from '../dist/tests/f9-fixtures.js';
import {SqliteLibraryRepository} from '../dist/src/adapters/sqlite/repository.js';
import {LibraryService} from '../dist/src/application/library.js';
import {cvprojCodec} from '../dist/src/adapters/library-cvproj.js';
import {loadSimpleResources} from '../dist/src/adapters/pdf/resources.js';
const output=process.env.CVFORGE_STARTUP_OUTPUT??'/tmp/cvforge-f9-startup/profile';await mkdir(output,{recursive:true});
const data=process.env.CVFORGE_STARTUP_DATA;assert(data,'SSD data directory required');await mkdir(data,{recursive:true});
const cases=JSON.parse(await readFile(process.argv[2],'utf8')),n=Number(process.env.CVFORGE_STARTUP_REPETITIONS??5);
const ctx={newId:randomUUID,now:()=>new Date().toISOString()},seed=f9Workspace(),resources=await loadSimpleResources('resources/fonts');
for(const cv of Object.values(seed.snapshot.workspace.cvsById))cv.presentation.templateRef={id:'simple',version:1};seed.snapshot.templates=[resources.template];Object.assign(seed.snapshot.assetsById,resources.resources.assetsById);for(const[h,b]of resources.resources.blobs)seed.blobs.set(h,b);
const encoded=cvprojCodec.encode(seed,'2026-10-23T12:00:00.000Z'),base=await mkdtemp(join(data,'seed-')),repo=await SqliteLibraryRepository.open(join(base,'library')),lib=new LibraryService(repo,ctx,cvprojCodec);await lib.initialize();await lib.importCvproj(encoded,{mode:'emptyWorkspace'});await repo.close();
const samples=[];
for(let i=0;i<n;i++)for(const c of cases){
 const dir=await mkdtemp(join(data,'run-')),trace=join(output,c.name+'-'+i);await cp(join(base,'library'),join(dir,'library'),{recursive:true});
 const env={...process.env,APPIMAGELAUNCHER_DISABLE:'1',GDK_BACKEND:'x11',GTK_USE_PORTAL:'0'};delete env.CVFORGE_STARTUP_TRACE;delete env.APPIMAGE_EXTRACT_AND_RUN;if(c.trace)env.CVFORGE_STARTUP_TRACE=trace;if(c.extract)env.APPIMAGE_EXTRACT_AND_RUN='1';
 let active;const started=process.hrtime.bigint();try{
 active=await electron.launch({chromiumSandbox:true,executablePath:c.executable??resolve('node_modules/electron/dist/electron'),env,args:[...(c.directory?[c.directory]:[]),'--user-data-dir='+dir,'--ozone-platform=x11'],timeout:60000});
 const launched=process.hrtime.bigint(),page=await active.firstWindow();await page.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();await page.getByRole('complementary').locator('.cv-list li').nth(99).waitFor({state:'attached'});const ready=process.hrtime.bigint();
 const runtime=await active.evaluate(({app})=>({version:app.getVersion(),noSandbox:app.commandLine.hasSwitch('no-sandbox'),extract:process.env.APPIMAGE_EXTRACT_AND_RUN==='1',fuse:process.getBuiltinModule('fs').readFileSync('/proc/self/mountinfo','utf8').split('\n').some(line=>line.split(' ')[4]===process.env.APPDIR&&line.includes('fuse'))}));assert.equal(runtime.noSandbox,false);if(!c.directory){assert.equal(runtime.extract,!!c.extract);if(!c.extract)assert(runtime.fuse,'Normal run must use FUSE, never a hidden extraction fallback');}
 const browser=await page.evaluate(()=>({timing:performance.getEntries().filter(e=>['navigation','paint','mark','resource'].includes(e.entryType)).map(e=>e.toJSON()),viewport:{width:innerWidth,height:innerHeight}}));
 const events=[];for(const f of await readdir(output))if(f.startsWith(c.name+'-'+i+'.')&&f.endsWith('.json'))events.push(JSON.parse(await readFile(join(output,f),'utf8')));
 const row={name:c.name,repetition:i+1,ms:Number(ready-started)/1e6,launchMs:Number(launched-started)/1e6,startedNs:started.toString(),readyNs:ready.toString(),events,browser,runtime};samples.push(row);await writeFile(join(output,'samples.json'),JSON.stringify({diagnostic:true,seedSha256:createHash('sha256').update(encoded).digest('hex'),cases,samples},null,2));console.log(c.name+' '+(i+1)+' '+row.ms.toFixed(1)+' ms');
 const closed=active.waitForEvent('close');await page.evaluate(()=>window.close());await closed;active=undefined;
 }finally{if(active)await active.close();}
}
