import test from 'node:test';
import assert from 'node:assert/strict';
import {CoreEditorService} from '../src/application/editor.js';
import {ProfileEditorService} from '../src/application/profile-editor.js';
import {personalSelectionKeys,selectProfileContent} from '../src/application/profile-selection.js';
import type {ProfileSelection} from '../src/application/profile-selection.js';
import {entryIds,validateProfile} from '../src/domain/index.js';
import {libraryFixture,runtimeContext} from './library-helpers.js';
function selection(p:ReturnType<typeof validateProfile>):ProfileSelection{return {personalFields:[...personalSelectionKeys],contactIds:p.personalInformation.contacts.map(c=>c.id),addressIds:p.personalInformation.addresses.map(a=>a.id),photo:!!p.personalInformation.photo,sections:p.sectionOrder.map(id=>({sectionId:id,entryIds:entryIds(p.sectionsById[id]!)}))};}
test('F9 profile shares all eight content forms without CV properties; durable confirm/cancel and recovery',async t=>{
  const f=await libraryFixture(t),reader=new CoreEditorService(f.library,runtimeContext),catalog=f.fixture.snapshot.templates[0]!,editor=new ProfileEditorService(f.library,runtimeContext,e=>reader.photo(e),async()=>({template:catalog,resources:{}}));
  let p=(await editor.profileOpen()).profile;assert.equal('documentLocale'in p,false);assert.equal('presentation'in p,false);
  for(const s of Object.values(p.sectionsById)){assert.equal('included'in s,false);for(const e of Object.values(s.entriesById))assert.equal('included'in e,false);}
  let form=await editor.profileBegin(p.revision,{kind:'personal'},'es');form.entity.personalInformation.displayName='Profile cancelled';editor.profileStage(form);await editor.profileFlush();await editor.profileCancel();assert.deepEqual((await editor.profileOpen()).profile,p);assert.equal((await f.library.recoverableDrafts()).length,0);
  form=await editor.profileBegin(p.revision,{kind:'personal'},'en');form.entity.personalInformation.displayName='Profile confirmed';p=(await editor.profileConfirm(form)).profile;
  for(const sid of p.sectionOrder){const section=p.sectionsById[sid]!,target=section.kind==='skills'?{kind:'skills' as const,sectionId:sid}:entryIds(section).length?{kind:'entry' as const,sectionId:sid,entryId:entryIds(section)[0]!}:{kind:'order' as const,sectionId:sid};const form=await editor.profileBegin(p.revision,target,'es');p=(await editor.profileConfirm(form)).profile;}
  const before=p;form=await editor.profileBegin(p.revision,{kind:'personal'},'es');form.entity.personalInformation.displayName='Recover profile';editor.profileStage(form);await editor.profileFlush();await editor.finish();await f.repository.close();
  const next=await f.open(),nextReader=new CoreEditorService(next.library,runtimeContext),reopened=new ProfileEditorService(next.library,runtimeContext,e=>nextReader.photo(e),async()=>({template:catalog,resources:{}}));
  assert.deepEqual((await reopened.profileOpen()).profile,before);const recovered=await reopened.profileRecover(form.draftId);assert.equal(recovered.form.entity.personalInformation.displayName,'Recover profile');await reopened.profileCancel();assert.equal((await next.library.recoverableDrafts()).length,0);assert.deepEqual((await reopened.profileOpen()).profile,before);
});
test('F9 profile selection preserves exact fields, skills membership, independent identities and original provenance',async t=>{
  const f=await libraryFixture(t),profile=(await f.library.snapshot()).content.workspace.profile!,chosen=selection(profile),education=Object.values(profile.sectionsById).find(s=>s.kind==='education')!;
  chosen.personalFields=['displayName'];chosen.contactIds=[];chosen.addressIds=[];chosen.photo=false;chosen.sections=[{sectionId:education.id,entryIds:[entryIds(education)[0]!]}];
  const source=selectProfileContent(profile,chosen);assert.equal(source.personalInformation.givenName,null);assert.equal(source.personalInformation.contacts.length,0);assert.equal(source.personalInformation.photo,null);assert.equal(source.sectionOrder.length,1);
  const template=f.fixture.snapshot.templates[0]!,a=await f.library.createCv({name:'Selected A',documentLocale:'es',template,sectionIds:source.sectionOrder,contentSelection:chosen},profile.revision),b=await f.library.createCv({name:'Selected B',documentLocale:'en',template,sectionIds:source.sectionOrder,contentSelection:chosen},profile.revision);
  const ae=Object.values(Object.values(a.sectionsById)[0]!.entriesById)[0]!,be=Object.values(Object.values(b.sectionsById)[0]!.entriesById)[0]!;assert.notEqual(ae.id,be.id);assert.notEqual(ae.id,entryIds(education)[0]);assert.deepEqual(ae.sourceRef,{kind:'profile',profileId:profile.id,profileEntryId:entryIds(education)[0],profileRevision:profile.revision});
  assert.deepEqual((await f.library.snapshot()).content.workspace.profile,profile);assert.throws(()=>selectProfileContent(profile,{...chosen,sections:[{sectionId:education.id,entryIds:['00000000-0000-4000-8000-000000009999']}]}),/PROFILE_SELECTION_INVALID/);
  const skills=Object.values(profile.sectionsById).find(s=>s.kind==='skills')!;const keep=entryIds(skills).slice(0,1),subset=selectProfileContent(profile,{...chosen,sections:[{sectionId:skills.id,entryIds:keep}]});assert.deepEqual(entryIds(subset.sectionsById[skills.id]!),keep);
});
