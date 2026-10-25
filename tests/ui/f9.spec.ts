import {test,expect} from '@playwright/test';
import {readFile,writeFile,stat,mkdir,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {zipSync,unzipSync} from 'fflate';
import {xmlBytes,syntheticPdf} from '../f6/fixtures.js';
import {completeProjectFixture} from '../fixtures.js';
import {f9Workspace} from '../f9-fixtures.js';
import {encodeCvproj,decodeCvproj} from '../../src/adapters/cvproj.js';
import {projectForCv,entryIds} from '../../src/domain/index.js';
import {harness,library,current,importReview,personal,template,preview,exported,pdfProjection,visibleEquivalent,normalizedCv,digest} from './f9-harness.js';

test('F9 packaged E2E: Europass review, confirm/cancel, reopen, manual English, both PDFs and full project in empty libraries',async()=>{
  test.setTimeout(240000);const a=await harness(),targets:Awaited<ReturnType<typeof harness>>[]=[];
  try{
    let page=a.page;expect((await library(page)).cvs).toHaveLength(0);
    const pdf=await syntheticPdf([{name:'renamed-structured.data',bytes:xmlBytes({unknown:true})}]);
    let d=await importReview(page,pdf,'known-synthetic.pdf',false);expect((await library(page)).cvs).toHaveLength(0);
    await d.getByLabel(/^Nombre del nuevo CV/).fill('F9 acceptance');await d.getByRole('checkbox',{name:/He revisado la propuesta/}).check();await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();
    let cv=await current(page),entries=cv.sectionOrder.flatMap(id=>{const s=cv.sectionsById[id]!;return entryIds(s).map(id=>s.entriesById[id]!);});
    expect(entries.filter(e=>e.kind==='education')).toHaveLength(8);expect(entries.filter(e=>e.kind==='work')).toHaveLength(3);expect(entries.filter(e=>e.kind==='skill')).toHaveLength(18);expect(entries.filter(e=>e.kind==='nativeLanguage')).toHaveLength(2);
    const foreign=entries.find(e=>e.kind==='foreignLanguage')!;if(foreign.kind!=='foreignLanguage')throw Error();expect(Object.values(foreign.fields.proficiency)).toEqual(['B2','B2','B2','B2','B2']);expect(cv.personalInformation.photo).not.toBeNull();
    const edu=entries.find(e=>e.kind==='education')!,work=entries.find(e=>e.kind==='work')!;if(edu.kind!=='education'||work.kind!=='work')throw Error();expect(edu.fields.title.original!.value).toBe('Titulación sintética 1');expect(edu.fields.organization!.value).toBe('Instituto Sintético 1');expect(work.fields.employer!.value).toBe('Empresa Sintética 1');
    await template(page,'simple');
    d=await personal(page);await d.getByLabel(/^Email \(/).fill('a@example.test');await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();const confirmed=await current(page);
    d=await personal(page);await d.getByLabel(/^Email \(/).fill('b@example.test');await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();expect(await current(page)).toEqual(confirmed);expect((await library(page)).recovery).toHaveLength(0);
    const afterCancel=await exported(a,'cancel-keeps-a.pdf');expect(JSON.stringify(afterCancel.projection)).toContain('a@example.test');expect(JSON.stringify(afterCancel.projection)).not.toContain('b@example.test');
    d=await personal(page);await d.getByLabel(/^Email \(/).fill('b@example.test');await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();
    page=await a.restart();await page.getByRole('complementary').getByRole('button',{name:/F9 acceptance/}).click();expect((await current(page)).personalInformation.contacts.some(c=>c.kind==='email'&&c.value==='b@example.test')).toBe(true);
    await page.getByRole('button',{name:'Preparar cambio de idioma',exact:true}).click();d=page.getByRole('dialog');await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();expect((await current(page)).documentLocale).toBe('es');
    await page.getByRole('button',{name:'Preparar cambio de idioma',exact:true}).click();d=page.getByRole('dialog');
    await expect(d).toBeVisible();await expect(d.getByLabel(/^Traducción de /).first()).toBeVisible();
    const narratives=d.getByLabel(/^Traducción de /);for(let i=0;i<await narratives.count();i++)await narratives.nth(i).fill(`Reviewed English narrative ${i+1}.`);
    const approvals=d.getByLabel(/^Traducción sensible de /);for(let i=0;i<await approvals.count();i++)await approvals.nth(i).fill(`Reviewed synthetic qualification ${i+1}`);
    const decisions=d.getByLabel(/^Decisión para /);for(let i=0;i<await decisions.count();i++)await decisions.nth(i).selectOption('approve');
    const checked=d.getByRole('checkbox',{name:/He revisado esta narrativa/});for(let i=0;i<await checked.count();i++)await checked.nth(i).check();
    await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();cv=await current(page);expect(cv.documentLocale).toBe('en');expect((await library(page)).uiLocale).toBe('es');
    expect(cv.sectionOrder.flatMap(id=>{const s=cv.sectionsById[id]!;return entryIds(s).map(id=>s.entriesById[id]!);}).filter(e=>e.kind==='work').map(e=>e.fields.employer!.value)).toEqual(['Empresa Sintética 1','Empresa Sintética 2','Empresa Sintética 3']);
    expect(cv.sectionOrder.flatMap(id=>{const s=cv.sectionsById[id]!;return entryIds(s).map(id=>s.entriesById[id]!);}).filter(e=>e.kind==='education').map(e=>e.fields.organization!.value)).toEqual(Array.from({length:8},(_,i)=>`Instituto Sintético ${i+1}`));
    const history=await page.evaluate(id=>window.cvforge.revisions(id),cv.id);expect(history.ok&&history.value.some(r=>r.cause==='beforeTranslation'&&r.pinned)).toBe(true);
    const education=page.locator('[data-section-id]').filter({has:page.getByRole('heading',{name:'Educación',exact:true})});await education.locator('[data-entry-id]').last().getByRole('button',{name:'Ocultar entrada',exact:true}).click();
    const hashes=[];
    for(const id of ['simple','lateral']){
      await template(page,id);cv=await current(page);const saved=await exported(a,'e2e-'+id+'.pdf');visibleEquivalent(cv,saved.projection);hashes.push({template:id,sha256:saved.sha256});
      const target=await harness();targets.push(target);let td=await importReview(target.page,saved.bytes,'portable-'+id+'.pdf',false);await td.getByRole('button',{name:'Cancelar importación',exact:true}).click();await expect(td).not.toBeVisible();expect((await library(target.page)).cvs).toHaveLength(0);
      await importReview(target.page,saved.bytes,'portable-'+id+'.pdf');const imported=await current(target.page);visibleEquivalent(imported,saved.projection);expect(imported.personalInformation.photo).not.toBeNull();
      const reopened=await target.restart();await reopened.getByRole('complementary').getByRole('button').filter({hasText:'portable-'+id}).click();visibleEquivalent(await current(reopened),saved.projection);
    }
    cv=await current(page);const path=(await a.destination('e2e-full.cvproj'))!;await page.getByRole('button',{name:'Exportar proyecto (.cvproj)',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Proyecto completo exportado'})).toBeVisible();
    const bytes=new Uint8Array(await readFile(path)),decoded=decodeCvproj(bytes);expect(decoded.snapshot.scope).toBe('cv');if(decoded.snapshot.scope!=='cv')throw Error();expect(decoded.snapshot.cv).toEqual(cv);expect(decoded.snapshot.revisions.some(r=>r.cause==='beforeTranslation')).toBe(true);
    const full=await harness();targets.push(full);await importReview(full.page,bytes,'backup.cvproj');
    const checkProjectCopy=(copy:typeof cv)=>{expect(copy.revision).toBe(cv.revision+1);expect(copy.importRecords).toHaveLength((cv.importRecords?.length??0)+1);expect(normalizedCv({...copy,revision:cv.revision,updatedAt:cv.updatedAt,importRecords:copy.importRecords!.slice(0,cv.importRecords?.length??0)})).toEqual(normalizedCv(cv));};
    checkProjectCopy(await current(full.page));const reopened=await full.restart();await reopened.getByRole('complementary').getByRole('button',{name:/F9 acceptance/}).click();checkProjectCopy(await current(reopened));
    await a.restart();await a.page.getByRole('complementary').getByRole('button',{name:/F9 acceptance/}).click();expect((await current(a.page)).documentLocale).toBe('en');
    await writeFile(test.info().outputPath('e2e.json'),JSON.stringify({steps:26,syntheticEuropass:true,hashes,confirmCancel:true,manualEnglish:true,photo:true,visibility:true,independentLibraries:3,reopened:true},null,2));
  }finally{for(const target of targets.reverse())await target.dispose();await a.dispose();}
});

test('F9 AC-04 packaged SIGKILL offers a separate draft, confirmed-only PDF, recover/cancel and explicit discard',async()=>{
  const rig=await harness();try{
    await importReview(rig.page,await syntheticPdf([{name:'data.xml',bytes:xmlBytes()}]),'recovery.pdf');await template(rig.page,'simple');const cv=await current(rig.page);
    let d=await personal(rig.page);await d.getByLabel(/^Email \(/).fill('PRIVATE_DRAFT@example.test');expect((await rig.page.evaluate(()=>window.cvforge.flush())).ok).toBe(true);await rig.crash();await rig.launch();
    await expect(rig.page.getByRole('region',{name:'Recuperación de borradores'})).toBeVisible();await rig.page.getByRole('complementary').getByRole('button',{name:/recovery/}).click();expect(await current(rig.page)).toEqual(cv);
    const pdf=await exported(rig,'confirmed-with-draft.pdf');expect(JSON.stringify(pdf.projection)).not.toContain('PRIVATE_DRAFT');
    await rig.page.getByRole('button',{name:/Recuperar borrador de/}).click();d=rig.page.getByRole('dialog');await expect(d.getByLabel(/^Email \(/)).toHaveValue('PRIVATE_DRAFT@example.test');await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();expect(await current(rig.page)).toEqual(cv);expect((await library(rig.page)).recovery).toHaveLength(0);
    d=await personal(rig.page);await d.getByLabel(/^Email \(/).fill('SECOND_DRAFT@example.test');await rig.page.evaluate(()=>window.cvforge.flush());await rig.crash();await rig.launch();await rig.page.getByRole('button',{name:/Descartar borrador de/}).click();await expect(rig.page.getByRole('region',{name:'Recuperación de borradores'})).not.toBeVisible();expect(await current(rig.page,cv.id)).toEqual(cv);
  }finally{await rig.dispose();}
});

test('F9 crash after durable PDF write before ExportRecord, destination failure and cancel cannot announce success or damage CV',async()=>{
  test.setTimeout(180000);const rig=await harness();const blocked=join(rig.dir,'unwritable');await mkdir(blocked);try{
    const f=completeProjectFixture();if(f.snapshot.scope!=='workspace')throw Error();const p=projectForCv(f.snapshot,f.snapshot.workspace.cvOrder[0]!);if(p.scope!=='cv')throw Error();p.cv.name='F9 crash export';await importReview(rig.page,encodeCvproj({...f,snapshot:p},f.ctx.now()),'crash-export.cvproj');await template(rig.page,'simple');const before=await current(rig.page),panel=await preview(rig.page);
    await rig.destination(null);await panel.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(panel.locator('[data-export-sha256]')).toHaveCount(0);
    await chmod(blocked,0o500);await rig.app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},join(blocked,'file.pdf'));await panel.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(panel.getByRole('alert')).toContainText('El CV confirmado se conserva');await expect(panel.locator('[data-export-sha256]')).toHaveCount(0);expect(await current(rig.page)).toEqual(before);await chmod(blocked,0o700);
    const orphan=(await rig.destination('written-before-crash.pdf'))!,sha=await panel.getAttribute('data-sha256');
    // Test-only external connection holds the writer lock. No fault hook is added
    // to production IPC; file write completes while the receipt worker is waiting.
    await rig.app.evaluate(({app})=>{const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json'),Database=require('better-sqlite3');const db=new Database(app.getPath('userData')+'/library/library.sqlite3');db.exec('BEGIN IMMEDIATE');(globalThis as any).__f9Lock=db;});
    await panel.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect.poll(async()=>stat(orphan).then(s=>s.size,()=>0),{timeout:4000,intervals:[20,30,50]}).toBeGreaterThan(0);const bytes=new Uint8Array(await readFile(orphan));expect(digest(bytes)).toBe(sha);await expect(panel.locator('[data-export-sha256]')).toHaveCount(0);await rig.crash();await rig.launch();
    await rig.page.getByRole('complementary').getByRole('button',{name:/F9 crash export/}).click();expect(await current(rig.page)).toEqual(before);expect(await rig.page.evaluate(id=>window.cvforge.pdfRecords(id),before.id)).toEqual({ok:true,value:[]});await pdfProjection(bytes);
    const retry=await exported(rig,'registered-after-crash.pdf');const records=await rig.page.evaluate(id=>window.cvforge.pdfRecords(id),before.id);expect(records.ok&&records.value.length).toBe(1);expect(records.ok&&records.value[0]!.sha256).toBe(retry.sha256);expect(digest(new Uint8Array(await readFile(orphan)))).toBe(sha);
    await rig.restart();expect(await rig.page.evaluate(id=>window.cvforge.pdfRecords(id),before.id)).toEqual(records);
    await writeFile(test.info().outputPath('export-crash.json'),JSON.stringify({actualProcessKilled:true,fileWritten:true,orphanPdfValid:true,receiptBeforeCrash:false,confirmedCvUnchanged:true,retryRecorded:true,durableAfterRestart:true,automaticPathReconciliation:false},null,2));
  }finally{await chmod(blocked,0o700);await rig.dispose();}
});

test('F9 AC-10 packaged import limits and ambiguity produce useful messages and no partial confirmation',async()=>{
  test.setTimeout(180000);const rig=await harness();try{
    const f=completeProjectFixture(),files=unzipSync(encodeCvproj(f,f.ctx.now()));const manifest=JSON.parse(new TextDecoder().decode(files['manifest.json']));manifest.projectFormatVersion=999;files['manifest.json']=new TextEncoder().encode(JSON.stringify(manifest));
    const cases=[{name:'broken.xml',bytes:new TextEncoder().encode('<broken>'),message:/XML.*dañado/},{name:'generic.pdf',bytes:await syntheticPdf(),message:/no contiene datos estructurados compatibles/},{name:'future.cvproj',bytes:zipSync(files,{level:0}),message:/versión|compatible/},{name:'corrupt.cvproj',bytes:new Uint8Array([80,75,3,4,0]),message:/dañado|corrupto|completar/},{name:'future.pdf',bytes:await syntheticPdf([{name:'payload',bytes:new TextEncoder().encode('{"format":"cvforge-export-payload","pdfPayloadFormatVersion":999,"projection":{}}')}]),message:/versión|compatible|datos/},{name:'oversized.pdf',bytes:new Uint8Array(50*1024*1024+1).fill(32),message:/límite|tamaño/}];
    cases.at(-1)!.bytes.set(new TextEncoder().encode('%PDF-1.7'));
    const before=await library(rig.page);for(const c of cases){const d=await importReview(rig.page,c.bytes,c.name,false);await expect(d).toContainText(c.message);await expect(d.getByRole('button',{name:'Confirmar importación',exact:true})).toHaveCount(0);await rig.page.keyboard.press('Escape');await expect(d).not.toBeVisible();expect(await library(rig.page)).toEqual(before);}
    let d=await importReview(rig.page,await syntheticPdf([{name:'first',bytes:xmlBytes()},{name:'second',bytes:xmlBytes({locale:'en'})}]),'ambiguous.pdf',false);await expect(d.getByRole('button',{name:'Confirmar importación',exact:true})).toHaveCount(0);await expect(d.getByRole('button',{name:'Revisar candidato second',exact:true})).toBeEnabled();await rig.page.keyboard.press('Escape');await expect(d).not.toBeVisible();
    d=await importReview(rig.page,xmlBytes({unknown:true}),'unknown.xml',false);await expect(d).toContainText('SYNTHETIC_UNMAPPED_PRIVATE');await rig.page.keyboard.press('Escape');await expect(d).not.toBeVisible();expect(await library(rig.page)).toEqual(before);
  }finally{await rig.dispose();}
});

test('F9 keyboard: modal focus/escape, field errors, create, reorder, presentation, preview and import remain usable',async()=>{
  const rig=await harness();try{
    const page=rig.page,create=page.getByRole('button',{name:'Crear CV',exact:true});await create.focus();await page.keyboard.press('Enter');let d=page.getByRole('dialog');await expect(d.getByLabel(/^Nombre del CV/)).toBeFocused();await page.keyboard.press('Escape');await expect(d).not.toBeVisible();await expect(create).toBeFocused();
    await page.keyboard.press('Enter');d=page.getByRole('dialog');await d.getByRole('button',{name:'Crear CV',exact:true}).press('Enter');const name=d.getByLabel(/^Nombre del CV/);await expect(name).toHaveAttribute('aria-invalid','true');await expect(name).toBeFocused();expect(await name.getAttribute('aria-describedby')).toBeTruthy();
    await name.fill('F9 keyboard');await name.press('Tab');await expect(d.getByLabel(/^Nombre para mostrar/)).toBeFocused();await d.getByLabel(/^Nombre para mostrar/).fill('Persona F9');await d.getByRole('button',{name:'Crear CV',exact:true}).press('Enter');await expect(d).not.toBeVisible();
    await page.getByRole('button',{name:'Editar datos personales',exact:true}).press('Enter');d=page.getByRole('dialog');await expect(d.getByLabel(/^Nombre para mostrar/)).toBeFocused();for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true);}await page.keyboard.press('Escape');await expect(d).not.toBeVisible();await expect(page.getByRole('button',{name:'Editar datos personales',exact:true})).toBeFocused();
    for(let i=0;i<4;i++){await page.keyboard.press('Enter');d=page.getByRole('dialog');await expect(d.getByLabel(/^Nombre para mostrar/)).toBeFocused();await page.keyboard.press('Escape');await expect(d).not.toBeVisible();await expect(page.getByRole('button',{name:'Editar datos personales',exact:true})).toBeFocused();}
    for(const [name,title] of [['Añadir sección de educación','Educación'],['Añadir sección de experiencia laboral','Experiencia laboral']] as const){await page.getByRole('button',{name,exact:true}).press('Enter');await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();}
    const before=await current(page);await page.getByRole('button',{name:'Reordenar secciones',exact:true}).press('Enter');d=page.getByRole('dialog');await d.getByRole('button',{name:'Subir Experiencia laboral',exact:true}).press('Enter');await d.getByRole('button',{name:'Confirmar',exact:true}).press('Enter');await expect(d).not.toBeVisible();expect((await current(page)).sectionOrder).toEqual([...before.sectionOrder].reverse());
    const presentation=page.getByRole('button',{name:'Presentación',exact:true});await presentation.press('Enter');d=page.getByRole('dialog');await d.getByLabel('Plantilla',{exact:true}).focus();await page.keyboard.press('ArrowDown');await d.getByRole('button',{name:'Confirmar',exact:true}).press('Enter');await expect(d).not.toBeVisible();expect((await current(page)).presentation.templateRef.id).toBe('lateral');await expect(presentation).toBeFocused();
    const panel=await preview(page);await panel.getByLabel('Zoom',{exact:true}).focus();await page.keyboard.press('ArrowDown');expect(await panel.getByLabel('Zoom',{exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
    const imported=page.getByRole('button',{name:'Importar archivo',exact:true});await imported.press('Enter');d=page.getByRole('dialog');await expect(d.getByLabel('Seleccionar archivo para importar',{exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(d).not.toBeVisible();await expect(imported).toBeFocused();
  }finally{await rig.dispose();}
});

test('F9 AC-05 sensitive original/translation/both, reused approval, nested cancel and stale review survive restart',async()=>{
  test.setTimeout(180000);const rig=await harness();try{
    const f=completeProjectFixture();if(f.snapshot.scope!=='workspace')throw Error();const p=projectForCv(f.snapshot,f.snapshot.workspace.cvOrder[0]!);if(p.scope!=='cv')throw Error();p.cv.name='F9 sensitive';await importReview(rig.page,encodeCvproj({...f,snapshot:p},f.ctx.now()),'sensitive.cvproj');await template(rig.page,'simple');
    const field=(cv:typeof p.cv)=>{const e=Object.values(cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='education')!;if(e.kind!=='education')throw Error();return e.fields.title;};
    const before=await current(rig.page),approval=field(before).approvalId!;
    const edit=async()=>{await rig.page.getByRole('region',{name:'Educación',exact:true}).getByRole('button',{name:'Editar entrada',exact:true}).click();return rig.page.getByRole('dialog',{name:'Editar educación',exact:true});};
    for(const [label,mode,original,translation] of [['Solo original','original',true,false],['Solo traducción','translation',false,true],['Traducción + original','translationAndOriginal',true,true]] as const){
      const d=await edit();await d.getByRole('button',{name:'Revisar traducción sensible de Titulación',exact:true}).click();const child=rig.page.getByRole('dialog',{name:'Revisión de traducción sensible',exact:true});await expect(child.getByLabel(/^English \(/)).toHaveValue('Reviewed synthetic degree');await child.getByLabel(label,{exact:true}).check();await child.getByRole('button',{name:'Confirmar revisión en borrador',exact:true}).click();await expect(child).not.toBeVisible();await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();
      const cv=await current(rig.page);expect(field(cv).original!.value).toBe('Título sintético');expect(field(cv).approvalId).toBe(approval);expect(field(cv).displayMode).toBe(mode);const pdf=await exported(rig,'sensitive-'+mode+'.pdf'),text=JSON.stringify(pdf.projection);expect(text.includes('Título sintético')).toBe(original);expect(text.includes('Reviewed synthetic degree')).toBe(translation);
    }
    const stable=await current(rig.page);let d=await edit();await d.getByRole('button',{name:'Revisar traducción sensible de Titulación',exact:true}).click();const child=rig.page.getByRole('dialog',{name:'Revisión de traducción sensible',exact:true});await child.getByLabel(/^English \(/).fill('UNCONFIRMED_CHILD_TRANSLATION');await child.getByLabel('He revisado y apruebo esta traducción',{exact:true}).check();await child.getByRole('button',{name:'Confirmar revisión en borrador',exact:true}).click();await expect(child).not.toBeVisible();await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();expect(JSON.stringify((await current(rig.page)).sensitiveTranslationMemory)).not.toContain('UNCONFIRMED_CHILD_TRANSLATION');expect(await current(rig.page)).toEqual(stable);expect((await library(rig.page)).recovery).toHaveLength(0);
    d=await edit();await d.getByLabel(/^Titulación \(/).fill('Título sintético actualizado F9');await expect(d.getByText(/Desactualizada: el original/)).toBeVisible();await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();await rig.restart();await rig.page.getByRole('complementary').getByRole('button',{name:/F9 sensitive/}).click();const cv=await current(rig.page);expect(field(cv).original!.value).toBe('Título sintético actualizado F9');expect(cv.sensitiveTranslationMemory[approval]!.value).toBe('Reviewed synthetic degree');d=await edit();await expect(d.getByText(/Desactualizada: el original/)).toBeVisible();await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();
  }finally{await rig.dispose();}
});

test('F9 100-CV library: restore, select last, confirm, return by keyboard and reopen without changing another CV',async()=>{
  test.setTimeout(180000);const rig=await harness();try{
    const corpus=f9Workspace();const d=await importReview(rig.page,encodeCvproj(corpus,'2026-10-23T12:00:00.000Z'),'synthetic-100.cvproj',false);
    expect((await library(rig.page)).cvs).toHaveLength(0);
    await d.getByRole('button',{name:'Confirmar restauración',exact:true}).click();await expect(d).not.toBeVisible();
    const list=await library(rig.page);expect(list.cvs).toHaveLength(100);const first=await current(rig.page,list.cvs[0]!.id);
    const chooseLast=async()=>{await rig.page.getByRole('complementary').getByRole('button',{name:/F9 100 skills/}).click();await expect(rig.page.getByRole('heading',{name:'F9 100 skills',exact:true})).toBeVisible();};
    await chooseLast();let form=await personal(rig.page);await form.getByLabel(/^Email \(/).fill('hundred@example.test');await form.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(form).not.toBeVisible();expect((await library(rig.page)).cvs).toHaveLength(100);
    await rig.page.getByRole('complementary').getByRole('button',{name:/F9 001 small/}).press('Enter');await expect(rig.page.getByRole('heading',{name:'F9 001 small',exact:true})).toBeVisible();expect(await current(rig.page,first.id)).toEqual(first);
    await rig.restart();expect((await library(rig.page)).cvs).toHaveLength(100);await chooseLast();form=await personal(rig.page);await expect(form.getByLabel(/^Email \(/)).toHaveValue('hundred@example.test');await form.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(form).not.toBeVisible();
    await rig.page.screenshot({path:test.info().outputPath('100-cv-visible-viewport.png')});await writeFile(test.info().outputPath('100-cv.json'),JSON.stringify({cvs:100,lastSelectable:true,confirmed:true,keyboardReturn:true,otherCvUnchanged:true,reopened:true},null,2));
  }finally{await rig.dispose();}
});
