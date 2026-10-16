import { test, expect, chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { syntheticPng } from '../fixtures.js';

async function harness() {
  const directory=await mkdtemp('/tmp/cvforge-f4-desktop-');
  let browser:Browser,page:Page,child:ChildProcess;
  const logs:string[]=[],errors:string[]=[],remoteRequests:string[]=[];
  const launch=async()=>{
    const executable=createRequire(import.meta.url)('electron') as string;
    child=spawn(executable,[process.cwd(),'--user-data-dir='+directory,'--remote-debugging-port=0','--no-sandbox','--cvforge-diagnostics'],{detached:true,stdio:['ignore','pipe','pipe']});
    const endpoint=await new Promise<string>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Electron CDP startup timed out: '+logs.join(''))),30000);
      child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error('Electron exited before CDP: '+code+' '+logs.join('')));});
      child.stdout!.on('data',data=>logs.push(String(data)));child.stderr!.on('data',data=>{const text=String(data);logs.push(text);const match=/DevTools listening on (ws:\/\/[^\s]+)/.exec(text);if(match){clearTimeout(timer);resolve(match[1]!);}});
    });
    browser=await chromium.connectOverCDP(endpoint);
    const context=browser.contexts()[0]!;page=context.pages()[0] ?? await context.waitForEvent('page');
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/^https?:/.test(request.url()))remoteRequests.push(request.url());});
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await expect(page.getByRole('heading',{name:'Tu biblioteca'})).toBeVisible();
    return page;
  };
  const close=async()=>{
    if(child.exitCode !== null || child.signalCode !== null)return;
    const exited=once(child,'exit');
    if(await page.locator('dialog[open]').count())await page.evaluate(()=>window.close());
    else await page.getByRole('button',{name:'Guardar borrador y salir',exact:true}).click();
    const [code]=await exited;expect(code).toBe(0);await browser.close();
  };
  await launch();
  return {get page(){return page;},directory,logs,errors,
    async crash(){const exited=once(child,'exit');process.kill(-child.pid!,'SIGKILL');await exited;await browser.close();},
    async submitAndRestart(){const exited=once(child,'exit');await page.evaluate(()=>{window.document.querySelector<HTMLFormElement>('dialog form')!.requestSubmit();window.close();});const [code]=await exited;expect(code).toBe(0);await browser.close();return launch();},
    async restart(){await close();return launch();},
    async dispose(){try{await close();}catch{process.kill(-child.pid!,'SIGKILL');}await writeFile(test.info().outputPath('electron.log'),logs.join(''));await writeFile(test.info().outputPath('renderer-errors.json'),JSON.stringify(errors));await writeFile(test.info().outputPath('remote-requests.json'),JSON.stringify(remoteRequests));await rm(directory,{recursive:true,force:true});expect(remoteRequests).toEqual([]);},
    async read(){
      await close();
      const {SqliteLibraryRepository}=await import(pathToFileURL(join(process.cwd(),'dist/src/adapters/sqlite/repository.js')).href);
      const repository=await SqliteLibraryRepository.open(join(directory,'library'));
      try{return {record:await repository.read(),health:await repository.health()};}finally{await repository.close();}
    },
  };
}
async function create(page:Page,name='CV sintético F4') {
  await page.getByRole('button',{name:'Crear CV',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Crear CV'});
  await dialog.getByLabel(/Nombre del CV/).fill(name);await dialog.getByLabel(/^Nombre para mostrar/).fill('Persona Sintética Ștefan');
  await dialog.getByRole('button',{name:'Crear CV',exact:true}).click();await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
}
const personal=async(page:Page)=>{await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();return page.getByRole('dialog',{name:'Editar datos personales',exact:true});};
const confirm=async(page:Page)=>{const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('status').filter({hasText:'Guardado localmente.'})).toBeVisible();};
const reopen=async(page:Page)=>{await page.getByRole('complementary').getByRole('button',{name:/CV sintético F4/}).click();};
const confirmed=async(page:Page)=>page.evaluate(async()=>{const list=await window.cvforge.list();if(!list.ok)throw new Error(list.error.code);const cv=await window.cvforge.open(list.value.cvs[0]!.id);if(!cv.ok)throw new Error(cv.error.code);return cv.value.cv;});

test('Confirmar/Cancelar email, focus/keyboard, invalid date, field visibility and real two-process persistence',async()=>{
  const rig=await harness();let page=rig.page;
  try {
    await create(page);let dialog=await personal(page);
    await dialog.getByRole('button',{name:'Añadir email',exact:true}).click();await dialog.getByLabel(/^Email \(/).fill('a@example.test');await confirm(page);
    dialog=await personal(page);await dialog.getByLabel(/^Email \(/).fill('b@example.test');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
    await expect(page.getByText('a@example.test',{exact:true})).toBeVisible();await expect(page.getByText('b@example.test',{exact:true})).not.toBeVisible();
    await page.bringToFront();await expect(page.getByRole('button',{name:'Editar datos personales',exact:true})).toBeFocused();
    await page.keyboard.press('Enter');dialog=page.getByRole('dialog');
    await expect(dialog.getByLabel(/^Nombre para mostrar/)).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByLabel(/^Nombre \(/)).toBeFocused();
    await dialog.getByLabel(/^Email \(/).fill('b@example.test');await dialog.getByLabel(/^Fecha de nacimiento/).fill('2020-02-31');
    await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(dialog.getByLabel(/^Fecha de nacimiento/)).toHaveValue('2020-02-31');await expect(dialog.getByLabel(/^Fecha de nacimiento/)).toHaveAttribute('aria-invalid','true');await expect(dialog.getByRole('alert')).toContainText('Fecha inválida');
    await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByText('a@example.test',{exact:true})).toBeVisible();
    dialog=await personal(page);await expect(dialog.getByLabel(/^Fecha de nacimiento/)).toHaveValue('');await dialog.getByLabel(/^Email \(/).fill('b@example.test');await dialog.getByLabel(/^Nombre \(/).fill('Nombre conservado');await dialog.getByLabel('Incluir nombre',{exact:true}).uncheck();await confirm(page);
    await page.screenshot({path:test.info().outputPath('personal-confirmed.png'),fullPage:true});
    page=await rig.restart();await reopen(page);await expect(page.getByText('b@example.test',{exact:true})).toBeVisible();
    await expect(page.getByRole('region',{name:'Recuperación de borradores'})).not.toBeVisible();
    dialog=await personal(page);await expect(dialog.getByLabel(/^Nombre \(/)).toHaveValue('Nombre conservado');await expect(dialog.getByLabel('Incluir nombre',{exact:true})).not.toBeChecked();await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    const {record,health}=await rig.read();const cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]];
    expect(cv.personalInformation.contacts[0].value).toBe('b@example.test');expect(record.content.drafts).toHaveLength(0);expect(health.integrity).toEqual(['ok']);expect(health.foreignKeyViolations).toBe(0);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});

test('Education/work rich forms, isolated editing, hidden vs collapsed, keyboard ordering, deletion and reopen',async()=>{
  const rig=await harness();let page=rig.page;
  try{
    await create(page);await page.getByRole('button',{name:'Añadir sección de educación',exact:true}).click();
    const education=()=>page.getByRole('region',{name:'Educación',exact:true});
    for(const name of ['Educación A','Educación B','Educación C']){
      await education().getByRole('button',{name:'Añadir educación',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Editar educación'});
      await dialog.getByLabel(/^Titulación/).fill(name);await dialog.getByLabel(/^Institución/).fill('Instituto Sintético');await dialog.getByLabel(/^Fecha final/).fill('2019');await confirm(page);
    }
    await education().getByRole('article',{name:'Educación B',exact:true}).getByRole('button',{name:'Editar entrada',exact:true}).click();let dialog=page.getByRole('dialog');
    await dialog.getByLabel(/^Titulación/).fill('Educación B revisada');await dialog.getByRole('textbox',{name:'Descripción (opcional)',exact:true}).fill('Narrativa propia Șț áé');await dialog.getByRole('button',{name:'Negrita',exact:true}).click();await dialog.getByRole('textbox',{name:'Descripción (opcional)',exact:true}).press('End');await page.keyboard.type(' negrita');await confirm(page);
    await expect(education().getByRole('article',{name:'Educación A',exact:true})).toContainText('Instituto Sintético');await expect(education().getByRole('article',{name:'Educación C',exact:true})).toContainText('2019');
    const a=education().getByRole('article',{name:'Educación A',exact:true});await a.getByRole('button',{name:'Ocultar entrada',exact:true}).click();await expect(a).toContainText('Entrada excluida del CV');await a.getByRole('button',{name:'Mostrar entrada',exact:true}).click();await expect(a.getByText('Entrada excluida del CV')).not.toBeVisible();
    await education().getByRole('button',{name:'Ocultar sección',exact:true}).click();await expect(education()).toContainText('Sección excluida del CV');const beforeCollapse=await confirmed(page);await education().getByRole('button',{name:'Contraer sección',exact:true}).click();expect(await confirmed(page)).toEqual(beforeCollapse);await expect(education().getByRole('article')).toHaveCount(0);await expect(education().getByRole('button',{name:'Mostrar sección',exact:true})).toBeVisible();await education().getByRole('button',{name:'Expandir sección',exact:true}).click();await expect(a).toBeVisible();await education().getByRole('button',{name:'Mostrar sección',exact:true}).click();
    await education().getByRole('button',{name:'Reordenar entradas',exact:true}).click();dialog=page.getByRole('dialog');const up=dialog.getByRole('button',{name:'Subir Educación C',exact:true});await up.focus();await page.keyboard.press('Enter');await up.focus();await page.keyboard.press('Space');await expect(dialog.getByRole('status').filter({hasText:/^Orden:/})).toContainText('Educación C, Educación A, Educación B revisada');await confirm(page);
    await page.getByRole('button',{name:'Añadir sección de experiencia laboral',exact:true}).click();const work=()=>page.getByRole('region',{name:'Experiencia laboral',exact:true});
    for(const name of ['Analista A','Analista B']){await work().getByRole('button',{name:'Añadir experiencia',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel(/^Puesto/).fill(name);await dialog.getByLabel(/^Empresa/).fill('Empresa Sintética');await dialog.getByLabel(/^Fecha de inicio/).fill('2020-02');await dialog.getByLabel('Actualmente / Ongoing',{exact:true}).check();await confirm(page);}
    await page.screenshot({path:test.info().outputPath('core-editor.png'),fullPage:true});
    page=await rig.restart();await reopen(page);await expect(education().getByRole('article').getByRole('heading',{level:3})).toHaveText(['Educación C','Educación A','Educación B revisada']);await expect(work().getByRole('article')).toHaveCount(2);await expect(work().getByRole('article').first()).toContainText('2020-02 → Actualmente');
    await education().getByRole('article',{name:'Educación B revisada',exact:true}).getByRole('button',{name:'Eliminar entrada',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Cancelar',exact:true}).click();await expect(education().getByRole('article')).toHaveCount(3);
    await education().getByRole('article',{name:'Educación B revisada',exact:true}).getByRole('button',{name:'Eliminar entrada',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Eliminar definitivamente del CV',exact:true}).click();await expect(education().getByRole('article')).toHaveCount(2);
    const {record,health}=await rig.read();const cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]];const sections=Object.values(cv.sectionsById) as any[];expect(sections.find(s=>s.kind==='education').included).toBe(true);expect(JSON.stringify(cv)).not.toContain('collapsed');expect(health.integrity).toEqual(['ok']);expect(health.foreignKeyViolations).toBe(0);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});

test('Persistent photo and cancelled replacement, explicit recovery after process crash, discarded drafts absent',async()=>{
  const rig=await harness();let page=rig.page;
  try{
    await create(page);let dialog=await personal(page);await dialog.locator('input[type=file]').setInputFiles({name:'synthetic-a.png',mimeType:'image/png',buffer:Buffer.from(syntheticPng())});await expect(dialog.getByRole('img',{name:'Foto del CV',exact:true})).toBeVisible();await confirm(page);
    dialog=await personal(page);await dialog.locator('input[type=file]').setInputFiles({name:'synthetic-b.png',mimeType:'image/png',buffer:Buffer.from(syntheticPng(2,2))});await expect(dialog.getByRole('img',{name:'Foto del CV',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    page=await rig.restart();await reopen(page);await expect(page.getByRole('img',{name:'Foto del CV',exact:true})).toBeVisible();dialog=await personal(page);await dialog.getByLabel(/^Nombre para mostrar/).fill('Borrador recuperable sintético');
    await expect(dialog.getByRole('status')).toContainText('Borrador guardado localmente');
    await rig.crash();
    // Launch a new real Electron process against the same data; no mock repository.
    page=await rig.restart();await expect(page.getByRole('region',{name:'Recuperación de borradores'})).toBeVisible();await page.getByRole('button',{name:/Recuperar borrador de/}).click();dialog=page.getByRole('dialog');await expect(dialog.getByLabel(/^Nombre para mostrar/)).toHaveValue('Borrador recuperable sintético');await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByRole('heading',{name:'Persona Sintética Ștefan',exact:true})).toBeVisible();
    const {record,health}=await rig.read();const cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]],asset=record.content.assetsById[cv.personalInformation.photo.assetId];expect(record.content.blobs.get(asset.sha256)).toEqual(syntheticPng());expect(record.content.drafts).toHaveLength(0);expect(health.integrity).toEqual(['ok']);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});

test('Native window close flushes current raw form; recovery stays separate and renderer has no Node capability',async()=>{
  const rig=await harness();let page=rig.page;
  try{
    await create(page);
    expect(await page.evaluate(()=>({require:typeof (globalThis as Record<string,unknown>).require,process:typeof (globalThis as Record<string,unknown>).process,generalInvoke:'invoke' in window.cvforge}))).toEqual({require:'undefined',process:'undefined',generalInvoke:false});
    let dialog=await personal(page);await dialog.getByRole('button',{name:'Añadir email',exact:true}).click();await dialog.getByLabel(/^Email \(/).fill('a@example.test');await confirm(page);
    dialog=await personal(page);await dialog.getByLabel(/^Email \(/).fill('b@example.test');await dialog.getByLabel(/^Fecha de nacimiento/).fill('2020-02-31');
    // Close immediately, without waiting for the debounce or its saved indicator.
    page=await rig.restart();await reopen(page);await expect(page.getByText('a@example.test',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:/Recuperar borrador de/}).click();dialog=page.getByRole('dialog');
    await expect(dialog.getByLabel(/^Email \(/)).toHaveValue('b@example.test');await expect(dialog.getByLabel(/^Fecha de nacimiento/)).toHaveValue('2020-02-31');
    await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(dialog.getByLabel(/^Fecha de nacimiento/)).toHaveAttribute('aria-invalid','true');
    await dialog.getByLabel(/^Fecha de nacimiento/).fill('2020-02-29');page=await rig.submitAndRestart();await reopen(page);await expect(page.getByText('b@example.test',{exact:true})).toBeVisible();
    const {record,health}=await rig.read();const cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]];
    expect(cv.personalInformation.contacts[0].value).toBe('b@example.test');expect(cv.personalInformation.birthDate).toEqual({precision:'day',year:2020,month:2,day:29});expect(record.content.drafts).toHaveLength(0);expect(health.integrity).toEqual(['ok']);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
