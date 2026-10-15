// Respuestas HTTP fabricadas solo dentro de un contexto propio de Playwright.
// No afirma que 404/410 sean el contrato real de caducidad de Europass.
import {browser,URL,cookies,exact} from './cierre-helpers.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT='/tmp/europass-simulacion-48h';mkdirSync(ROOT,{recursive:true});const results=[];
const log=(stage,data={})=>console.log(JSON.stringify({stage,...data}));
const b=await browser();
try{
 const c=await b.newContext({viewport:{width:1280,height:1000},locale:'en-US',serviceWorkers:'block'});const p=await c.newPage();p.setDefaultTimeout(18000);await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});await p.getByRole('button',{name:'Start from scratch',exact:true}).waitFor();await cookies(p);await p.getByRole('button',{name:'Start from scratch',exact:true}).click();await p.waitForTimeout(900);await p.getByRole('button',{name:'Try the new CV builder (beta)',exact:true}).click();await p.locator('button[aria-haspopup="menu"]').first().click();await p.getByRole('menuitem').filter({hasText:/Edit/}).first().click();await p.getByRole('textbox',{name:'First name',exact:true}).fill('Prueba');await p.getByRole('textbox',{name:'Last name',exact:true}).fill('Fallo Simulado');await p.getByRole('textbox',{name:'Last name',exact:true}).press('Tab');await exact(p,'Save').filter({visible:true}).last().click();await p.locator('#filename-input').waitFor();await p.waitForTimeout(1200);
 const reference=await p.evaluate(()=>sessionStorage.getItem('backup-cv-id'));if(!reference)throw Error('Sin referencia propia para el control');const id=JSON.parse(reference);if(typeof id!=='string')throw Error('Referencia inesperada');const api=new globalThis.URL('/europass/eportfolio/api/eprofile/cv/'+encodeURIComponent(id),'https://europa.eu').href;
 for(const status of [200,404,410,200]){
  await p.unroute(api);await p.evaluate(value=>sessionStorage.setItem('backup-cv-id',value),reference);let interceptions=0;const responses=[];
  if(status!==200)await p.route(api,async route=>{if(route.request().method()==='GET'){interceptions++;await route.fulfill({status,contentType:'application/json',body:'{}'});}else await route.continue();});
  const onResponse=response=>{if(response.url()===api)responses.push({method:response.request().method(),status:response.status()});};p.on('response',onResponse);
  await p.reload({waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Start from scratch',exact:true}).waitFor();await p.waitForTimeout(1700);const text=await p.locator('body').innerText();const resume=p.locator('a').filter({hasText:/resume last draft CV/i});const result={expectedStatus:status,source:status===200?'real-service':'local-fulfill',interceptions,responses,resumeAvailable:await resume.count()>0,backupReferencePresent:await p.evaluate(()=>!!sessionStorage.getItem('backup-cv-id')),messages:text.split('\n').map(s=>s.trim()).filter(s=>/draft|48 hours|error|expired|not found|try again|unavailable|not available/i.test(s)).slice(-8)};
  if(status===200&&result.resumeAvailable){await resume.click();await p.waitForTimeout(1100);const beta=p.getByRole('button',{name:'Try the new CV builder (beta)',exact:true});if(await beta.isVisible())await beta.click();await p.locator('#filename-input').waitFor();await p.waitForTimeout(600);result.markerRecovered=(await p.locator('body').innerText()).includes('Prueba Fallo Simulado');}
  results.push(result);log('unavailable-response',result);writeFileSync(ROOT+'/respuestas-simuladas.json',JSON.stringify(results,null,2));p.off('response',onResponse);
 }
}catch(e){log('error',{message:e.message.slice(0,1200)});process.exitCode=1;}finally{writeFileSync(ROOT+'/respuestas-simuladas.json',JSON.stringify(results,null,2));await b.close();}
