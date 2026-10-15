// Investigación con reloj simulado; no altera el sistema ni los controles reales.
import {browser,URL,cookies,exact} from './cierre-helpers.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const ROOT='/tmp/europass-simulacion-48h';mkdirSync(ROOT,{recursive:true});
const mode=process.argv[2]??'smoke';
const timers=mode==='timers';
const cases=timers?[['49h-timers',49*3600000]]:mode==='matrix'?[['47h59m',48*3600000-60000],['48h',48*3600000],['48h01m',48*3600000+60000]]:[['control',0],['49h',49*3600000]];
const log=(stage,data={})=>console.log(JSON.stringify({stage,...data}));
const results=[];const b=await browser();
async function storage(p){
 const raw=await p.evaluate(()=>({session:Object.entries(sessionStorage),local:Object.entries(localStorage)}));const report={};
 for(const [kind,entries] of Object.entries(raw))report[kind]=entries.map(([key,value])=>{
  const entry={key,bytes:value.length,sha256:createHash('sha256').update(value).digest('hex')};
  try{const parsed=JSON.parse(value);entry.type=Array.isArray(parsed)?'array':typeof parsed;if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))entry.topKeys=Object.keys(parsed).slice(0,18);if(typeof parsed==='number'&&parsed>1500000000000&&parsed<2500000000000)entry.timestampIso=new Date(parsed).toISOString();if(typeof parsed==='string'&&/^\d{4}-\d\d-\d\dT/.test(parsed)&&Number.isFinite(Date.parse(parsed)))entry.timestampIso=new Date(parsed).toISOString();}catch{if(/^\d{13}$/.test(value))entry.timestampIso=new Date(Number(value)).toISOString();else if(/^\d{4}-\d\d-\d\dT/.test(value)&&Number.isFinite(Date.parse(value)))entry.timestampIso=new Date(value).toISOString();}
  return entry;
 });return report;
}
async function landing(p){
 await p.reload({waitUntil:'domcontentloaded',timeout:40000});await p.getByRole('button',{name:'Start from scratch',exact:true}).waitFor({timeout:20000});await p.waitForTimeout(1300);
 return {clientNow:await p.evaluate(()=>Date.now()),resumeAvailable:await p.locator('a').filter({hasText:/resume last draft CV/i}).count()>0,expiryNotice:(await p.locator('body').innerText()).split('\n').filter(s=>/48 hours|draft|resume/i.test(s)),storage:await storage(p)};
}
async function recover(p,marker){
 const resume=p.locator('a').filter({hasText:/resume last draft CV/i});if(!await resume.count())return false;await resume.click();await p.waitForTimeout(1200);const beta=p.getByRole('button',{name:'Try the new CV builder (beta)',exact:true});if(await beta.isVisible())await beta.click();await p.locator('#filename-input').waitFor({timeout:20000});await p.waitForTimeout(800);return (await p.locator('body').innerText()).includes(marker);
}
try{
 for(const [label,offsetMs] of cases){
  const c=await b.newContext({viewport:{width:1280,height:1000},locale:'en-US',timezoneId:'Europe/Madrid',serviceWorkers:'block'});const p=await c.newPage();p.setDefaultTimeout(18000);const base=Math.floor(Date.now()/1000)*1000;const result={label,offsetMs,hostStartedAt:new Date().toISOString(),baseClientTime:new Date(base).toISOString(),method:timers?'page.clock.install + fastForward':'page.clock.setFixedTime',pageErrors:[]};p.on('pageerror',e=>result.pageErrors.push(e.message.slice(0,300)));
  try{
   if(timers)await p.clock.install({time:base});else await p.clock.setFixedTime(base);await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});await p.getByRole('button',{name:'Start from scratch',exact:true}).waitFor();await cookies(p);await p.getByRole('button',{name:'Start from scratch',exact:true}).click();await p.waitForTimeout(1000);await p.getByRole('button',{name:'Try the new CV builder (beta)',exact:true}).click();await p.locator('button[aria-haspopup="menu"]').first().click();await p.getByRole('menuitem').filter({hasText:/Edit/}).first().click();await p.getByRole('textbox',{name:'First name',exact:true}).fill('Prueba');await p.getByRole('textbox',{name:'Last name',exact:true}).fill('Reloj Simulado');await p.getByRole('textbox',{name:'Last name',exact:true}).press('Tab');await exact(p,'Save').filter({visible:true}).last().click();await p.locator('#filename-input').waitFor();await p.waitForTimeout(1000);
   result.savedMarkerVisible=(await p.locator('body').innerText()).includes('Prueba Reloj Simulado');result.afterSaveStorage=await storage(p);result.baseline=await landing(p);result.baseline.markerRecovered=await recover(p,'Prueba Reloj Simulado');if(!result.savedMarkerVisible||!result.baseline.markerRecovered)throw Error('Control previo sin recuperación; no se interpreta la edad simulada');log('baseline',{label,recovered:result.baseline.markerRecovered});
   result.clientBeforeJump=await p.evaluate(()=>Date.now());if(timers)await p.clock.fastForward(offsetMs);else await p.clock.setFixedTime(base+offsetMs);result.simulated=await landing(p);result.simulated.clockMatches=timers?Math.abs(result.simulated.clientNow-result.clientBeforeJump-offsetMs)<60000:result.simulated.clientNow===base+offsetMs;await p.screenshot({path:ROOT+'/'+label+'-landing.png'});result.simulated.markerRecovered=await recover(p,'Prueba Reloj Simulado');
   if(offsetMs){if(timers)await p.clock.setSystemTime(base);else await p.clock.setFixedTime(base);result.clockRestored=await landing(p);result.clockRestored.markerRecovered=await recover(p,'Prueba Reloj Simulado');}
   result.hostFinishedAt=new Date().toISOString();log('simulation-result',result);
  }catch(e){result.error=e.message.slice(0,900);log('simulation-error',result);}finally{results.push(result);writeFileSync(ROOT+'/'+mode+'.json',JSON.stringify(results,null,2));await c.close();}
 }
}finally{await b.close();}
