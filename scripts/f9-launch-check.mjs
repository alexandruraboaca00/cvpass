// Normal default userData path, actual AppImage, outside the source checkout.
import {_electron as electron} from '@playwright/test';
import {mkdtemp,mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import assert from 'node:assert/strict';
const output=process.env.CVFORGE_F9_LAUNCH_OUTPUT??'/tmp/cvforge-f9/normal-launch';await mkdir(output,{recursive:true});const executable=resolve('out/f9/CVPass-0.1.0-x86_64.AppImage'),results=[];
// FUSE mounts are denied in the isolated user namespace on the acceptance host.
// Exercise the documented runtime fallback; do not spawn repeated native errors.
const modes=process.argv.includes('--host-fuse')?['fuse']:['extract-and-run'];
if(process.argv.includes('--host-fuse')){assert((await stat('/dev/fuse')).isCharacterDevice());assert(/^\s*0\s+0\s+4294967295\s*$/.test(await readFile('/proc/self/uid_map','utf8')),'Host FUSE check must run outside user namespaces');}
for(const mode of modes){
 const directory=await mkdtemp(join(output,'normal-')),config=join(directory,'config'),env={...process.env,APPIMAGELAUNCHER_DISABLE:'1',XDG_CONFIG_HOME:config};delete env.APPIMAGE_EXTRACT_AND_RUN;if(mode==='extract-and-run')env.APPIMAGE_EXTRACT_AND_RUN='1';
 let active;
 try{
  const launch=async()=>{active=await electron.launch({chromiumSandbox:true,executablePath:executable,cwd:directory,env,args:[],timeout:30000});const p=await active.firstWindow();await p.getByRole('heading',{name:'Tu biblioteca',exact:true}).waitFor();return p;};
  let page=await launch();await page.getByRole('button',{name:'Crear CV',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel(/^Nombre del CV/).fill('Normal AppImage launch');await d.getByLabel(/^Nombre para mostrar/).fill('Persona sintética');await d.getByRole('button',{name:'Crear CV',exact:true}).click();await d.waitFor({state:'hidden'});
  const metadata=await active.evaluate(({app})=>({version:app.getVersion(),name:app.getName(),userData:app.getPath('userData'),appPath:app.getAppPath(),noSandbox:app.commandLine.hasSwitch('no-sandbox'),noCapabilities:/^CapEff:\s+0+$/m.test(process.getBuiltinModule('fs').readFileSync('/proc/self/status','utf8'))}));assert(metadata.userData.startsWith(config+'/'));assert.equal(metadata.version,'0.1.0');assert.equal(metadata.name,'CVPass');assert.equal(basename(metadata.userData),'CVForge');assert.equal(metadata.noSandbox,false);assert(metadata.noCapabilities);
  let exit=active.waitForEvent('close');await page.evaluate(()=>window.close());await exit;active=undefined;page=await launch();await page.getByRole('complementary').getByRole('button',{name:/Normal AppImage launch/}).click();await page.getByRole('heading',{name:'Normal AppImage launch',exact:true}).waitFor({state:'visible',timeout:15000});assert.equal(await page.getByRole('heading',{name:'Normal AppImage launch',exact:true}).count(),1);await page.screenshot({path:join(directory,'reopened.png')});
  exit=active.waitForEvent('close');await page.evaluate(()=>window.close());await exit;active=undefined;results.push({mode,pass:true,normalDataDirectoryName:basename(metadata.userData),version:metadata.version,startedOutsideRepository:true,noUserDataSwitch:true,noSandboxDisabled:true,reopened:true});
 }catch(error){if(active)await active.close();if(mode!=='fuse')throw error;results.push({mode,pass:false,reason:/fuse/i.test(String(error))?'FUSE runtime unavailable':'normal launcher failed; diagnostic retained'});await writeFile(join(directory,'launch-error.txt'),String(error));}
}
assert(results.some(r=>r.pass));await writeFile(join(output,'results.json'),JSON.stringify({results},null,2));console.log(JSON.stringify(results));
