import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { CoreEditorService } from '../src/application/editor.js';
import { editText, entryPath, newMvpEntry } from '../src/application/editor-model.js';
import type { EditorForm } from '../src/application/editor-model.js';
import { A, addSkill, approveSensitive, createExportProjection, editSensitiveSource, emptyPersonal, moveSkill,
  plainText, removeSkillGroup, reorderSkillGroups, resolveSensitive, sensitiveReviewState } from '../src/domain/index.js';
import type { CvDocument, CvEntry, CvSection, SectionKind } from '../src/domain/index.js';
import { libraryFixture, runtimeContext as ctx } from './library-helpers.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';
import { manualPlan } from './f5-helpers.js';

async function setup(t:TestContext){const f=await libraryFixture(t,false),editor=new CoreEditorService(f.library,ctx);await editor.start();const {cv}=await editor.create('CV sintético F5','Persona Sintética');return {...f,editor,cv};}
async function section(f:{editor:CoreEditorService},cv:CvDocument,kind:Exclude<SectionKind,'custom'>){const next=(await f.editor.addSection(cv.id,cv.revision,kind)).cv;return {cv:next,sectionId:next.sectionOrder.at(-1)!};}
function entry(form:EditorForm):CvEntry {if(form.target.kind!=='entry')throw new Error('target');return form.cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;}
function title(form:EditorForm,value:string):void{const e=entry(form);if('title' in e.fields)e.fields.title=editText(e.fields.title,value,form.cv.documentLocale,true)!;}
async function custom(editor:CoreEditorService,cv:CvDocument,name:string){const form=await editor.begin(cv.id,cv.revision,{kind:'newCustomSection'});if(form.target.kind!=='section')throw new Error('target');form.cv.sectionsById[form.target.sectionId]!.title=A(name);const result=(await editor.confirm(form)).cv;return {cv:result,sectionId:form.target.sectionId};}
function skill(label:string,groupId:string|null):Extract<CvEntry,{kind:'skill'}>{const e=newMvpEntry('skill',ctx,'es');if(e.kind!=='skill')throw new Error('kind');e.fields.label={class:'B',value:label,locale:'und',protection:'term'};e.fields.groupId=groupId;return e;}

test('F5 two skill groups, moves, ungrouping, group deletion and order persist exactly after closing SQLite',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'skills');let form=await f.editor.begin(cv.id,cv.revision,{kind:'skills',sectionId});let s=form.cv.sectionsById[sectionId]!;
  const a=ctx.newId(),b=ctx.newId();s.groupsById[a]={id:a,name:A('Herramientas'),skillIds:[]};s.groupsById[b]={id:b,name:A('Prácticas'),skillIds:[]};s.groupOrder=[a,b];
  const x=skill('Python',a),y=skill('TypeScript',a),z=skill('Documentación',null);for(const e of [x,y,z])s=addSkill(s,e);form.cv.sectionsById[sectionId]=s;cv=(await f.editor.confirm(form)).cv;
  form=await f.editor.begin(cv.id,cv.revision,{kind:'skills',sectionId});s=moveSkill(form.cv.sectionsById[sectionId]!,x.id,b,0);s=moveSkill(s,y.id,null,0);s=reorderSkillGroups(s,[b,a]);form.cv.sectionsById[sectionId]=s;cv=(await f.editor.confirm(form)).cv;
  assert.equal(Object.keys(cv.sectionsById[sectionId]!.entriesById).length,3);assert.deepEqual(cv.sectionsById[sectionId]!.ungroupedSkillIds,[y.id,z.id]);
  const ordered=structuredClone(cv);await f.editor.close();const reopened=await f.open(),editor=new CoreEditorService(reopened.library,ctx);assert.deepEqual(await reopened.library.openCv(cv.id),ordered);
  form=await editor.begin(cv.id,cv.revision,{kind:'skills',sectionId});form.cv.sectionsById[sectionId]=removeSkillGroup(form.cv.sectionsById[sectionId]!,b);cv=(await editor.confirm(form)).cv;
  assert.deepEqual(cv.sectionsById[sectionId]!.ungroupedSkillIds,[y.id,z.id,x.id]);assert.equal(Object.keys(cv.sectionsById[sectionId]!.entriesById).length,3);assert.equal((await reopened.library.health()).foreignKeyViolations,0);
});
test('F5 child confirmation edits only the parent skill draft; cancelling parent discards groups and skills with no recovery',async t=>{
  const f=await setup(t),{cv,sectionId}=await section(f,f.cv,'skills'),form=await f.editor.begin(cv.id,cv.revision,{kind:'skills',sectionId});
  // Equivalent to a confirmed child modal: merge its copy into the parent, never confirmEntity.
  const child: CvSection=structuredClone(form.cv.sectionsById[sectionId]!),id=ctx.newId();child.groupsById[id]={id,name:A('Grupo del hijo'),skillIds:[]};child.groupOrder.push(id);form.cv.sectionsById[sectionId]=addSkill(child,skill('Habilidad del hijo',id));
  f.editor.stage(form);await f.editor.flush();assert.deepEqual(await f.library.openCv(cv.id),cv);
  assert.deepEqual((await f.editor.cancel()).cv,cv);assert.equal((await f.library.recoverableDrafts()).length,0);
  await f.editor.close();const reopened=await f.open();assert.deepEqual(await reopened.library.openCv(cv.id),cv);assert.equal((await reopened.library.recoverableDrafts()).length,0);
});
test('F5 multiple native languages have no CEFR; listening B1 only and five independent dimensions survive reopening exactly',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'languages');
  for(const code of ['es','ro']){const form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId,entryKind:'nativeLanguage'}),e=entry(form);if(e.kind!=='nativeLanguage')throw new Error('kind');e.fields.language.code=code;cv=(await f.editor.confirm(form)).cv;}
  const listening={listening:'B1' as const,reading:null,spokenInteraction:null,spokenProduction:null,writing:null};
  for(const proficiency of [listening,{listening:'A1' as const,reading:'A2' as const,spokenInteraction:'B1' as const,spokenProduction:'C1' as const,writing:'C2' as const}]){
    const form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId,entryKind:'foreignLanguage'}),e=entry(form);if(e.kind!=='foreignLanguage')throw new Error('kind');e.fields.language={code:'en',name:'Inglés sintético'};e.fields.proficiency=proficiency;cv=(await f.editor.confirm(form)).cv;
  }
  await f.editor.close();const reopened=await f.open(),next=await reopened.library.openCv(cv.id);assert.deepEqual(next,cv);const s=next.sectionsById[sectionId]!,entries=s.entryOrder!.map(id=>s.entriesById[id]!);
  const natives=entries.filter(e=>e.kind==='nativeLanguage');assert.equal(natives.length,2);for(const e of natives){assert(!('proficiency' in e.fields));assert(!JSON.stringify(e).includes('C2'));}
  const foreign=entries.filter(e=>e.kind==='foreignLanguage');assert.deepEqual(foreign[0]!.fields.proficiency,listening);assert.deepEqual(Object.keys(foreign[1]!.fields.proficiency),['listening','reading','spokenInteraction','spokenProduction','writing']);
});
test('F5 several certifications preserve original, approved sensitive translation and stale approval after source changes',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'certifications');
  for(const label of ['Curso Superior Sintético','Otra certificación sintética']){const form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});title(form,label);const e=entry(form);if(e.kind!=='certification'||e.fields.title.class!=='C')throw new Error('kind');
    const approved=approveSensitive(e.fields.title,'Reviewed synthetic certificate','en',ctx,'translationAndOriginal');e.fields.title=approved.field;form.cv.sensitiveTranslationMemory[approved.approval.id]=approved.approval;e.fields.issuer={class:'B',value:'Instituto Sintético',locale:'es',protection:'organization'};e.fields.learningMode='Presencial';form.rawDates[entryPath(sectionId,e.id)+'.fields.issued']='2024-02';cv=(await f.editor.confirm(form)).cv;}
  const id=cv.sectionsById[sectionId]!.entryOrder![0]!,form=await f.editor.begin(cv.id,cv.revision,{kind:'entry',sectionId,entryId:id}),e=entry(form);if(e.kind!=='certification'||e.fields.title.class!=='C')throw new Error('kind');const old=e.fields.title.approvalId!;
  e.fields.title=editSensitiveSource(e.fields.title,'Curso Superior Sintético actualizado','es');cv=(await f.editor.confirm(form)).cv;await f.editor.close();const reopened=await f.open(),next=await reopened.library.openCv(cv.id),stored=next.sectionsById[sectionId]!.entriesById[id]!;
  if(stored.kind!=='certification'||stored.fields.title.class!=='C')throw new Error('kind');assert.equal(stored.fields.title.original!.value,'Curso Superior Sintético actualizado');assert.equal(sensitiveReviewState(stored.fields.title,next.sensitiveTranslationMemory),'stale');assert.equal(next.sensitiveTranslationMemory[old]!.value,'Reviewed synthetic certificate');assert.deepEqual(next,cv);
});
test('F5 projects and two custom sections have independent IDs/orders, ongoing, rich text and URLs; hide preserves content',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'projects');const sections=[sectionId];
  for(const name of ['Hackathons','Investigación sintética']){const made=await custom(f.editor,cv,name);cv=made.cv;sections.push(made.sectionId);}
  for(const id of sections)for(const label of ['Entrada A','Entrada B']){const form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId:id});title(form,label);const e=entry(form);if(e.kind!=='project'&&e.kind!=='custom')throw new Error('kind');e.fields.period.ongoing=true;form.rawDates[entryPath(id,e.id)+'.fields.period.start']='2020';e.fields.links=[{id:ctx.newId(),label:'Referencia',url:'https://example.test/project'}];e.fields.description={class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Descripción sintética',marks:[{kind:'bold'}]}]}]},locale:'es'},revision:1,protectedSpans:[]};cv=(await f.editor.confirm(form)).cv;}
  const hideId=cv.sectionsById[sections[1]!]!.entryOrder![0]!,before=structuredClone(cv.sectionsById[sections[1]!]!.entriesById[hideId]);cv=(await f.editor.visibility(cv.id,cv.revision,sections[1]!,hideId,false)).cv;assert.deepEqual(cv.sectionsById[sections[1]!]!.entriesById[hideId],{...before,included:false});
  const order=await f.editor.begin(cv.id,cv.revision,{kind:'order',sectionId:sections[2]!});order.cv.sectionsById[sections[2]!]!.entryOrder!.reverse();cv=(await f.editor.confirm(order)).cv;
  await f.editor.close();const reopened=await f.open();assert.deepEqual(await reopened.library.openCv(cv.id),cv);assert.equal(new Set(sections.flatMap(id=>cv.sectionsById[id]!.entryOrder!)).size,6);assert.notDeepEqual(cv.sectionsById[sections[1]!]!.entryOrder,cv.sectionsById[sections[2]!]!.entryOrder);
  const portable=cvprojCodec.decode(await reopened.library.exportCvproj(cv.id));if(portable.snapshot.scope!=='cv')throw new Error('scope');assert.deepEqual(portable.snapshot.cv,cv);
});
test('F5 invalid certification dates and project periods remain raw, cancel does not create a record; invalid URLs block confirmation',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'certifications');let form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});title(form,'Certificación sintética');const e=entry(form),path=entryPath(sectionId,e.id)+'.fields.issued';form.rawDates[path]='2025-02-29';
  await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);assert.equal(((await f.library.recoverableDrafts())[0]!.draft.values as EditorForm).rawDates[path],'2025-02-29');await f.editor.cancel();assert.deepEqual(await f.library.openCv(cv.id),cv);
  ({cv,sectionId}=await section(f,cv,'projects'));form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});title(form,'Proyecto sintético');const p=entry(form);if(p.kind!=='project')throw new Error('kind');p.fields.links=[{id:ctx.newId(),label:null,url:'javascript:invalid'}];await assert.rejects(f.editor.confirm(form),/EDITOR_VALIDATION/);p.fields.links[0]!.url='https://example.test';await f.editor.confirm(form);
});
test('F5 UI locale and document locale are independent, including while editing; preference persists on reopening',async t=>{
  const f=await setup(t),before=structuredClone(f.cv);await f.editor.setUiLocale('en');assert.equal((await f.editor.list()).uiLocale,'en');assert.deepEqual(await f.library.openCv(before.id),before);
  let form=await f.editor.begin(before.id,before.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);let cv=(await f.editor.confirm(form)).cv;
  await f.editor.setUiLocale('es');assert.equal((await f.editor.list()).uiLocale,'es');assert.equal((await f.editor.open(cv.id)).cv.documentLocale,'en');
  form=await f.editor.begin(cv.id,cv.revision,{kind:'personal'});form.cv.personalInformation.displayName='Borrador sintético durante cambio de interfaz';f.editor.stage(form);await f.editor.setUiLocale('en');
  assert.equal(((await f.library.recoverableDrafts())[0]!.draft.values as EditorForm).cv.personalInformation.displayName,form.cv.personalInformation.displayName);await f.editor.cancel();assert.deepEqual(await f.library.openCv(cv.id),cv);
  await f.editor.close();const reopened=await f.open(),editor=new CoreEditorService(reopened.library,ctx);assert.equal((await editor.start()).uiLocale,'en');assert.deepEqual((await editor.open(cv.id)).cv,cv);
});
test('F5 cancelling language plan leaves the entire CV, locale and history intact and removes recovery',async t=>{
  const f=await setup(t),before=await f.library.listRevisions(f.cv.id),form=await f.editor.begin(f.cv.id,f.cv.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);f.editor.stage(form);await f.editor.flush();await f.editor.cancel();
  assert.deepEqual(await f.library.openCv(f.cv.id),f.cv);assert.deepEqual(await f.library.listRevisions(f.cv.id),before);assert.equal((await f.library.recoverableDrafts()).length,0);
});
test('F5 confirming language change atomically pins the prior Spanish state and survives actual repository reopening and cvproj',async t=>{
  const f=await libraryFixture(t),editor=new CoreEditorService(f.library,ctx);await editor.start();const before=await f.library.openCv(f.cvId),other=structuredClone((await f.library.snapshot()).content.workspace),form=await editor.begin(before.id,before.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);
  const cv=(await editor.confirm(form)).cv,revisions=await f.library.listRevisions(cv.id),checkpoint=revisions.find(r=>r.cause==='beforeTranslation'&&r.number===before.revision)!;
  assert.equal(checkpoint.retention,'pinned');assert.deepEqual(checkpoint.snapshot,before);assert.equal(cv.revision,before.revision+1);assert.equal(cv.documentLocale,'en');assert.equal((await f.library.recoverableDrafts()).length,0);
  const after=(await f.library.snapshot()).content.workspace;assert.deepEqual(after.profile,other.profile);assert.deepEqual(after.cvsById[other.cvOrder[1]!],other.cvsById[other.cvOrder[1]!]);
  const payload=cvprojCodec.decode(await f.library.exportCvproj(cv.id));if(payload.snapshot.scope!=='cv')throw new Error('scope');assert(payload.snapshot.revisions.some(r=>r.id===checkpoint.id));assert.deepEqual(payload.snapshot.cv,cv);
  await editor.close();const reopened=await f.open(),next=new CoreEditorService(reopened.library,ctx);assert.deepEqual((await next.open(cv.id)).cv,cv);assert.deepEqual((await reopened.library.health()).integrity,['ok']);
  const restored=(await next.restore(cv.id,cv.revision,checkpoint.id)).cv;assert.equal(restored.documentLocale,'es');assert.equal(restored.revision,cv.revision+1);assert.deepEqual(restored.sectionsById,before.sectionsById);assert((await reopened.library.listRevisions(cv.id)).some(r=>r.id===checkpoint.id));
});
test('F5 duplicate before translating keeps Spanish independent and approved variants can be reused again after returning to Spanish',async t=>{
  const f=await libraryFixture(t),editor=new CoreEditorService(f.library,ctx),source=await f.library.openCv(f.cvId),copy=(await editor.duplicate(source.id,source.revision,'English synthetic copy')).cv;
  let form=await editor.begin(copy.id,copy.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);let cv=(await editor.confirm(form)).cv;
  assert.deepEqual(await f.library.openCv(source.id),source);form=await editor.begin(cv.id,cv.revision,{kind:'language',targetLocale:'es'});form.languagePlan=manualPlan(form.languagePlan!);cv=(await editor.confirm(form)).cv;
  form=await editor.begin(cv.id,cv.revision,{kind:'language',targetLocale:'en'});assert(form.languagePlan!.fields.some(i=>i.class==='C'&&i.status==='reused'));await editor.cancel();
});
test('F5 changed base and out-of-scope language/approval edits cannot partially apply or create a checkpoint',async t=>{
  const f=await setup(t),form=await f.editor.begin(f.cv.id,f.cv.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);
  const forged=structuredClone(form);forged.cv.documentLocale='en';assert.throws(()=>f.editor.stage(forged),/EDITOR_SCOPE_CHANGED/);
  const current=await f.library.renameCv(f.cv.id,'Concurrent synthetic change',f.cv.revision);await assert.rejects(f.editor.confirm(form),/REVISION_CONFLICT/);assert.deepEqual(await f.library.openCv(f.cv.id),current);assert(!(await f.library.listRevisions(f.cv.id)).some(r=>r.cause==='beforeTranslation'));await f.editor.cancel();
});
test('F5 interrupted language review is recoverable but never applied automatically; explicit cancel removes it',async t=>{
  const f=await setup(t),form=await f.editor.begin(f.cv.id,f.cv.revision,{kind:'language',targetLocale:'en'});form.languagePlan=manualPlan(form.languagePlan!);f.editor.stage(form);await f.editor.close();
  const reopened=await f.open(),editor=new CoreEditorService(reopened.library,ctx),view=await editor.start();assert.equal(view.recovery.length,1);assert.deepEqual(await reopened.library.openCv(f.cv.id),f.cv);const recovered=await editor.recover(view.recovery[0]!.id);assert.deepEqual(recovered.form.languagePlan,form.languagePlan);await editor.cancel();assert.equal((await editor.list()).recovery.length,0);
});
test('F5 upgrading editor capabilities preserves version 1 for history and portable snapshots',async t=>{
  const f=await libraryFixture(t,false);await f.library.createProfile(emptyPersonal('Persona Sintética'));const profile=(await f.library.snapshot()).content.workspace.profile!;
  let cv=await f.library.createCv({name:'Old editor synthetic',documentLocale:'es',sectionIds:[],template:{id:'cvforge-core',version:1,rendererContractVersion:1,layout:'singleColumn',capabilities:['education','work'],resourceRefs:[]}},profile.revision);
  const editor=new CoreEditorService(f.library,ctx);cv=(await editor.addSection(cv.id,cv.revision,'skills')).cv;assert.equal(cv.presentation.templateRef.version,2);
  const portable=cvprojCodec.decode(await f.library.exportCvproj(cv.id));if(portable.snapshot.scope!=='cv')throw new Error('scope');assert.deepEqual(portable.snapshot.templates.map(t=>t.version).sort(),[1,2]);assert.equal(portable.snapshot.revisions[0]!.snapshot.kind,'cv');
});
test('F5 sensitive display selection never leaks an unshown original or approval memory into PDF projection',async t=>{
  const f=await setup(t);let {cv,sectionId}=await section(f,f.cv,'certifications'),form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});title(form,'PRIVATE_SYNTHETIC_ORIGINAL');const e=entry(form);if(e.kind!=='certification'||e.fields.title.class!=='C')throw new Error('kind');const approved=approveSensitive(e.fields.title,'Visible reviewed certificate','en',ctx,'translation');e.fields.title=approved.field;form.cv.sensitiveTranslationMemory[approved.approval.id]=approved.approval;cv=(await f.editor.confirm(form)).cv;
  const projection=JSON.stringify(createExportProjection(cv));assert(projection.includes('Visible reviewed certificate'));assert(!projection.includes('PRIVATE_SYNTHETIC_ORIGINAL'));assert(!projection.includes(approved.approval.id));assert(!projection.includes('sensitiveTranslationMemory'));assert.equal(resolveSensitive(approved.field,cv.sensitiveTranslationMemory).length,1);
});
test('F5 review approved inside a parent draft survives subsequent source/context edits as stale without deletion',async t=>{
  const f=await setup(t),{cv,sectionId}=await section(f,f.cv,'certifications'),form=await f.editor.begin(cv.id,cv.revision,{kind:'newEntry',sectionId});title(form,'Curso sintético');const e=entry(form);if(e.kind!=='certification'||e.fields.title.class!=='C')throw new Error('kind');
  const reviewed=approveSensitive(e.fields.title,'Reviewed course','en',ctx);e.fields.title=reviewed.field;form.cv.sensitiveTranslationMemory[reviewed.approval.id]=reviewed.approval;f.editor.stage(form);
  e.fields.title=editSensitiveSource(e.fields.title,'Curso sintético actualizado','es',{fieldKind:'certification',organization:'Nuevo instituto sintético'});const next=(await f.editor.confirm(form)).cv;
  assert.deepEqual(next.sensitiveTranslationMemory[reviewed.approval.id],reviewed.approval);const saved=next.sectionsById[sectionId]!.entriesById[e.id]!;if(saved.kind!=='certification'||saved.fields.title.class!=='C')throw new Error('kind');assert.equal(sensitiveReviewState(saved.fields.title,next.sensitiveTranslationMemory),'stale');
});
