import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { CoreEditorService } from '../src/application/editor.js';
import { candidateFromForm, dateInput, editText, entryPath, parseDateInput } from '../src/application/editor-model.js';
import type { EditorForm } from '../src/application/editor-model.js';
import { createExportProjection } from '../src/domain/index.js';
import { makeAsset } from '../src/adapters/asset-bytes.js';
import { libraryFixture, runtimeContext } from './library-helpers.js';
import { syntheticPng } from './fixtures.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';

async function setup(t:TestContext) {
  const fixture = await libraryFixture(t,false), editor = new CoreEditorService(fixture.library,runtimeContext);
  await editor.start(); const {cv} = await editor.create('CV sintético','Persona Sintética Ștefan');
  return {...fixture,editor,cv};
}
function setTitle(form:EditorForm,value:string):void {
  if (form.target.kind !== 'entry') throw new Error('target');
  const entry = form.cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;
  if (entry.kind === 'education') entry.fields.title = editText(entry.fields.title,value,'es',true) as typeof entry.fields.title;
  if (entry.kind === 'work') entry.fields.position = editText(entry.fields.position,value,'es',true) as typeof entry.fields.position;
}
test('F4 email Cancelar preserves confirmed data/revision and removes recovery; Confirmar survives a new SQLite instance',async t => {
  const f = await setup(t); let form = await f.editor.begin(f.cv.id,f.cv.revision,{kind:'personal'});
  const emailId = runtimeContext.newId();
  form.cv.personalInformation.contacts.push({id:emailId,kind:'email',label:null,value:'a@example.test'});
  form.cv.presentation.personalFieldVisibility.contacts.push(emailId);
  let {cv} = await f.editor.confirm(form); const revision = cv.revision;
  form = await f.editor.begin(cv.id,cv.revision,{kind:'personal'});
  const email = form.cv.personalInformation.contacts[0]!; if (email.kind !== 'email') throw new Error('fixture'); email.value = 'b@example.test';
  f.editor.stage(form); await f.editor.flush(); cv = (await f.editor.cancel()).cv;
  assert.equal((cv.personalInformation.contacts[0] as {value:string}).value,'a@example.test'); assert.equal(cv.revision,revision);
  assert.equal((await f.library.recoverableDrafts()).length,0);
  form = await f.editor.begin(cv.id,cv.revision,{kind:'personal'}); (form.cv.personalInformation.contacts[0] as {value:string}).value = 'b@example.test';
  cv = (await f.editor.confirm(form)).cv; await f.editor.close();
  const reopened = await f.open(); const next = await reopened.library.openCv(cv.id);
  assert.deepEqual(next,cv); assert.equal((next.personalInformation.contacts[0] as {value:string}).value,'b@example.test');
  assert.equal((await reopened.library.health()).foreignKeyViolations,0);
});
test('F4 edits exactly one education, preserves all fields of its siblings and multiple work entries after reopen',async t => {
  const f = await setup(t); let cv = (await f.editor.addSection(f.cv.id,f.cv.revision,'education')).cv;
  const educationId = cv.sectionOrder[0]!;
  for (const title of ['Educación A','Educación B','Educación C']) {
    const form = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId:educationId}); setTitle(form,title); cv = (await f.editor.confirm(form)).cv;
  }
  const [a,b,c] = cv.sectionsById[educationId]!.entryOrder!;
  const previous = structuredClone(cv), form = await f.editor.begin(cv.id,cv.revision,{kind:'entry',sectionId:educationId,entryId:b!});
  setTitle(form,'Educación B revisada'); cv = (await f.editor.confirm(form)).cv;
  assert.deepEqual(cv.sectionsById[educationId]!.entriesById[a!],previous.sectionsById[educationId]!.entriesById[a!]);
  assert.deepEqual(cv.sectionsById[educationId]!.entriesById[c!],previous.sectionsById[educationId]!.entriesById[c!]);
  cv = (await f.editor.addSection(cv.id,cv.revision,'work')).cv; const workId = cv.sectionOrder[1]!;
  for (const title of ['Puesto A','Puesto B','Puesto C']) {
    const form = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId:workId}); setTitle(form,title);
    if (form.target.kind !== 'entry') throw new Error('target');
    const entry = form.cv.sectionsById[workId]!.entriesById[form.target.entryId]!;
    if (entry.kind !== 'work') throw new Error('kind'); entry.fields.period.ongoing = true;
    form.rawDates[entryPath(workId,entry.id)+'.fields.period.start'] = '2020-02';
    cv = (await f.editor.confirm(form)).cv;
  }
  await f.editor.close(); const reopened = await f.open(); assert.deepEqual(await reopened.library.openCv(cv.id),cv);
});
test('F4 invalid raw dates survive validation and recovery; Cancelar restores the original partial date',async t => {
  const f = await setup(t); let cv = (await f.editor.addSection(f.cv.id,f.cv.revision,'work')).cv;
  const sectionId = cv.sectionOrder[0]!, initial = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId}); setTitle(initial,'Analista');
  if (initial.target.kind !== 'entry') throw new Error('target');
  const path = entryPath(sectionId,initial.target.entryId)+'.fields.period.start'; initial.rawDates[path] = '2020';
  cv = (await f.editor.confirm(initial)).cv;
  const form = await f.editor.begin(cv.id,cv.revision,initial.target); form.rawDates[path] = '2020-02-31';
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);
  assert.equal(((await f.library.recoverableDrafts())[0]!.draft.values as EditorForm).rawDates[path],'2020-02-31');
  assert.deepEqual(await f.library.openCv(cv.id),cv); await f.editor.close();
  const reopened = await f.open(), editor = new CoreEditorService(reopened.library,runtimeContext), state = await editor.start();
  const recovered = await editor.recover(state.recovery[0]!.id); assert.equal(recovered.form.rawDates[path],'2020-02-31');
  assert.deepEqual((await editor.cancel()).cv,cv); assert.equal((await reopened.library.recoverableDrafts()).length,0);
});
test('F4 dates never invent precision, accept end-only and ongoing, and reject inverted/impossible values',() => {
  for (const raw of ['0001','2020','2020-02','2020-02-29','9999-12-31']) assert.equal(dateInput(parseDateInput(raw)),raw);
  assert.equal(parseDateInput(''),null);
  for (const raw of ['0','2020-2','2021-02-29','2020-13','2020-04-31',' 2020']) assert.throws(()=>parseDateInput(raw));
});
test('F4 photo replacement is draft-only, cancel keeps previous bytes; confirmed photo and removal preserve history and integrity',async t => {
  const f = await setup(t); let form = await f.editor.begin(f.cv.id,f.cv.revision,{kind:'personal'});
  const firstBytes = syntheticPng(), first = makeAsset(runtimeContext.newId(),firstBytes,'photo','image/png');
  form = (await f.editor.stagePhoto(first,firstBytes)).form; let {cv} = await f.editor.confirm(form);
  form = await f.editor.begin(cv.id,cv.revision,{kind:'personal'});
  const replacementBytes = syntheticPng(2,2), replacement = makeAsset(runtimeContext.newId(),replacementBytes,'photo','image/png');
  await f.editor.stagePhoto(replacement,replacementBytes); cv = (await f.editor.cancel()).cv;
  assert.equal(cv.personalInformation.photo!.assetId,first.id);
  assert(!Object.hasOwn((await f.library.snapshot()).content.assetsById,replacement.id));
  await f.editor.close(); const reopened = await f.open(), editor = new CoreEditorService(reopened.library,runtimeContext);
  assert.deepEqual((await editor.open(cv.id)).photo!.bytes,firstBytes);
  form = await editor.begin(cv.id,cv.revision,{kind:'personal'}); form.cv.personalInformation.photo = null; cv = (await editor.confirm(form)).cv;
  assert.equal(cv.personalInformation.photo,null); assert((await reopened.library.snapshot()).content.assetsById[first.id]);
  assert.deepEqual((await reopened.library.health()).integrity,['ok']);
});
test('F4 hide/show keeps content; excluded personal fields stay in project and never enter export projection',async t => {
  const f = await setup(t); let form = await f.editor.begin(f.cv.id,f.cv.revision,{kind:'personal'});
  form.cv.personalInformation.givenName = 'Nombre ocultable'; form.cv.presentation.personalFieldVisibility.givenName = false;
  let {cv} = await f.editor.confirm(form);
  assert.equal(cv.personalInformation.givenName,'Nombre ocultable'); assert(!JSON.stringify(createExportProjection(cv)).includes('Nombre ocultable'));
  cv = (await f.editor.addSection(cv.id,cv.revision,'education')).cv;
  const sectionId = cv.sectionOrder[0]!; form = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId}); setTitle(form,'Título ocultable');
  cv = (await f.editor.confirm(form)).cv; const entryId = cv.sectionsById[sectionId]!.entryOrder![0]!;
  const entry = structuredClone(cv.sectionsById[sectionId]!.entriesById[entryId]);
  cv = (await f.editor.visibility(cv.id,cv.revision,sectionId,entryId,false)).cv;
  assert.deepEqual(cv.sectionsById[sectionId]!.entriesById[entryId],{...entry,included:false});
  assert(!JSON.stringify(createExportProjection(cv)).includes('Título ocultable'));
  cv = (await f.editor.visibility(cv.id,cv.revision,sectionId,entryId,true)).cv;
  assert.deepEqual(cv.sectionsById[sectionId]!.entriesById[entryId],entry);
});
test('F4 reorder C,A,B needs confirmation, survives restart, and cancel leaves old order',async t => {
  const f = await setup(t); let cv = (await f.editor.addSection(f.cv.id,f.cv.revision,'education')).cv;
  const sectionId = cv.sectionOrder[0]!;
  for (const title of ['A','B','C']) { const form = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId}); setTitle(form,title); cv = (await f.editor.confirm(form)).cv; }
  const [a,b,c] = cv.sectionsById[sectionId]!.entryOrder!;
  let form = await f.editor.begin(cv.id,cv.revision,{kind:'order',sectionId}); form.cv.sectionsById[sectionId]!.entryOrder = [c!,a!,b!];
  f.editor.stage(form); assert.deepEqual((await f.library.openCv(cv.id)).sectionsById[sectionId]!.entryOrder,[a,b,c]);
  await f.editor.cancel(); form = await f.editor.begin(cv.id,cv.revision,{kind:'order',sectionId}); form.cv.sectionsById[sectionId]!.entryOrder = [c!,a!,b!];
  cv = (await f.editor.confirm(form)).cv;
  cv=(await f.editor.addSection(cv.id,cv.revision,'work')).cv;const sectionOrder=[...cv.sectionOrder].reverse();
  form=await f.editor.begin(cv.id,cv.revision,{kind:'order',sectionId:null});form.cv.sectionOrder=sectionOrder;cv=(await f.editor.confirm(form)).cv;
  await f.editor.close(); const reopened = await f.open();
  assert.deepEqual((await reopened.library.openCv(cv.id)).sectionsById[sectionId]!.entryOrder,[c,a,b]);
  assert.deepEqual((await reopened.library.openCv(cv.id)).sectionOrder,sectionOrder);
});
test('F4 deletion is explicit, removes only target, retains history; stale edits and out-of-scope writes are rejected',async t => {
  const f = await setup(t); let cv = (await f.editor.addSection(f.cv.id,f.cv.revision,'education')).cv;
  const sectionId = cv.sectionOrder[0]!, form = await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId}); setTitle(form,'A');
  cv = (await f.editor.confirm(form)).cv; const entryId = cv.sectionsById[sectionId]!.entryOrder![0]!;
  await assert.rejects(f.editor.remove(cv.id,cv.revision,sectionId,entryId,false as true),/DELETE_CONFIRMATION_REQUIRED/);
  cv = (await f.editor.remove(cv.id,cv.revision,sectionId,entryId,true)).cv;
  assert.deepEqual(cv.sectionsById[sectionId]!.entryOrder,[]); assert.deepEqual(cv.sectionsById[sectionId]!.entriesById,{});
  assert((await f.library.listRevisions(cv.id)).some(r => r.snapshot.sectionsById[sectionId]?.entriesById[entryId]));
  await assert.rejects(f.editor.begin(cv.id,cv.revision-1,{kind:'personal'}),/REVISION_CONFLICT/);
  const personal = await f.editor.begin(cv.id,cv.revision,{kind:'personal'}); personal.cv.name = 'Outside';
  assert.throws(()=>f.editor.stage(personal),/EDITOR_SCOPE_CHANGED/); await f.editor.cancel();
  assert.equal((await f.library.health()).foreignKeyViolations,0);
});
test('F4 keeps profile and other CV independent and existing sensitive approvals untouched',async t => {
  const f = await libraryFixture(t), editor = new CoreEditorService(f.library,runtimeContext);
  const before = await f.library.snapshot(), cv = await f.library.openCv(f.cvId);
  const form = await editor.begin(cv.id,cv.revision,{kind:'personal'}); form.cv.personalInformation.displayName = 'Edited synthetic name';
  await editor.confirm(form); const after = await f.library.snapshot();
  assert.deepEqual(after.content.workspace.profile,before.content.workspace.profile);
  const other = before.content.workspace.cvOrder[1]!;
  assert.deepEqual(after.content.workspace.cvsById[other],before.content.workspace.cvsById[other]);
  assert.deepEqual(after.content.workspace.cvsById[cv.id]!.sensitiveTranslationMemory,cv.sensitiveTranslationMemory);
  assert.deepEqual(after.content.workspace.cvsById[cv.id]!.sectionsById,cv.sectionsById);
  const portable=cvprojCodec.decode(await f.library.exportCvproj(cv.id));
  if(portable.snapshot.scope !== 'cv')throw new Error('scope');
  assert.deepEqual(portable.snapshot.cv,after.content.workspace.cvsById[cv.id]);
  assert(portable.snapshot.revisions.length>0);assert.equal(portable.snapshot.assetsById[cv.personalInformation.photo!.assetId]!.sha256,before.content.assetsById[cv.personalInformation.photo!.assetId]!.sha256);
});
test('F4 inverted/ongoing periods and invalid numbers keep raw input; a corrected form can confirm',async t=>{
  const f=await setup(t);let cv=(await f.editor.addSection(f.cv.id,f.cv.revision,'education')).cv;
  const sectionId=cv.sectionOrder[0]!,form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});setTitle(form,'Título sintético');
  if(form.target.kind !== 'entry')throw new Error('target');
  const path=entryPath(sectionId,form.target.entryId)+'.fields',entry=form.cv.sectionsById[sectionId]!.entriesById[form.target.entryId]!;
  if(entry.kind !== 'education')throw new Error('kind');
  form.rawDates[path+'.period.start']='2024-12';form.rawDates[path+'.period.end']='2020';
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);
  assert.equal(((await f.library.recoverableDrafts())[0]!.draft.values as EditorForm).rawDates[path+'.period.end'],'2020');
  entry.fields.period.ongoing=true;form.rawDates[path+'.period.end']='2025';
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);assert.equal(form.rawDates[path+'.period.end'],'2025');
  form.rawDates[path+'.period.end']='';form.rawNumbers[path+'.eqf']='not-a-number';
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);
  assert.equal(((await f.library.recoverableDrafts())[0]!.draft.values as EditorForm).rawNumbers[path+'.eqf'],'not-a-number');
  form.rawNumbers[path+'.eqf']='6';cv=(await f.editor.confirm(form)).cv;
  const saved=cv.sectionsById[sectionId]!.entriesById[form.target.entryId]!;if(saved.kind!=='education')throw new Error('kind');
  assert.deepEqual(saved.fields.period,{start:{precision:'month',year:2024,month:12},end:null,ongoing:true});assert.equal(saved.fields.eqf,6);
});
test('F4 an empty repeatable address remains a draft until given data; confirmed location has a valid visible projection',async t=>{
  const f=await setup(t),form=await f.editor.begin(f.cv.id,f.cv.revision,{kind:'personal'}),id=runtimeContext.newId();
  form.cv.personalInformation.addresses.push({id,lines:[],locality:null,region:null,postalCode:null,countryCode:null,original:null});form.cv.presentation.personalFieldVisibility.addresses.push(id);
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);assert.equal((await f.library.openCv(f.cv.id)).personalInformation.addresses.length,0);
  form.cv.personalInformation.addresses[0]!.locality='Ciudad Sintética';const {cv}=await f.editor.confirm(form);
  assert(JSON.stringify(createExportProjection(cv)).includes('Ciudad Sintética'));
});
