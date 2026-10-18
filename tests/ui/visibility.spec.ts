import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { desktopHarness } from './desktop-harness.js';
import { completeProjectFixture } from '../fixtures.js';
import { projectForCv } from '../../src/domain/index.js';
import { encodeCvproj } from '../../src/adapters/cvproj.js';

// Synthetic acceptance captures, with geometry/contrast assertions rather than
// pixel goldens tied to a specific desktop font rasterizer.
async function inspect(page:Page,dialog:Locator,name:string){
  const metrics=await dialog.evaluate(element=>{
    const style=getComputedStyle(element),body=element.querySelector('.modal-body')!,footer=element.querySelector('.form-actions');
    const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number);
    const luminance=(c:number[])=>c.map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i]!,0);
    const ratio=(a:string,b:string)=>{const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const surface=style.backgroundColor;
    const samples=[element.querySelector('h2'),...element.querySelectorAll('label, .hint, button.primary:not(:disabled)')].filter(Boolean).map(node=>{
      const s=getComputedStyle(node!);return ratio(s.color,node!.matches('button')?s.backgroundColor:surface);
    });
    return {surface,scheme:style.colorScheme,contrast:Math.min(...samples),overflow:element.scrollWidth-element.clientWidth,bodyOverflow:body.scrollWidth-body.clientWidth,clippedButtons:[...element.querySelectorAll('button')].filter(button=>button.scrollHeight>button.clientHeight+1).length,footer:footer?{top:footer.getBoundingClientRect().top,bottom:footer.getBoundingClientRect().bottom}:null,height:innerHeight};
  });
  expect(metrics.surface).toBe('rgb(255, 255, 255)');expect(metrics.scheme).toContain('light');expect(metrics.contrast).toBeGreaterThanOrEqual(4.5);expect(metrics.overflow).toBeLessThanOrEqual(1);expect(metrics.bodyOverflow).toBeLessThanOrEqual(1);expect(metrics.clippedButtons).toBe(0);
  if(metrics.footer){expect(metrics.footer.top).toBeGreaterThan(0);expect(metrics.footer.bottom).toBeLessThanOrEqual(metrics.height);}
  await writeFile(test.info().outputPath(name+'.json'),JSON.stringify(metrics,null,2));
  await page.screenshot({path:test.info().outputPath(name+'.png')});
}

test('Light UI: all MVP forms, import/language review, fixed modal footer, keyboard focus and fit-width preview',async()=>{
  const rig=await desktopHarness(),page=rig.page;
  try{
    await page.setViewportSize({width:1180,height:880});await page.emulateMedia({colorScheme:'dark'});
    await page.getByRole('button',{name:'Crear CV',exact:true}).click();let dialog=page.getByRole('dialog');await inspect(page,dialog,'01-create');
    await dialog.getByLabel(/^Nombre del CV/).focus();expect(await dialog.getByLabel(/^Nombre del CV/).evaluate(el=>getComputedStyle(el).outlineWidth)).toBe('3px');await page.keyboard.press('Escape');
    const fixture=completeProjectFixture();if(fixture.snapshot.scope!=='workspace')throw Error('fixture');const snapshot=projectForCv(fixture.snapshot,fixture.snapshot.workspace.cvOrder[0]!);
    await page.getByRole('button',{name:'Importar archivo',exact:true}).click();dialog=page.getByRole('dialog');
    await dialog.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name:'synthetic-polish.cvproj',mimeType:'application/octet-stream',buffer:Buffer.from(encodeCvproj({...fixture,snapshot},fixture.ctx.now()))});
    await expect(dialog.getByRole('button',{name:'Confirmar importación',exact:true})).toBeVisible();await inspect(page,dialog,'10-import');await dialog.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(dialog).not.toBeVisible();
    const before=await page.evaluate(async()=>{const list=await window.cvforge.list();if(!list.ok)throw Error('list');const opened=await window.cvforge.open(list.value.cvs[0]!.id);if(!opened.ok)throw Error('open');return opened.value.cv;});
    await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();dialog=page.getByRole('dialog');await inspect(page,dialog,'02-personal');
    const body=dialog.locator('.modal-body');expect(await body.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
    const footer=await dialog.locator('.form-actions').boundingBox();await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});expect(await dialog.locator('.form-actions').boundingBox()).toEqual(footer);await inspect(page,dialog,'02-personal-bottom');
    await page.setViewportSize({width:760,height:680});await inspect(page,dialog,'02-personal-medium');expect(await dialog.locator('.grid').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);await page.keyboard.press('Escape');await page.setViewportSize({width:1180,height:880});
    let number=3;
    for(const kind of ['education','work','skills','languages','certifications','projects','custom']){
      const section=Object.values(before.sectionsById).find(s=>s.kind===kind)!;const region=page.locator(`[data-section-id="${section.id}"]`);
      if(kind==='skills')await region.getByRole('button',{name:'Editar habilidades y grupos',exact:true}).first().click();
      else {const entry=Object.values(section.entriesById).find(e=>kind!=='languages'||e.kind==='foreignLanguage')!;await region.locator(`[data-entry-id="${entry.id}"]`).getByRole('button',{name:'Editar entrada',exact:true}).click();}
      dialog=page.getByRole('dialog');await inspect(page,dialog,`${String(number++).padStart(2,'0')}-${kind}`);if(kind==='skills'){await dialog.getByRole('button',{name:'Crear grupo',exact:true}).click();const child=page.getByRole('dialog',{name:'Editar grupo',exact:true});await inspect(page,child,'05-skills-child');await child.getByRole('button',{name:'Cancelar hijo',exact:true}).click();}await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(dialog).not.toBeVisible();
    }
    await page.getByRole('button',{name:'Preparar cambio de idioma',exact:true}).click();dialog=page.getByRole('dialog');await inspect(page,dialog,'11-language-plan');await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    const after=await page.evaluate(async id=>{const r=await window.cvforge.open(id);if(!r.ok)throw Error('open');return r.value.cv;},before.id);expect(after).toEqual(before);
    await page.getByRole('button',{name:'Presentación',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmar',exact:true}).click();
    await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();const preview=page.getByRole('region',{name:'Vista previa PDF',exact:true});await expect(preview).toHaveAttribute('data-state','ready',{timeout:30000});await expect(preview.getByLabel('Zoom',{exact:true})).toHaveValue('fit');
    const digest=await preview.getAttribute('data-sha256');
    for(const size of [{width:1180,height:880},{width:1600,height:1000},{width:900,height:720}]){
      await page.setViewportSize(size);
      await expect.poll(()=>preview.locator('.pdf-scroll').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
      await expect.poll(async()=>{const paper=await preview.locator('canvas').boundingBox();return paper!.width;}).toBeGreaterThan(size.width===1600?700:400);
      expect(await preview.getAttribute('data-sha256')).toBe(digest);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await preview.locator('canvas').scrollIntoViewIfNeeded();await page.screenshot({path:test.info().outputPath(`12-preview-${size.width}.png`)});
    }
    await preview.getByLabel('Zoom',{exact:true}).selectOption('1.5');await expect(preview.locator('canvas')).toHaveCSS('width',/892|893/);await preview.getByLabel('Zoom',{exact:true}).selectOption('fit');
    expect(await preview.getAttribute('data-sha256')).toBe(digest);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
