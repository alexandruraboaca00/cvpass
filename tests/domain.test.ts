import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCvFromProfile, includeEntry, includeSection, reorderSections, validateProfile, validateCv, parse, PartialDateSchema, PeriodSchema, periodOrder, NarrativeSchema, Locale, RichTextSchema } from '../src/domain/index.js';
import { profileFixture, template } from './fixtures.js';

test('creates a profile and materializes a CV with independent IDs and nested data',()=>{
  const {profile,ctx}=profileFixture();const saved=structuredClone(profile);
  const cv=createCvFromProfile(profile,{name:'CV privado',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);
  assert.notEqual(cv.id,profile.id);assert.notEqual(cv.sectionOrder[0],profile.sectionOrder[0]);
  profile.personalInformation.displayName='Otro nombre';profile.personalInformation.contacts[0]!.label='Privado';
  assert.equal(cv.personalInformation.displayName,saved.personalInformation.displayName);assert.equal(cv.personalInformation.contacts[0]!.label,null);
  const cvContact=cv.personalInformation.contacts[0]!,profileContact=profile.personalInformation.contacts[0]!;
  assert.equal(cvContact.kind,'email');assert.equal(profileContact.kind,'email');
  if(cvContact.kind!=='email'||profileContact.kind!=='email')throw new Error('Invalid fixture');
  cvContact.value='cv@example.org';assert.equal(profileContact.value,'synthetic@example.org');
  const entry=Object.values(cv.sectionsById[cv.sectionOrder[0]!]!.entriesById)[0]!;
  assert.equal(entry.sourceRef?.profileEntryId,Object.keys(saved.sectionsById[saved.sectionOrder[0]!]!.entriesById)[0]);
  assert.deepEqual(validateCv(cv).personalInformation.contacts[0],cvContact);
});
test('selection, section ordering and reversible visibility preserve content',()=>{
  const {profile,ctx}=profileFixture();const cv=createCvFromProfile(profile,{name:'CV',documentLocale:'en',template,sectionIds:profile.sectionOrder},ctx);
  assert.deepEqual(reorderSections(cv,[...cv.sectionOrder].reverse()).sectionOrder,[...cv.sectionOrder].reverse());
  const id=cv.sectionOrder[0]!,entryId=Object.keys(cv.sectionsById[id]!.entriesById)[0]!;
  const hidden=includeSection(cv,id,false);assert.deepEqual(hidden.sectionsById[id]!.entriesById,cv.sectionsById[id]!.entriesById);assert(includeSection(hidden,id,true).sectionsById[id]!.included);
  assert(!includeEntry(cv,id,entryId,false).sectionsById[id]!.entriesById[entryId]!.included);
  assert.throws(()=>reorderSections(cv,[id,id]),/order.notPermutation/);
  assert.throws(()=>createCvFromProfile(profile,{name:'CV',documentLocale:'es',template,sectionIds:[ctx.newId()]},ctx),/selection.invalid/);
});
test('rejects unknown fields, duplicate IDs, wrong associations and blank required data',()=>{
  const {profile}=profileFixture();assert.throws(()=>validateProfile({...profile,cache:'forbidden'}));
  const id=profile.sectionOrder[0]!,e=Object.values(profile.sectionsById[id]!.entriesById)[0]!;
  e.id=id;profile.sectionsById[id]!.entriesById={[id]:e};profile.sectionsById[id]!.entryOrder=[id];assert.throws(()=>validateProfile(profile),/id.duplicate/);
  const f=profileFixture().profile;f.sectionsById[f.sectionOrder[0]!]!.kind='work';assert.throws(()=>validateProfile(f),/entry.wrongSection/);
  assert.throws(()=>validateProfile({...f,personalInformation:{...f.personalInformation,displayName:'   '}}));
});
test('partial dates, leap days, end-only and ongoing periods never invent precision',()=>{
  for(const d of [{precision:'year',year:2020},{precision:'month',year:2020,month:2},{precision:'day',year:2020,month:2,day:29}])assert.deepEqual(parse(PartialDateSchema,d),d);
  for(const d of [{precision:'day',year:1900,month:2,day:29},{precision:'month',year:2020,month:13},{precision:'year',year:2020,day:1}])assert.throws(()=>parse(PartialDateSchema,d));
  const endOnly={start:null,end:{precision:'year',year:2020},ongoing:false};assert.deepEqual(parse(PeriodSchema,endOnly),endOnly);
  assert.equal(periodOrder({start:{precision:'year',year:2020},end:{precision:'month',year:2020,month:2},ongoing:false}),'ambiguous');
  assert.throws(()=>parse(PeriodSchema,{start:{precision:'year',year:2022},end:{precision:'year',year:2021},ongoing:false}),/period.inverted/);
  assert.throws(()=>parse(PeriodSchema,{start:null,end:{precision:'year',year:2020},ongoing:true}),/period.ongoingWithEnd/);
});
test('linguistic fields keep one active narrative and validate locales, spans and safe rich text',()=>{
  assert.throws(()=>parse(Locale,'not_a_locale'));assert.equal(parse(Locale,'ro-RO'),'ro-RO');
  assert.throws(()=>parse(NarrativeSchema,{class:'A',current:{value:'Hola',locale:'es'},revision:1,protectedSpans:[],translations:{en:'Hello'}}));
  assert.throws(()=>parse(NarrativeSchema,{class:'A',current:{value:'Hola',locale:'es'},revision:1,protectedSpans:[{id:profileFixture().ctx.newId(),start:0,end:4,value:'Otro',entity:'term'}]}));
  assert.throws(()=>parse(RichTextSchema,{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'X',marks:[{kind:'link',href:'javascript:alert(1)'}]}]}]}));
});
