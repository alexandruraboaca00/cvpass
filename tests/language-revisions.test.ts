import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approveSensitive, editSensitiveSource, keepOriginal, sensitiveReviewState, sensitiveFromVisible, resolveSensitive, checkpoint, restoreCv, createCvFromProfile, createExportProjection, createExportPayload, includeSection, includeEntry, validateCv, parse, SensitiveSchema, A, createSection } from '../src/domain/index.js';
import type { SensitiveField } from '../src/domain/index.js';
import { profileFixture, template, context } from './fixtures.js';
function sensitive(ctx=context()):SensitiveField{return parse(SensitiveSchema,{class:'C',id:ctx.newId(),original:{value:'Título ambiguo sintético',locale:'es',revision:1},context:{fieldKind:'qualification',organization:'Instituto Sintético'},outputLocale:'en',displayMode:'original',decision:'pending',approvalId:null,importedVisibleVariants:[]});}

test('sensitive review preserves originals and approved contextual translations in display order',()=>{
  const ctx=context(),source=sensitive(ctx);assert.equal(sensitiveReviewState(source,{}),'pending');
  assert.throws(()=>resolveSensitive(source,{}),/sensitive.pending/);
  assert.deepEqual(resolveSensitive(keepOriginal(source),{}),[{role:'original',value:source.original!.value,locale:'es'}]);
  const {field,approval}=approveSensitive(source,'Reviewed qualification','en',ctx,'translationAndOriginal');
  const memory={[approval.id]:approval};assert.equal(sensitiveReviewState(field,memory),'approved');
  assert.deepEqual(resolveSensitive(field,memory).map(v=>v.role),['translation','original']);assert.equal(source.approvalId,null);
  const changed=editSensitiveSource(field,'Nuevo título','es');assert.equal(sensitiveReviewState(changed,memory),'stale');assert.throws(()=>resolveSensitive(changed,memory),/sensitive.stale/);
  assert.equal(approval.source.value,source.original!.value);
  const contextChanged={...field,context:{fieldKind:'qualification',organization:'Otra institución'}};assert.equal(sensitiveReviewState(contextChanged,memory),'stale');
});
test('importing only visible translation never invents original or approval',()=>{
  const ctx=context();const f=sensitiveFromVisible([{role:'translation',locale:'en',value:'Visible qualification'}],{fieldKind:'qualification'},ctx);
  assert.equal(f.original,null);assert.equal(f.approvalId,null);assert.equal(sensitiveReviewState(f,{}),'imported');
  assert.equal(resolveSensitive(f,{})[0]!.value,'Visible qualification');assert.throws(()=>approveSensitive(f,'Invented','es',ctx),/sensitive.originalUnknown/);
  const both=sensitiveFromVisible([{role:'translation',locale:'en',value:'Visible'},{role:'original',locale:'es',value:'Original visible'}],{fieldKind:'qualification'},ctx);
  assert.equal(both.displayMode,'translationAndOriginal');assert.equal(both.original,null);assert.equal(resolveSensitive(both,{}).length,2);
});
test('pinned checkpoint is independent, restore creates another revision and foreign owner is rejected',()=>{
  const {profile,ctx}=profileFixture();const cv=createCvFromProfile(profile,{name:'Privado',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);
  const revision=checkpoint(cv,ctx);assert.equal(revision.retention,'pinned');assert.equal(revision.cause,'beforeTranslation');
  cv.personalInformation.displayName='Cambiado';cv.revision=2;cv.documentLocale='en';
  assert.notEqual(revision.snapshot.personalInformation.displayName,cv.personalInformation.displayName);
  const restored=restoreCv(cv,revision,ctx);assert.equal(restored.revision,3);assert.equal(restored.documentLocale,'es');assert.equal(cv.documentLocale,'en');
  assert.throws(()=>restoreCv({...cv,id:ctx.newId()},revision,ctx),/revision.wrongOwner/);
});
test('visible projection excludes hidden sections/entries and private data; project preserves them',()=>{
  const {profile,ctx}=profileFixture();const cv=createCvFromProfile(profile,{name:'PRIVATE_LIBRARY_NAME',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);
  const privateSection=cv.sectionOrder[1]!;const custom=cv.sectionsById[privateSection]!;custom.title=A('PRIVATE_HIDDEN_SECTION');
  const source=Object.values(cv.sectionsById[cv.sectionOrder[0]!]!.entriesById)[0]!;assert.equal(source.kind,'project');if(source.kind!=='project')throw new Error('fixture');
  const hidden={...structuredClone(source),id:ctx.newId(),fields:{...source.fields,title:A('PRIVATE_HIDDEN_ENTRY')}};
  const visibleSection=cv.sectionsById[cv.sectionOrder[0]!]!;visibleSection.entriesById[hidden.id]=hidden;visibleSection.entryOrder!.push(hidden.id);
  const s=sensitive(ctx);const approved=approveSensitive(s,'Visible approved','en',ctx);cv.documentTitle=approved.field;cv.sensitiveTranslationMemory[approved.approval.id]=approved.approval;
  cv.presentation.personalFieldVisibility.birthDate=true;cv.presentation.datePrecision='year';
  const hiddenCv=includeEntry(includeSection(cv,privateSection,false),visibleSection.id,hidden.id,false);
  const payload=createExportPayload(createExportProjection(hiddenCv));const json=JSON.stringify(payload);
  for(const secret of ['PRIVATE_LIBRARY_NAME','PRIVATE_HIDDEN_SECTION','PRIVATE_HIDDEN_ENTRY',s.original!.value,cv.id,profile.id,approved.approval.id,'profileEntryId','birthDate":{'])assert(!json.includes(secret),secret);
  assert(json.includes('Visible approved'));assert(json.includes('1990'));assert(!json.includes('"day":19'));assert(!json.includes('"month":7'));
  assert(JSON.stringify(hiddenCv).includes('PRIVATE_HIDDEN_ENTRY'));assert.equal(validateCv(hiddenCv).sectionsById[privateSection]!.included,false);
  cv.documentTitle={...approved.field,displayMode:'translationAndOriginal'};assert(JSON.stringify(createExportProjection(cv)).includes(s.original!.value));
});
test('materialization copies only approval memory for explicitly selected content',()=>{
 const {profile,ctx}=profileFixture();const selected=profile.sectionOrder[0]!,unselected=profile.sectionOrder[1]!;
 const a=approveSensitive(sensitive(ctx),'Selected','en',ctx),b=approveSensitive(editSensitiveSource(sensitive(ctx),'Titulación no seleccionada','es'),'Unselected','en',ctx);
 profile.sectionsById[selected]!.title=a.field;profile.sectionsById[unselected]!.title=b.field;
 profile.sensitiveTranslationMemory={[a.approval.id]:a.approval,[b.approval.id]:b.approval};
 const cv=createCvFromProfile(profile,{name:'CV',documentLocale:'en',template,sectionIds:[selected]},ctx);
 assert.equal(Object.keys(cv.sensitiveTranslationMemory).length,1);assert.equal(Object.values(cv.sensitiveTranslationMemory)[0]!.value,'Selected');
 const field=cv.sectionsById[cv.sectionOrder[0]!]!.title!;assert.equal(field.class,'C');if(field.class!=='C')throw new Error('fixture');assert.equal(sensitiveReviewState(field,cv.sensitiveTranslationMemory),'approved');
});
