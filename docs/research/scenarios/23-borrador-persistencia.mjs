import {chromium,ROOT,URL,FIXTURE,cookies,exact,edit,save,log} from './cierre-helpers.mjs';
import {mkdtempSync} from 'node:fs';
const profile=mkdtempSync(`${ROOT}/perfil-borrador-`);let c;
async function start(){c=await chromium.launchPersistentContext(profile,{executablePath:'/opt/google/chrome/chrome',headless:true,viewport:{width:1280,height:1000},locale:'en-US',serviceWorkers:'block'});const p=c.pages()[0]??await c.newPage();p.setDefaultTimeout(12000);return p;}
async function state(p,stage){const text=await p.locator('body').innerText();log(stage,{text:text.slice(0,2500),buttons:await p.locator('button').filter({visible:true}).allTextContents(),confirmed:text.includes('REA CONFIRMADO SESION'),draft:text.includes('REA BORRADOR SIN GUARDAR')});}
async function resume(p){const link=p.locator('a').filter({hasText:/resume last draft CV/i});log('resume-link',{count:await link.count()});if(await link.count()===1){await link.click();await p.waitForTimeout(1800);}const beta=p.getByRole('button',{name:'Try the new CV builder (beta)',exact:true});if(await beta.isVisible()){await beta.click();await p.waitForTimeout(3000);}}
try{
 let p=await start();await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});await cookies(p);await p.getByRole('button',{name:'Start by uploading a Europass CV',exact:true}).click();await p.locator('input[type="file"]').setInputFiles(FIXTURE);await exact(p,'Save').last().click();await p.locator('#filename-input').waitFor();await p.waitForTimeout(1500);
 await edit(p,2);await p.locator('input#title').fill('REA CONFIRMADO SESION');await p.locator('#filename-input').click();log('confirmed-save',{result:await save(p)});await p.waitForTimeout(2200);
 await edit(p,2);await p.locator('input#title').fill('REA BORRADOR SIN GUARDAR');await p.locator('#filename-input').click();await p.waitForTimeout(1200);
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);await state(p,'after-reload');await resume(p);await state(p,'after-resume');
 await c.close();p=await start();await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});await p.waitForTimeout(2500);await state(p,'after-browser-restart');await resume(p);await state(p,'after-restart-resume');
}catch(e){log('error',{message:e.message.slice(0,2000)});process.exitCode=1;}finally{if(c)await c.close();}
