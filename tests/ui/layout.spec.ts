import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { desktopHarness } from './desktop-harness.js';
import { completeProjectFixture } from '../fixtures.js';
import { projectForCv } from '../../src/domain/index.js';
import { encodeCvproj } from '../../src/adapters/cvproj.js';
import { syntheticPdf, xmlBytes } from '../f6/fixtures.js';

const sizes=[{width:1180,height:880},{width:1366,height:768},{width:1440,height:900},{width:820,height:700}];
async function capture(page:Page,name:string,root?:Locator){
  const scope=root??page.locator('body');
  const report=await scope.evaluate(element=>{
    const box=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const rendered=(el:Element)=>el.checkVisibility()&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
    const visibleBox=(el:Element)=>{
      const r=box(el);let left=r.x,top=r.y,right=r.right,bottom=r.bottom;
      for(let parent=el.parentElement;parent;parent=parent.parentElement){
        const s=getComputedStyle(parent),p=box(parent);
        if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,p.x);right=Math.min(right,p.right);}
        if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,p.y);bottom=Math.min(bottom,p.bottom);}
      }
      return {x:left,y:top,right,bottom,width:right-left,height:bottom-top};
    };
    const controls=[...element.querySelectorAll<HTMLElement>('input,select,textarea,button')].filter(el=>rendered(el)&&visibleBox(el).width>0&&visibleBox(el).height>0);
    const overlaps=[];
    for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
      const a=controls[i]!,b=controls[j]!;if(a.contains(b)||b.contains(a))continue;
      const x=visibleBox(a),y=visibleBox(b);
      if(Math.min(x.right,y.right)-Math.max(x.x,y.x)>2&&Math.min(x.bottom,y.bottom)-Math.max(x.y,y.y)>2)overlaps.push([a.outerHTML.slice(0,140),b.outerHTML.slice(0,140)]);
    }
    const dialog=element.matches('dialog')?element:null;
    const header=dialog?.querySelector('.modal-header'),body=dialog?.querySelector('.modal-body'),footer=dialog?.querySelector('.form-actions');
    return {viewport:{width:innerWidth,height:innerHeight},documentOverflow:document.documentElement.scrollWidth-innerWidth,documentOverflowY:document.documentElement.scrollHeight-innerHeight,scopeOverflow:element.scrollWidth-element.clientWidth,
      overlaps,clippedButtons:controls.filter(el=>el.matches('button')&&el.scrollHeight>el.clientHeight+1).map(el=>el.textContent),
      dialog:dialog?box(dialog):null,header:header?box(header):null,body:body?box(body):null,footer:footer?box(footer):null,
      controlBounds:controls.map(el=>({name:el.getAttribute('aria-label')??el.textContent?.trim().slice(0,60)??el.tagName,type:el.getAttribute('type'),...box(el)}))};
  });
  await writeFile(test.info().outputPath(name+'.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:test.info().outputPath(name+'.png')});
  expect(report.documentOverflow,name+' document overflow').toBeLessThanOrEqual(1);
  if(name==='01-empty-library')expect.soft(report.documentOverflowY,'empty library needs no vertical scrollbar').toBe(0);
  expect(report.scopeOverflow,name+' horizontal overflow').toBeLessThanOrEqual(1);
  expect.soft(report.overlaps,name+' overlapping controls').toEqual([]);expect.soft(report.clippedButtons,name+' clipped buttons').toEqual([]);
  if(report.dialog){expect(report.dialog.x).toBeGreaterThanOrEqual(0);expect(report.dialog.y).toBeGreaterThanOrEqual(0);expect(report.dialog.right).toBeLessThanOrEqual(report.viewport.width);expect(report.dialog.bottom).toBeLessThanOrEqual(report.viewport.height);expect(report.footer,name+' footer').not.toBeNull();expect(report.header!.bottom).toBeLessThanOrEqual(report.body!.y+1);expect(report.body!.bottom).toBeLessThanOrEqual(report.footer!.y+1);}
}
async function modal(page:Page,name:string,dialog=page.getByRole('dialog')){
  await capture(page,name,dialog);
  const body=dialog.locator('.modal-body').first();
  if(await body.evaluate(el=>el.scrollHeight>el.clientHeight+1)){
    await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});await capture(page,name+'-bottom',dialog);
    await body.evaluate(el=>{el.scrollTop=0;});
  }
}
for(const size of sizes)test(`GUI layout ${size.width}x${size.height}`,async()=>{
  const rig=await desktopHarness(),page=rig.page;
  try{
    await page.setViewportSize(size);await page.emulateMedia({colorScheme:'dark'});
    await capture(page,'01-empty-library');
    await page.getByRole('button',{name:'Crear CV',exact:true}).click();await modal(page,'02-create');await page.keyboard.press('Escape');
    const fixture=completeProjectFixture();if(fixture.snapshot.scope!=='workspace')throw Error('fixture');
    const snapshot=projectForCv(fixture.snapshot,fixture.snapshot.workspace.cvOrder[0]!);
    if(snapshot.scope!=='cv')throw Error('fixture scope');const contact=snapshot.cv.personalInformation.contacts.find(c=>c.kind==='email');if(contact&&contact.kind==='email')contact.value='synthetic.'.repeat(5)+'person@'+'example.'.repeat(5)+'test';
    await page.getByRole('button',{name:'Importar archivo',exact:true}).click();let d=page.getByRole('dialog');
    await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name:'synthetic-invalid.xml',mimeType:'text/xml',buffer:Buffer.from('<broken>')});await expect(d.getByText(/El XML está dañado/)).toBeVisible();await modal(page,'03-import-error');await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();
    await page.getByRole('button',{name:'Importar archivo',exact:true}).click();d=page.getByRole('dialog');await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name:'synthetic-workspace.cvproj',mimeType:'application/octet-stream',buffer:Buffer.from(encodeCvproj(fixture,fixture.ctx.now()))});await d.getByLabel('Modo de restauración',{exact:true}).selectOption('replaceWorkspace');await modal(page,'03-workspace-review');await d.getByRole('button',{name:'Confirmar restauración',exact:true}).click();let extra=page.getByRole('alertdialog');await modal(page,'03-workspace-confirm',extra);await extra.getByRole('button',{name:'Cancelar',exact:true}).click();await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();
    await page.getByRole('button',{name:'Importar archivo',exact:true}).click();d=page.getByRole('dialog');await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name:'synthetic-candidates.pdf',mimeType:'application/pdf',buffer:Buffer.from(await syntheticPdf([{name:'es.xml',bytes:xmlBytes()},{name:'en.xml',bytes:xmlBytes({locale:'en'})}]))});await d.getByRole('button',{name:'Revisar candidato es.xml',exact:true}).click();await modal(page,'03-candidates');await d.getByRole('button',{name:'Revisar candidato en.xml',exact:true}).click();extra=page.getByRole('alertdialog');await modal(page,'03-candidate-confirm',extra);await extra.getByRole('button',{name:'Cancelar',exact:true}).click();await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();
    await page.getByRole('button',{name:'Importar archivo',exact:true}).click();d=page.getByRole('dialog');await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name:'synthetic-layout.cvproj',mimeType:'application/octet-stream',buffer:Buffer.from(encodeCvproj({...fixture,snapshot},fixture.ctx.now()))});await expect(d.getByRole('button',{name:'Confirmar importación',exact:true})).toBeVisible();await modal(page,'04-import-review');await d.getByRole('button',{name:/^Revisar Educación:/}).first().click();await d.getByRole('button',{name:'Eliminar entrada de esta propuesta',exact:true}).click();const removal=page.getByRole('alertdialog');await modal(page,'04-import-delete',removal);await removal.getByRole('button',{name:'Cancelar',exact:true}).click();await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();
    if(snapshot.scope!=='cv')throw Error('fixture scope');await expect(page.getByRole('heading',{name:snapshot.cv.name,exact:true})).toBeVisible();await capture(page,'05-library');
    const before=await page.evaluate(async()=>{const list=await window.cvforge.list();if(!list.ok)throw Error('list');const r=await window.cvforge.open(list.value.cvs[0]!.id);if(!r.ok)throw Error('open');return r.value.cv;});
    await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();d=page.getByRole('dialog');await modal(page,'06-personal');await d.getByRole('group',{name:'Foto',exact:true}).locator('input[type=file]').scrollIntoViewIfNeeded();await capture(page,'06-photo-upload',d);const photoGroup=d.getByRole('group',{name:'Foto',exact:true}),photoHelp=await photoGroup.locator(':scope > small').boundingBox(),removePhoto=await photoGroup.getByRole('button',{name:'Retirar foto del CV',exact:true}).boundingBox();expect(photoHelp!.y-(removePhoto!.y+removePhoto!.height)).toBeGreaterThanOrEqual(8);await d.getByRole('button',{name:'Añadir teléfono',exact:true}).click();await d.getByLabel(/^Prefijo telefónico/).scrollIntoViewIfNeeded();await capture(page,'06-phone',d);await d.getByRole('button',{name:'Añadir dirección',exact:true}).click();await d.getByLabel(/^País \(código/).scrollIntoViewIfNeeded();await capture(page,'06-address',d);await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    for(const kind of ['education','work','skills','languages','certifications','projects','custom']){
      const s=Object.values(before.sectionsById).find(s=>s.kind===kind)!;const region=page.locator(`[data-section-id="${s.id}"]`);
      if(kind==='skills')await region.getByRole('button',{name:'Editar habilidades y grupos',exact:true}).first().click();
      else {const e=Object.values(s.entriesById).find(e=>kind!=='languages'||e.kind==='foreignLanguage')!;await region.locator(`[data-entry-id="${e.id}"]`).getByRole('button',{name:'Editar entrada',exact:true}).click();}
      d=page.getByRole('dialog');await modal(page,'07-'+kind);
      if(kind==='education'){
        await d.getByRole('button',{name:'Revisar traducción sensible de Titulación',exact:true}).click();const review=page.getByRole('dialog',{name:'Revisión de traducción sensible',exact:true});await modal(page,'08-sensitive-radio',review);await review.getByRole('button',{name:'Cancelar revisión',exact:true}).click();
        const date=d.getByLabel(/^Fecha de inicio/).first();await date.fill('2024-99');await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(date).toHaveAttribute('aria-invalid','true');await modal(page,'08-date-error');await date.scrollIntoViewIfNeeded();await capture(page,'08-date-invalid-field',d);
        const beforeFocus=await date.boundingBox();await date.focus();const afterFocus=await date.boundingBox();expect({width:afterFocus!.width,height:afterFocus!.height}).toEqual({width:beforeFocus!.width,height:beforeFocus!.height});await d.getByLabel('Indicar créditos',{exact:true}).check();await d.getByLabel('Indicar dirección de la institución',{exact:true}).check();await d.getByLabel('Indicar periodo de validez',{exact:true}).check();await d.locator('.modal-body').evaluate(el=>{el.scrollTop=el.scrollHeight;});await capture(page,'08-education-optional',d);
      }
      if(kind==='skills'){
        await d.getByRole('button',{name:'Crear grupo',exact:true}).click();let child=page.getByRole('dialog',{name:'Editar grupo',exact:true});await modal(page,'09-child-group',child);await child.getByRole('button',{name:'Cancelar hijo',exact:true}).click();
        await d.getByRole('button',{name:'Eliminar grupo',exact:true}).first().click();child=page.getByRole('alertdialog');await modal(page,'10-delete-group',child);await child.getByRole('button',{name:'Cancelar eliminación',exact:true}).click();
      }
      await d.getByRole('button',{name:'Cancelar',exact:true}).click();
      if(kind==='languages'){const native=Object.values(s.entriesById).find(e=>e.kind==='nativeLanguage')!;await region.locator(`[data-entry-id="${native.id}"]`).getByRole('button',{name:'Editar entrada',exact:true}).click();d=page.getByRole('dialog');await modal(page,'07-native-language');await d.getByRole('button',{name:'Cancelar',exact:true}).click();}
      if(kind==='custom'){await region.getByRole('button',{name:'Renombrar sección personalizada',exact:true}).click();d=page.getByRole('dialog');await modal(page,'07-custom-name');await d.getByRole('button',{name:'Cancelar',exact:true}).click();}
    }
    await page.getByRole('button',{name:'Reordenar secciones',exact:true}).click();d=page.getByRole('dialog');await modal(page,'11-order-disabled');await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.getByRole('button',{name:'Preparar cambio de idioma',exact:true}).click();d=page.getByRole('dialog');await modal(page,'12-language-plan');await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.getByRole('button',{name:'Duplicar CV',exact:true}).click();d=page.getByRole('dialog');await modal(page,'13-duplicate');await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.getByRole('button',{name:'Revisiones lingüísticas',exact:true}).click();d=page.getByRole('dialog');await modal(page,'14-history');await d.getByRole('button',{name:/^Restaurar revisión/}).first().click();const restore=page.getByRole('alertdialog');await modal(page,'14-restore',restore);await restore.getByRole('button',{name:'Cancelar',exact:true}).click();await d.getByRole('button',{name:'Cerrar revisiones',exact:true}).click();
    const first=page.locator(`[data-section-id="${before.sectionOrder[0]}"]`);await first.getByRole('button',{name:'Eliminar sección',exact:true}).click();d=page.getByRole('alertdialog');await modal(page,'15-delete',d);await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.getByRole('button',{name:'Presentación',exact:true}).click();d=page.getByRole('dialog');await modal(page,'16-presentation');
    const picker=d.getByLabel('Color de acento',{exact:true});expect((await picker.boundingBox())!.width).toBeLessThanOrEqual(100);
    for(const name of ['Densidad','Color de acento','Precisión máxima de fechas'])expect((await d.getByLabel(name,{exact:true}).boundingBox())!.height).toBe(44);
    const geometry=await picker.boundingBox();await picker.focus();expect(await picker.boundingBox()).toEqual(geometry);await modal(page,'16-presentation-focus');
    // A DOM-only disabled style probe: no submit, handler or project mutation.
    await d.evaluate(el=>{el.querySelector('fieldset')!.disabled=true;el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled=true;});
    expect(await d.getByRole('button',{name:'Confirmar',exact:true}).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(232, 237, 243)');
    await modal(page,'16-presentation-disabled');
    await d.evaluate(el=>{el.querySelector('fieldset')!.disabled=false;el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled=false;});
    await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    const after=await page.evaluate(async id=>{const r=await window.cvforge.open(id);if(!r.ok)throw Error('open');return r.value.cv;},before.id);expect(after).toEqual(before);
    await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();const preview=page.getByRole('region',{name:'Vista previa PDF',exact:true});await expect(preview).toHaveAttribute('data-state','error',{timeout:30000});await capture(page,'17-preview-error',preview);
    await page.getByRole('button',{name:'Presentación',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmar',exact:true}).click();await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});
    await preview.scrollIntoViewIfNeeded();await capture(page,'18-preview-ready',preview);expect(await preview.locator('.pdf-scroll').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
    expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
