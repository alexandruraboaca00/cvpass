import {URL,cookies,exact,expandAll} from './cierre-helpers.mjs';
export async function inspectImport(b,label,file,waitMs=18000){
 const c=await b.newContext({viewport:{width:1280,height:1000},locale:'en-US',serviceWorkers:'block'});const p=await c.newPage();p.setDefaultTimeout(18000);const pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message.slice(0,400)));
 try{
  const start=p.getByRole('button',{name:'Start by uploading a Europass CV',exact:true});let attempts=0;
  for(let i=0;i<2;i++){attempts++;await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});try{await start.waitFor({timeout:18000});await cookies(p);await start.click();break;}catch(e){if(i===1)throw e;}}
  await p.locator('input[type="file"]').setInputFiles(file);await p.waitForTimeout(250);const s=exact(p,'Save').last();const enabled=await s.isEnabled();if(enabled)await s.click();
  await p.waitForFunction(()=>!!document.querySelector('#filename-input')||/not Europass|compliant|password|not supported/i.test(document.body.innerText),{},{timeout:waitMs}).catch(()=>{});await p.waitForTimeout(800);
  const inEditor=await p.locator('#filename-input').count()>0;if(inEditor)await expandAll(p);const text=await p.locator('body').innerText();
  return {label,loadAttempts:attempts,saveEnabled:enabled,inEditor,errors:text.split('\n').map(s=>s.trim()).filter(s=>/not Europass|compliant|password|not supported|invalid file|error/i.test(s)).slice(-5),pageErrors,hasFictiveCertification:text.includes('REA certifications'),hasFictiveProject:text.includes('REA projects'),hasFictiveCustomSection:text.includes('REA sección propia'),entryMenuCount:await p.locator('button[aria-haspopup="menu"]').count(),template:inEditor?await p.locator('select').filter({has:p.locator('option[value="dynamic-cv-1"]')}).inputValue():null,uploadDialogStillOpen:!inEditor&&await p.locator('input[type="file"]').count()>0};
 }catch(e){return {label,error:e.message.slice(0,700),pageErrors};}finally{await c.close();}
}
