import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DraftAutosaver } from '../src/application/autosave.js';
import { makeAsset } from '../src/adapters/asset-bytes.js';
import { decodeCvproj } from '../src/adapters/cvproj.js';
import { libraryFixture, runtimeContext } from './library-helpers.js';
import { syntheticPng } from './fixtures.js';

test('raw invalid draft survives reopen, requires acceptance, and Cancel leaves confirmed state unchanged', async t => {
  const {library,repository,open,cvId} = await libraryFixture(t), confirmed = await library.openCv(cvId);
  const draft = await library.beginDraft(cvId,confirmed.revision,['sectionsById',confirmed.sectionOrder[0]!]);
  const raw = {...structuredClone(confirmed),name:'PRIVATE_UNCONFIRMED_DRAFT',rawPeriod:'2026-99-'};
  const saved = await library.updateDraft(draft.id,0,{values:raw,rawDateInputs:{end:'2026-99-'},assetIds:[],templateRefs:[]});
  assert.deepEqual(await library.openCv(cvId),confirmed);
  await assert.rejects(library.exportCvproj(cvId),/DRAFTS_PENDING/);
  const exported = await library.exportCvproj(cvId,true); assert(!Buffer.from(exported).includes(Buffer.from('PRIVATE_UNCONFIRMED_DRAFT')));
  assert.equal(decodeCvproj(exported).snapshot.scope,'cv');
  await repository.close();
  const again = (await open()).library, recoverable = await again.recoverableDrafts();
  assert.equal(recoverable.length,1); assert.equal(recoverable[0]!.conflict,false);
  assert.deepEqual((await again.acceptRecovery(draft.id)).values,raw);
  await assert.rejects(again.confirmDraft(draft.id,saved.version,raw));
  assert.deepEqual(await again.openCv(cvId),confirmed);
  assert.equal((await again.recoverableDrafts()).length,1);
  await again.discardDraft(draft.id,saved.version);
  assert.equal((await again.recoverableDrafts()).length,0); assert.deepEqual(await again.openCv(cvId),confirmed);
});
test('confirming a valid recovered draft atomically updates entity/history and removes the draft', async t => {
  const {library,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), draft = await library.beginDraft(cvId,cv.revision);
  const changed = {...cv,name:'Confirmado después de recuperación'};
  const updated = await library.updateDraft(draft.id,0,{values:changed,rawDateInputs:{},assetIds:[],templateRefs:[]});
  const saved = await library.confirmDraft(draft.id,updated.version,changed);
  assert.equal(saved.revision,cv.revision+1); assert.equal((await library.openCv(cvId)).name,changed.name);
  assert.equal((await library.recoverableDrafts()).length,0);
  assert((await library.listRevisions(cvId)).some(r => r.number === cv.revision && r.snapshot.kind === 'cv' && r.snapshot.name === cv.name));
});
test('stale drafts remain inspectable but cannot overwrite a newer confirmation', async t => {
  const {library,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), draft = await library.beginDraft(cvId,cv.revision);
  await library.renameCv(cvId,'Revisión nueva',cv.revision);
  const recoveries = await library.recoverableDrafts(); assert.equal(recoveries[0]!.conflict,true);
  await assert.rejects(library.acceptRecovery(draft.id),/DRAFT_BASE_CONFLICT/);
  await assert.rejects(library.confirmDraft(draft.id,0,cv),/REVISION_CONFLICT/);
  assert.equal((await library.openCv(cvId)).name,'Revisión nueva');
  await library.discardDraft(draft.id,0);
});
test('draft-only image bytes persist and are collected after discard, without entering cvproj', async t => {
  const {library,repository,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), d = await library.beginDraft(cvId,cv.revision);
  const bytes = syntheticPng(8,3,'PRIVATE_DRAFT_ASSET'), asset = makeAsset(runtimeContext.newId(),bytes,'photo','image/png');
  const updated = await library.updateDraft(d.id,0,{values:{photoCandidate:asset.id},rawDateInputs:{},assetIds:[asset.id],templateRefs:[]},{assetsById:{[asset.id]:asset},blobs:new Map([[asset.sha256,bytes]])});
  assert.equal((await repository.health()).counts.blobs,2);
  const exported = await library.exportCvproj(undefined,true); assert(!Buffer.from(exported).includes(Buffer.from('PRIVATE_DRAFT_ASSET')));
  await library.discardDraft(d.id,updated.version); assert.equal((await repository.health()).counts.blobs,1);
});
test('autosave coalesces rapid edits, flush waits for durable acknowledgement and preserves the confirmed CV', async t => {
  const {library,repository,open,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), draft = await library.beginDraft(cvId,cv.revision);
  const statuses: string[] = [], saver = new DraftAutosaver(library,draft,{delayMs:25,maxWaitMs:80,onStatus:s => statuses.push(s)});
  for (let i=0;i<100;i++) saver.schedule({values:{description:`Edición ${i}`},rawDateInputs:{},assetIds:[],templateRefs:[]});
  const before = (await library.snapshot()).generation; await saver.finish();
  assert.equal((await library.snapshot()).generation,before+1);
  assert.equal(saver.status,'saved'); assert(statuses.includes('saving'));
  assert.deepEqual(await library.openCv(cvId),cv); await repository.close();
  const again = (await open()).library, recovered = await again.acceptRecovery(draft.id);
  assert.deepEqual(recovered.values,{description:'Edición 99'}); assert.equal(recovered.version,1);
});
test('autosave reports conflicts as errors and a failed flush never reports saved or closes storage', async t => {
  const {library,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), draft = await library.beginDraft(cvId,cv.revision);
  const statuses: string[] = [], saver = new DraftAutosaver(library,draft,{onStatus:s => statuses.push(s)});
  await library.updateDraft(draft.id,0,{values:{newer:'Cambio de otra sesión'},rawDateInputs:{},assetIds:[],templateRefs:[]});
  saver.schedule({values:{stale:'Viejo'},rawDateInputs:{},assetIds:[],templateRefs:[]});
  await assert.rejects(saver.finish(),/DRAFT_CONFLICT/); assert.equal(saver.status,'error'); assert(!statuses.includes('saved'));
  assert.deepEqual((await library.acceptRecovery(draft.id)).values,{newer:'Cambio de otra sesión'});
});
test('save and close explicitly preserves or discards drafts; neither action silently confirms form values', async t => {
  const {library,open,cvId} = await libraryFixture(t), cv = await library.openCv(cvId), draft = await library.beginDraft(cvId,cv.revision);
  await library.saveAndClose('preserveForRecovery'); const next = (await open()).library;
  assert.equal((await next.recoverableDrafts()).length,1); assert.deepEqual(await next.openCv(cvId),cv);
  await next.saveAndClose('discard'); const third = (await open()).library;
  assert.equal((await third.recoverableDrafts()).length,0); assert.deepEqual(await third.openCv(cvId),cv);
});
