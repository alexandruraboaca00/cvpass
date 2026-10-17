import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { desktopHarness } from './desktop-harness.js';
import { xmlBytes, europassXml, syntheticPdf } from '../f6/fixtures.js';
import { completeProjectFixture } from '../fixtures.js';
import { encodeCvproj } from '../../src/adapters/cvproj.js';
import { encodePdfAttachment } from '../../src/adapters/import/pdf-payload.js';
import { createExportProjection, projectForCv } from '../../src/domain/index.js';
const review=async(page:Page,bytes:Uint8Array,name:string)=>{
  await page.getByRole('button',{name:'Importar archivo',exact:true}).click();const d=page.getByRole('dialog',{name:'Importar archivo',exact:true});
  await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
  await expect(d.getByText('Analizando archivo local…',{exact:true})).not.toBeVisible();return d;
};
const list=async(page:Page)=>page.evaluate(async()=>{const r=await window.cvforge.list();if(!r.ok)throw new Error(r.error.code);return r.value;});
test('F6 review, nested child cancellation, keyboard cancel and unsupported/corrupt errors leave library unchanged',async()=>{
  const rig=await desktopHarness();const page=rig.page;
  try{
    const before=await list(page);let d=await review(page,xmlBytes({unknown:true}),'synthetic.renamed');await expect(d.getByLabel(/^Nombre del nuevo CV/)).toBeVisible();expect(await list(page)).toEqual(before);
    await d.getByLabel(/^Email/).fill('cancelled@example.test');await d.getByRole('button',{name:'Revisar habilidades y grupos',exact:true}).click();await d.getByRole('button',{name:'Crear grupo',exact:true}).click();const child=page.getByRole('dialog',{name:'Editar grupo',exact:true});await child.getByLabel(/^Nombre del grupo \(/).fill('Cancelled child');await child.getByRole('button',{name:'Confirmar hijo en borrador',exact:true}).click();
    await d.getByRole('button',{name:'Cancelar importación',exact:true}).focus();await page.keyboard.press('Enter');await expect(d).not.toBeVisible();expect(await list(page)).toEqual(before);
    d=await review(page,await syntheticPdf(),'generic.pdf');await expect(d.getByText(/Este PDF no contiene datos estructurados compatibles/)).toBeVisible();await expect(d.getByRole('button',{name:'Confirmar importación',exact:true})).toHaveCount(0);await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();
    d=await review(page,new TextEncoder().encode('<broken>'),'broken.xml');await expect(d.getByText(/El XML está dañado/)).toBeVisible();await page.keyboard.press('Escape');await expect(d).not.toBeVisible();expect(await list(page)).toEqual(before);
    const {record,health}=await rig.read();expect(record.content.workspace.cvOrder).toEqual([]);expect(record.content.drafts).toEqual([]);expect(health.integrity).toEqual(['ok']);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
test('F6 reviewed Europass PDF keeps invalid date input, corrections, all blocks and photo across real restart',async()=>{
  const rig=await desktopHarness();let page=rig.page;
  try{
    const d=await review(page,await syntheticPdf([{name:'not-the-usual-name.bin',bytes:new TextEncoder().encode(europassXml({partialDate:'2024-02-30',listeningOnly:true,unknown:true}).replace('<e:EducationLevelCode>6</e:EducationLevelCode>','<e:OrganizationContact><e:Communication><e:ChannelCode>Web</e:ChannelCode><o:URI>www.example.test/institute</o:URI></e:Communication></e:OrganizationContact><e:EducationLevelCode>6</e:EducationLevelCode>'))},{name:'irrelevant.txt',bytes:new TextEncoder().encode('synthetic unrelated')}]),'structured.pdf');
    await d.getByLabel(/^Nombre del nuevo CV/).fill('F6 reviewed');await d.getByLabel(/^Email/).fill('reviewed@example.test');await d.getByRole('checkbox',{name:/He revisado la propuesta/}).check();
    await d.getByRole('button',{name:'Revisar Educación: Titulación sintética 1',exact:true}).click();await expect(d.getByLabel(/^Fecha de inicio/)).toHaveValue('2024-02-30');await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d.getByRole('alert')).toContainText('Fecha inválida');await expect(d.getByLabel(/^Fecha de inicio/)).toHaveValue('2024-02-30');expect((await list(page)).cvs).toHaveLength(0);
    await expect(d.getByLabel(/^Sitio web/)).toHaveValue('www.example.test/institute');await d.getByLabel(/^Sitio web/).fill('https://www.example.test/institute');await d.getByLabel(/^Fecha de inicio/).fill('2024-02');await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();await expect(page.getByRole('heading',{name:'F6 reviewed',exact:true})).toBeVisible();
    page=await rig.restart();await page.getByRole('complementary').getByRole('button',{name:/F6 reviewed/}).click();await expect(page.getByText('reviewed@example.test',{exact:true})).toBeVisible();
    const {record,health}=await rig.read(),cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]],entries=Object.values(cv.sectionsById).flatMap((s:any)=>Object.values(s.entriesById)) as any[];
    expect(entries.filter(e=>e.kind==='education')).toHaveLength(8);expect(entries.filter(e=>e.kind==='work')).toHaveLength(3);expect(entries.filter(e=>e.kind==='skill')).toHaveLength(18);expect(Object.values(cv.sectionsById).filter((s:any)=>s.kind==='custom')).toHaveLength(2);
    expect(entries.find(e=>e.kind==='foreignLanguage').fields.proficiency).toEqual({listening:'B1',reading:null,spokenInteraction:null,spokenProduction:null,writing:null});expect(cv.personalInformation.photo).not.toBeNull();expect(record.content.blobs.size).toBe(2);expect(record.content.drafts).toEqual([]);expect(health.integrity).toEqual(['ok']);expect(health.foreignKeyViolations).toBe(0);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
test('F6 different PDF candidates require choice; own visible sensitive text is correctable without fabricated original',async()=>{
  const rig=await desktopHarness();let page=rig.page;
  try{
    let d=await review(page,await syntheticPdf([{name:'es.xml',bytes:xmlBytes()},{name:'en.xml',bytes:xmlBytes({locale:'en'})}]),'two.pdf');await expect(d.getByRole('button',{name:'Confirmar importación',exact:true})).toHaveCount(0);await d.getByRole('button',{name:'Revisar candidato en.xml',exact:true}).click();await expect(d.getByLabel('Idioma del documento importado',{exact:true})).toHaveValue('en');await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();
    const fixture=completeProjectFixture(),snapshot=projectForCv(fixture.snapshot,fixture.snapshot.scope==='workspace'?fixture.snapshot.workspace.cvOrder[0]!:'');if(snapshot.scope!=='cv')throw new Error();snapshot.cv.personalInformation.photo=null;
    const projection=createExportProjection(snapshot.cv);d=await review(page,await syntheticPdf([{name:'payload.data',bytes:encodePdfAttachment(projection)}]),'own.pdf');await d.getByLabel(/^Nombre del nuevo CV/).fill('F6 own visible');const nav=d.getByRole('navigation',{name:'Datos recuperados',exact:true});await nav.getByRole('button',{name:/Revisar Certificaciones:/}).first().click();await d.getByLabel(/^Texto visible 1/).first().fill('Corrected visible qualification');await d.getByRole('checkbox',{name:/He revisado la propuesta/}).check();await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();
    page=await rig.restart();const {record}=await rig.read(),cv=record.content.workspace.cvsById[record.content.workspace.cvOrder[0]],e=Object.values(cv.sectionsById).flatMap((s:any)=>Object.values(s.entriesById)).find((e:any)=>e.kind==='certification') as any;expect(e.fields.title.original).toBeNull();expect(e.fields.title.importedVisibleVariants[0].value).toBe('Corrected visible qualification');expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
test('F6 native cvproj content signature reviews new CV and workspace restore refuses nonempty library',async()=>{
  const rig=await desktopHarness();const page=rig.page;
  try{
    const fixture=completeProjectFixture(),id=fixture.snapshot.scope==='workspace'?fixture.snapshot.workspace.cvOrder[0]!:'';
    let d=await review(page,encodeCvproj({...fixture,snapshot:projectForCv(fixture.snapshot,id)},fixture.ctx.now()),'native.wrong-extension');await d.getByLabel(/^Nombre del nuevo CV/).fill('F6 native');await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();const before=await list(page);
    d=await review(page,encodeCvproj(fixture,fixture.ctx.now()),'workspace.cvproj');await expect(d.getByRole('heading',{name:'Este proyecto contiene una biblioteca completa',exact:true})).toBeVisible();await d.getByRole('button',{name:'Confirmar restauración',exact:true}).click();await expect(d.getByRole('alert')).toContainText('no está vacía');await d.getByRole('button',{name:'Cancelar importación',exact:true}).click();expect(await list(page)).toEqual(before);expect(rig.errors).toEqual([]);
  }finally{await rig.dispose();}
});
