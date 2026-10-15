import {browser,imported,edit,option,save,cancel,fields,log,exact,exportPdf} from './cierre-helpers.mjs';
const b=await browser();
try{
 const p=await imported(b);
 await edit(p,4); // entrada Projects
 log('project-loaded',{fields:await fields(p)});
 const dates=p.locator('input[placeholder="DD-MM-YYYY"]').filter({visible:true});
 log('date-count',{count:await dates.count()});
 for(const sample of ['31-02-2025','2025','02-2025','15-06-2025']){
  const date=dates.first();await date.fill(sample);await date.press('Tab');await p.waitForTimeout(250);
  log('date-input',{sample,fields:await fields(p),saveEnabled:await exact(p,'Save').last().isEnabled(),messages:(await p.locator('body').innerText()).split('\n').filter(x=>/invalid|valid date|before|after|mandatory|format/i.test(x))});
 }
 if(await dates.count()>1){await dates.last().fill('01-01-2024');await dates.last().press('Tab');await p.waitForTimeout(300);log('reverse-dates',{fields:await fields(p),saveEnabled:await exact(p,'Save').last().isEnabled(),text:(await p.locator('body').innerText()).split('Customise your CV')[0].slice(-1700)});}
 const ongoing=p.locator('input[type="checkbox"]').filter({visible:true});if(await ongoing.count()){await ongoing.first().check({force:true});log('ongoing',{fields:await fields(p)});}
 await cancel(p);
 await edit(p,2);await p.locator('input#title').fill('   ');await p.locator('input#title').press('Tab');log('blank-title',{saveEnabled:await exact(p,'Save').last().isEnabled(),text:(await p.locator('body').innerText()).split('Customise your CV')[0].slice(-1200)});await cancel(p);
 // Recommendations se encuentra después de los ocho tipos precedentes.
 await edit(p,18);const description=p.locator('[contenteditable="true"]').filter({visible:true}).first();await description.click();await description.press('Control+a');await description.press('Backspace');await description.press('Tab');log('empty-recommendation',{fields:await fields(p),saveEnabled:await exact(p,'Save').last().isEnabled()});
 await description.click();await description.press('Control+a');await description.pressSequentially('Recomendación ficticia sin datos de contacto.');
 for(const id of ['name','email','role','recommendationphone']){const f=p.locator('input#'+id);if(await f.count())await f.fill('');}
 await description.press('Tab');log('recommendation-description-only',{result:await save(p)});
 await exportPdf(p,'validaciones');
}catch(e){log('error',{message:e.message});process.exitCode=1;}finally{await b.close();}
