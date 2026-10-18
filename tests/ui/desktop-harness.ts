import { test, expect, chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';


export async function desktopHarness() {
  const directory=await mkdtemp('/tmp/cvforge-f5-desktop-');
  let browser:Browser,page:Page,child:ChildProcess;
  const cleanup=()=>{if(child?.pid&&child.exitCode===null&&child.signalCode===null){try{process.kill(-child.pid,'SIGKILL');}catch{/* already exited */}}};
  process.once('exit',cleanup);
  const logs:string[]=[],errors:string[]=[],remoteRequests:string[]=[];
  const launch=async()=>{
    const platform=process.env.CVFORGE_UI_PLATFORM;if(platform&&!['x11','wayland'].includes(platform))throw Error('Unsupported test display platform');
    const executable=createRequire(import.meta.url)('electron') as string;
    child=spawn(executable,[process.cwd(),'--user-data-dir='+directory,'--remote-debugging-port=0','--no-sandbox','--cvforge-diagnostics',...platform?['--ozone-platform='+platform]:[]],{detached:true,stdio:['ignore','pipe','pipe']});
    const endpoint=await new Promise<string>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Electron CDP startup timed out: '+logs.join(''))),30000);
      child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error('Electron exited before CDP: '+code+' '+logs.join('')));});
      child.stdout!.on('data',data=>logs.push(String(data)));child.stderr!.on('data',data=>{const text=String(data);logs.push(text);const match=/DevTools listening on (ws:\/\/[^\s]+)/.exec(text);if(match){clearTimeout(timer);resolve(match[1]!);}});
    });
    browser=await chromium.connectOverCDP(endpoint);
    const context=browser.contexts()[0]!;page=context.pages()[0] ?? await context.waitForEvent('page');
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/^https?:/.test(request.url()))remoteRequests.push(request.url());});
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await expect(page.getByRole('heading',{name:/^(Tu biblioteca|Your library)$/})).toBeVisible();
    return page;
  };
  const close=async()=>{
    if(child.exitCode !== null || child.signalCode !== null)return;
    const exited=once(child,'exit');
    await page.evaluate(()=>window.close());
    const [code]=await exited;expect(code).toBe(0);await browser.close();
  };
  await launch();
  return {get page(){return page;},directory,logs,errors,
    async crash(){const exited=once(child,'exit');process.kill(-child.pid!,'SIGKILL');await exited;await browser.close();},
    async submitAndRestart(){const exited=once(child,'exit');await page.evaluate(()=>{window.document.querySelector<HTMLFormElement>('dialog form')!.requestSubmit();window.close();});const [code]=await exited;expect(code).toBe(0);await browser.close();return launch();},
    async restart(){await close();return launch();},
    async dispose(){try{await close();}catch{cleanup();}process.off('exit',cleanup);await writeFile(test.info().outputPath('electron.log'),logs.join(''));await writeFile(test.info().outputPath('renderer-errors.json'),JSON.stringify(errors));await writeFile(test.info().outputPath('remote-requests.json'),JSON.stringify(remoteRequests));await rm(directory,{recursive:true,force:true});expect(remoteRequests).toEqual([]);},
    async read(){
      await close();
      const {SqliteLibraryRepository}=await import(pathToFileURL(join(process.cwd(),'dist/src/adapters/sqlite/repository.js')).href);
      const repository=await SqliteLibraryRepository.open(join(directory,'library'));
      try{return {record:await repository.read(),health:await repository.health()};}finally{await repository.close();}
    },
  };
}
