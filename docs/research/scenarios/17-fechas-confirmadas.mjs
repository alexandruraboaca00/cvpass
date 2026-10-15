import {browser,imported,edit,cancel,fields,log,exact,save,exportPdf} from './cierre-helpers.mjs';
const b=await browser();try{
 const p=await imported(b);await edit(p,4);
 const d=p.locator('input[placeholder="DD-MM-YYYY"]:not([aria-label])');log('native-dates',{count:await d.count()});
 for(const value of ['31-02-2025','2025','02-2025','15-06-2025']){
  await d.first().fill(value);await d.first().press('Tab');await p.waitForTimeout(400);log('native-date',{input:value,fields:await fields(p),saveEnabled:await exact(p,'Save').last().isEnabled(),messages:(await p.locator('body').innerText()).split('\n').filter(x=>/invalid|valid date|date.*before|start.*end|mandatory/i.test(x)&&!x.includes('example.invalid'))});
 }
 await d.last().fill('01-01-2024');await d.last().press('Tab');await p.waitForTimeout(400);log('native-reverse',{fields:await fields(p),enabled:await exact(p,'Save').last().isEnabled(),text:(await p.locator('body').innerText()).split('Customise your CV')[0].slice(0,1900)});
 log('reverse-save',{result:await save(p)});if(await exact(p,'Save').count())await cancel(p);
 await edit(p,4);log('dates-after-save',{fields:await fields(p)});await d.first().fill('15-06-2025');await d.first().press('Tab');await d.last().fill('16-06-2025');await d.last().press('Tab');log('valid-range-save',{result:await save(p)});
 await exportPdf(p,'fechas-confirmadas');
 log('menu-ids',{items:await p.locator('button[aria-haspopup="menu"]').evaluateAll(es=>es.map(e=>({id:e.id,label:e.getAttribute('aria-label')})))});
}catch(e){log('error',{message:e.message.slice(0,1500)});process.exitCode=1;}finally{await b.close();}
