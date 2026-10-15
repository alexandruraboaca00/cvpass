import {browser,imported,expandAll,option,save,fields,log,exact,exportPdf,edit,cancel} from './cierre-helpers.mjs';
const b=await browser();try{
 const p=await imported(b,'/tmp/europass-cierre-investigacion/fechas-confirmadas.pdf');await expandAll(p);
 await edit(p,2);
 const links=p.locator('input[id^="certifications-links-"]');
 if(await links.count()===1){await exact(p,'Add').last().click();}
 let blank=links.last();await blank.fill('esto-no-es-url');await blank.press('Tab');log('invalid-link',{saveEnabled:await exact(p,'Save').last().isEnabled(),addEnabled:await exact(p,'Add').last().isEnabled(),fields:await fields(p)});
 await blank.fill('https://example.invalid/rea-segundo');await blank.press('Tab');if(await exact(p,'Add').last().isEnabled())await exact(p,'Add').last().click();
 await links.last().fill('https://example.invalid/rea-tercero');await links.last().press('Tab');if(await exact(p,'Add').last().isEnabled())await exact(p,'Add').last().click();log('three-links-save',{result:await save(p)});
 const types=['certifications','projects','publication','conference-seminar','creative-works','hobbies-interests','honour-award','membership','recommendation','social-or-political-activity','volunteering','custom-section'];
 for(const type of types){
  await expandAll(p);const selector=type==='custom-section'?'button[id$="-action-buttons"]':`button[id="action-dropdown-${type}action-buttons"]`;
  await p.locator(selector).click();const items=await p.getByRole('menuitem').allTextContents();log('section-menu',{type,items});
  const add=p.getByRole('menuitem').filter({hasText:/Add/}).first();if(!await add.count()){await p.keyboard.press('Escape');log('cannot-add',{type});continue;}await add.click();await p.waitForTimeout(800);
  const t=p.locator('input#title');if(await t.count()){await t.fill('REA segunda '+type);await t.press('Tab');}
  if(type==='projects'){const ds=p.locator('input[placeholder="DD-MM-YYYY"]:not([aria-label])');await ds.first().fill('01-01-2026');await ds.first().press('Tab');await ds.last().fill('02-01-2026');await ds.last().press('Tab');}
  if(type==='recommendation'){const d=p.locator('[contenteditable="true"]').filter({visible:true}).first();await d.click();await d.press('Control+a');await d.pressSequentially('REA segunda recomendación');await d.press('Tab');}
  log('second-entry',{type,result:await save(p)});if(await exact(p,'Save').count())await cancel(p);
 }
 await expandAll(p);log('projects-order',{headings:(await p.getByRole('heading').allTextContents()).filter(x=>x.includes('projects'))});
 const entries=p.locator('button[id^="action-dropdown-projects-"]');await entries.last().click();log('second-project-menu',{items:await p.getByRole('menuitem').allTextContents()});
 const move=p.getByRole('menuitem').filter({hasText:/Move up/});if(await move.count())await move.click();else await p.keyboard.press('Escape');
 log('reorder-handles',{draggable:await p.locator('[draggable="true"]').count(),labels:await p.locator('button').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')).filter(x=>x&&/move|sort|reorder|drag/i.test(x)))});
 const path=await exportPdf(p,'multiples');
 const q=await imported(b,path);log('multiples-reimport',{headings:await q.getByRole('heading').allTextContents(),secondMarkers:(await q.locator('body').innerText()).match(/REA segunda/g)?.length??0});
 // Cancelar una eliminación confirma que hay diálogo; confirmar se prueba después en esta copia.
 await expandAll(q);await q.locator('button[id^="action-dropdown-projects-"]').last().click();await q.getByRole('menuitem').filter({hasText:/Delete/}).first().click();log('delete-entry-dialog',{text:(await q.locator('body').innerText()).slice(-1800),buttons:await q.locator('button').allTextContents()});
}catch(e){log('error',{message:e.message.slice(0,2000)});process.exitCode=1;}finally{await b.close();}
