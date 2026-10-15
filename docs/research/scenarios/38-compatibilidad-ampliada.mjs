// Controles ficticios de compatibilidad; no es un importador de la aplicación propia.
import {browser,URL,cookies,exact,log} from './cierre-helpers.mjs';
import {writeFileSync,readdirSync} from 'node:fs';
const ROOT='/tmp/europass-seguimiento';
const b=await browser();const results=[];
try{
 const request=await b.newContext();
 const publicUrl='https://www.eeas.europa.eu/sites/default/files/documents/2025/Europass-cv-en%20template_0.pdf';
 try{const r=await request.request.get(publicUrl,{timeout:35000});const body=await r.body();if(r.ok()&&body.subarray(0,5).toString()==='%PDF-'){writeFileSync(ROOT+'/corpus/plantilla-publica-eeas.pdf',body);log('public-fixture',{status:r.status(),bytes:body.length,url:publicUrl});}else log('public-fixture-unavailable',{status:r.status()});}catch(e){log('public-fixture-unavailable',{message:e.message.slice(0,200)});}await request.close();
 const files=readdirSync(ROOT+'/corpus').filter(f=>f.endsWith('.pdf')).sort().map(f=>[f,ROOT+'/corpus/'+f]);files.push(['estandar.pdf',ROOT+'/estandar.pdf']);
 for(const [label,file] of files){
  const c=await b.newContext({viewport:{width:1280,height:1000},locale:'en-US',serviceWorkers:'block'});const p=await c.newPage();p.setDefaultTimeout(10000);
  try{
   await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});await cookies(p);await p.getByRole('button',{name:'Start by uploading a Europass CV',exact:true}).click();await p.locator('input[type="file"]').setInputFiles(file);await p.waitForTimeout(300);
   const s=exact(p,'Save').last();const enabled=await s.isEnabled();if(enabled)await s.click();
   await Promise.race([p.locator('#filename-input').waitFor({timeout:12000}),p.getByText(/not Europass compliant|not supported|invalid file|password/i).first().waitFor({timeout:12000})]).catch(()=>{});await p.waitForTimeout(500);
   const body=await p.locator('body').innerText();const result={label,saveEnabled:enabled,inEditor:await p.locator('#filename-input').count()>0,errors:body.split('\n').map(s=>s.trim()).filter(s=>/not Europass|not supported|invalid file|password|maximum|exceed|file size|compliant/i.test(s)).slice(-8),personalSection:body.includes('Personal information'),titleCount:await p.getByRole('heading').count()};results.push(result);log('compatibility',result);
  }catch(e){const result={label,error:e.message.slice(0,350)};results.push(result);log('compatibility',result);}finally{writeFileSync(ROOT+'/compatibilidad-rea.json',JSON.stringify(results,null,2));await c.close();}
 }
}finally{writeFileSync(ROOT+'/compatibilidad-rea.json',JSON.stringify(results,null,2));await b.close();}
