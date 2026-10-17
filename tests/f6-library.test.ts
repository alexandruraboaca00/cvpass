import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { libraryFixture, runtimeContext as ctx } from './library-helpers.js';
import { context, completeProjectFixture, syntheticPng } from './fixtures.js';
import { xmlBytes, syntheticPdf } from './f6/fixtures.js';
import { StructuredImportService } from '../src/application/structured-import.js';
import type { ImportView, ImportReviewInput } from '../src/application/structured-import.js';
import { analyzeImport } from '../src/adapters/import/analyze.js';
import { LocalStructuredImport } from '../src/adapters/import/worker-port.js';
import { ImportFailure } from '../src/application/import-contract.js';
import { LibraryService } from '../src/application/library.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';
import { SqliteEngine } from '../src/adapters/sqlite/engine.js';
import { encodeCvproj, decodeCvproj } from '../src/adapters/cvproj.js';
import { encodePdfAttachment } from '../src/adapters/import/pdf-payload.js';
import { createExportProjection, buildLanguagePlan, canonical, projectForCv, validateCv } from '../src/domain/index.js';
import { makeAsset } from '../src/adapters/asset-bytes.js';

const port={analyze:(bytes:Uint8Array,name:string)=>analyzeImport(bytes,name,ctx)};
const review=(view:ImportView):ImportReviewInput=>{const d=view.draft!;return {cv:structuredClone(d.cv),rawDates:{...d.rawDates},rawNumbers:{...d.rawNumbers},documentLocale:d.documentLocale,acknowledgeIssues:true};};
test('F6 file, proposal, reviewed corrections, one commit, new connection and exact SQLite recovery',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),before=await f.library.snapshot();
  const view=await service.begin(ctx.newId(),xmlBytes({unknown:true}),'synthetic.data');assert.deepEqual(await f.library.snapshot(),before);
  const input=review(view);input.cv.name='Confirmed synthetic import';input.cv.personalInformation.contacts[0]={...input.cv.personalInformation.contacts[0]!,kind:'email',label:null,value:'reviewed@example.test'};
  const {cvId}=await service.confirm(view.id,input),saved=await f.library.openCv(cvId);
  assert.equal(saved.personalInformation.contacts[0]!.kind,'email');assert.equal(saved.importRecords![0]!.source.fileName,'synthetic.data');assert(saved.importRecords![0]!.issues.some(i=>i.valuePreview==='SYNTHETIC_UNMAPPED_PRIVATE'&&i.resolution==='excluded'));
  const after=await f.library.snapshot();assert.equal(after.generation,before.generation+1);assert.deepEqual(after.content.workspace.profile,before.content.workspace.profile);for(const id of before.content.workspace.cvOrder)assert.deepEqual(after.content.workspace.cvsById[id],before.content.workspace.cvsById[id]);
  assert(after.content.revisions.some(r=>r.entityId===cvId&&r.cause==='import'&&r.retention==='pinned'));
  await f.repository.close();const reopened=await f.open();assert.deepEqual(await reopened.library.openCv(cvId),saved);assert.deepEqual((await reopened.repository.health()).integrity,['ok']);assert.equal((await reopened.repository.health()).foreignKeyViolations,0);
});
test('F6 Cancel, unsupported files, invalid input and missing review never mutate library or recovery',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),before=await f.library.snapshot();
  let view=await service.begin(ctx.newId(),xmlBytes({partialDate:'2024-02-30'}),'invalid-date.xml');const input=review(view);
  await assert.rejects(service.confirm(view.id,input));assert.deepEqual(await f.library.snapshot(),before);service.cancel(view.id);assert.deepEqual(await f.library.snapshot(),before);
  view=await service.begin(ctx.newId(),xmlBytes(),'review.xml');await assert.rejects(service.confirm(view.id,{...review(view),acknowledgeIssues:false}),/IMPORT_ISSUES_REQUIRE_REVIEW/);service.cancel(view.id);
  view=await service.begin(ctx.newId(),new TextEncoder().encode('not supported'),'invalid.pdf');assert.equal(view.code,'FILE_UNSUPPORTED');await assert.rejects(service.confirm(view.id,{} as ImportReviewInput),/IMPORT_CANDIDATE_REQUIRED/);service.cancel(view.id);assert.deepEqual(await f.library.snapshot(),before);
});
test('F6 explicit candidate selection is required for two different compatible attachments',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),before=await f.library.snapshot(),bytes=await syntheticPdf([{name:'first.xml',bytes:xmlBytes()},{name:'second.xml',bytes:xmlBytes({locale:'en'})}]);
  let view=await service.begin(ctx.newId(),bytes,'two.pdf');assert.equal(view.selectedKey,null);await assert.rejects(service.confirm(view.id,{} as ImportReviewInput),/IMPORT_CANDIDATE_REQUIRED/);assert.deepEqual(await f.library.snapshot(),before);
  view=service.select(view.id,view.candidates[1]!.key);assert.equal(view.draft!.documentLocale,'en');const {cvId}=await service.confirm(view.id,review(view)),cv=await f.library.openCv(cvId);assert.equal(cv.documentLocale,'en');assert.equal(cv.importRecords![0]!.candidate.selectionReason,'explicit');assert.equal(cv.importRecords![0]!.candidate.attachmentName,'second.xml');
});
test('F6 source/unmapped metadata persists in cvproj and is excluded from language provider plans and PDF payloads',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),view=await service.begin(ctx.newId(),xmlBytes({unknown:true}),'private-source.xml'),{cvId}=await service.confirm(view.id,review(view)),cv=await f.library.openCv(cvId),record=await f.library.snapshot();
  const projected=createExportProjection(cv,placement=>{const asset=record.content.assetsById[placement.assetId]!,bytes=record.content.blobs.get(asset.sha256)!;return {sha256:asset.sha256,mediaType:'image/png',width:asset.dimensions!.width,height:asset.dimensions!.height,dataBase64:Buffer.from(bytes).toString('base64')};});
  assert(!JSON.stringify(projected).includes('SYNTHETIC_UNMAPPED_PRIVATE'));assert(!JSON.stringify(projected).includes('private-source.xml'));
  const plan=buildLanguagePlan(cv,'en');assert(!JSON.stringify(plan).includes('SYNTHETIC_UNMAPPED_PRIVATE'));assert(!JSON.stringify(plan).includes('private-source.xml'));
  const portable=decodeCvproj(await f.library.exportCvproj(cvId));assert.equal(portable.snapshot.scope,'cv');if(portable.snapshot.scope!=='cv')throw new Error();assert.deepEqual(portable.snapshot.cv,cv);assert(portable.snapshot.assetsById[cv.importRecords![0]!.source.assetId!]);
  const {cvId:copyId}=await f.library.importCvproj(encodeCvproj(portable,ctx.now()),{mode:'copyCv'}),copy=await f.library.openCv(copyId!);assert.notEqual(copy.id,cv.id);assert.notEqual(copy.importRecords![0]!.id,cv.importRecords![0]!.id);assert.equal(copy.importRecords![0]!.source.assetId,cv.importRecords![0]!.source.assetId);
  const path=copy.importRecords![0]!.mappings.find(m=>m.targetPath[0]==='sectionsById')!.targetPath;assert(copy.sectionsById[path[1]!]!);
  const future=structuredClone(cv);future.importRecords![0]!.recordVersion=2 as 1;assert.throws(()=>validateCv(future));
});
test('F6 PDF projection recovers displayed sensitive variants without fabricating originals or private history',async t=>{
  const f=await libraryFixture(t),fixture=completeProjectFixture(),snapshot=projectForCv(fixture.snapshot,fixture.snapshot.scope==='workspace'?fixture.snapshot.workspace.cvOrder[0]!:'');if(snapshot.scope!=='cv')throw new Error();
  snapshot.cv.personalInformation.photo=null;const projection=createExportProjection(snapshot.cv),bytes=await syntheticPdf([{name:'own.bin',bytes:encodePdfAttachment(projection)}]),service=new StructuredImportService(f.library,port,ctx),view=await service.begin(ctx.newId(),bytes,'own.pdf');
  const {cvId}=await service.confirm(view.id,review(view)),cv=await f.library.openCv(cvId),projected=createExportProjection(cv);
  assert.deepEqual(projected.personal,projection.personal);assert.deepEqual(projected.sections,projection.sections);
  assert(!JSON.stringify(cv.sectionsById).includes('PRIVATE_OTHER_CV'));assert.deepEqual(cv.sensitiveTranslationMemory,{});
  const sensitive=Object.values(cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='certification')!;assert(sensitive.kind==='certification'&&sensitive.fields.title.class==='C');assert.equal(sensitive.fields.title.original,null);assert.equal(sensitive.fields.title.decision,'importedVisible');
  assert.equal((await f.library.listRevisions(cvId)).length,1);
});
test('F6 native cvproj imports an independent copy with hidden content/assets/history; workspace requires safe restore',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),bytes=await f.library.exportCvproj(f.cvId),before=await f.library.snapshot(),view=await service.begin(ctx.newId(),bytes,'native.cvproj'),{cvId}=await service.confirm(view.id,review(view)),cv=await f.library.openCv(cvId);
  assert.notEqual(cvId,f.cvId);assert.equal(Object.keys(cv.sectionsById).length,Object.keys(before.content.workspace.cvsById[f.cvId]!.sectionsById).length);assert(cv.importRecords![0]!.source.assetId===null);assert((await f.library.listRevisions(cvId)).length>1);assert.deepEqual((await f.library.snapshot()).content.workspace.cvsById[f.cvId],before.content.workspace.cvsById[f.cvId]);
  const workspace=await service.begin(ctx.newId(),await f.library.exportCvproj(),'workspace.bin'),state=await f.library.snapshot();assert(workspace.workspace);assert.equal(workspace.draft,null);
  await assert.rejects(service.confirmWorkspace(workspace.id,'emptyWorkspace'),/WORKSPACE_NOT_EMPTY/);await assert.rejects(service.confirmWorkspace(workspace.id,'replaceWorkspace'),/REPLACE_CONFIRMATION_REQUIRED/);assert.deepEqual(await f.library.snapshot(),state);
  const restored=await service.confirmWorkspace(workspace.id,'replaceWorkspace',true);assert(restored.backup);assert.deepEqual((await f.library.snapshot()).content.workspace,state.content.workspace);
});
test('F6 invalid asset references and tampered identities fail before any database mutation',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,port,ctx),view=await service.begin(ctx.newId(),xmlBytes(),'asset.xml'),before=await f.library.snapshot();
  let input=review(view);input.cv.personalInformation.photo!.assetId=ctx.newId();await assert.rejects(service.confirm(view.id,input),/IMPORT_ASSET_REFERENCE_INVALID/);assert.deepEqual(await f.library.snapshot(),before);
  input=review(view);input.cv.id=ctx.newId();await assert.rejects(service.confirm(view.id,input),/IMPORT_IDENTITY_CHANGED/);service.cancel(view.id);assert.deepEqual(await f.library.snapshot(),before);
});
test('F6 actual import worker can be cancelled while analyzing without creating a CV or draft',async t=>{
  const f=await libraryFixture(t),service=new StructuredImportService(f.library,new LocalStructuredImport(),ctx),before=await f.library.snapshot(),id=ctx.newId(),work=service.begin(id,xmlBytes(),'cancel.xml');
  service.cancel(id);await assert.rejects(work,/IMPORT_CANCELLED/);assert.equal(service.isOpen(),false);assert.deepEqual(await f.library.snapshot(),before);
});
test('F6 actual SQLite rollback after entities leaves no partial CV, source, image or revision',async t=>{
  const directory=await mkdtemp('/tmp/cvforge-f6-rollback-');let fail=false;
  const engine=await SqliteEngine.open(directory,{transactionProbe(stage){if(fail&&stage==='afterEntities')throw new Error('SYNTHETIC_TRANSACTION_FAILURE');}});
  t.after(async()=>{engine.close();await rm(directory,{recursive:true,force:true});});
  const repository={read:async()=>engine.read(),commit:async(...args:Parameters<typeof engine.commit>)=>engine.commit(...args),backup:()=>engine.backup(),health:async()=>engine.health(),close:async()=>{}};
  const library=new LibraryService(repository,ctx,cvprojCodec);await library.initialize();const service=new StructuredImportService(library,port,ctx),view=await service.begin(ctx.newId(),xmlBytes(),'rollback.xml'),before=await library.snapshot();
  fail=true;await assert.rejects(service.confirm(view.id,review(view)),/SYNTHETIC_TRANSACTION_FAILURE/);assert.deepEqual(await library.snapshot(),before);assert.equal((await repository.health()).counts.entities,0);assert.equal((await repository.health()).counts.assets,0);assert.equal((await repository.health()).foreignKeyViolations,0);
  fail=false;const {cvId}=await service.confirm(view.id,review(view));assert(await library.openCv(cvId));
});
test('F6 workspace restore into an empty library survives a new repository without merging a profile or CV',async t=>{
  const f=await libraryFixture(t,false),fixture=completeProjectFixture(),service=new StructuredImportService(f.library,port,ctx),view=await service.begin(ctx.newId(),encodeCvproj(fixture,fixture.ctx.now()),'workspace.cvproj');
  assert.equal((await f.library.listCvs()).length,0);await service.confirmWorkspace(view.id,'emptyWorkspace');await f.repository.close();const reopened=await f.open();assert.deepEqual((await reopened.library.snapshot()).content.workspace,fixture.snapshot.scope==='workspace'?fixture.snapshot.workspace:null);assert.equal((await reopened.repository.health()).foreignKeyViolations,0);
});
