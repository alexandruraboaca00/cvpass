import { test } from 'node:test';
import assert from 'node:assert/strict';
import { A, B, addSkill, applyLanguagePlan, buildLanguagePlan, classifyText, createCvFromProfile, createSection,
  editSensitiveSource, moveSkill, plainText, removeSkillGroup, reorderSkillGroups, reorderSkills, resolveSensitive,
  richText, sensitiveReviewState, validateCv, validateLanguagePlan } from '../src/domain/index.js';
import { protectNarrativeTerms, sensitiveFromVisible } from '../src/domain/index.js';
import type { CvDocument, CvEntry, DomainContext, LanguagePlan, SensitivePlanItem } from '../src/domain/index.js';
import { proposeLanguagePlan } from '../src/application/translation-provider.js';
import { completeProjectFixture, profileFixture, template } from './fixtures.js';
import { manualPlan } from './f5-helpers.js';
function fixture(){const f=profileFixture();return {...f,cv:createCvFromProfile(f.profile,{name:'Synthetic',documentLocale:'es',template,sectionIds:f.profile.sectionOrder},f.ctx)};}
function sensitive(plan:LanguagePlan):SensitivePlanItem {return plan.fields.find((f):f is SensitivePlanItem=>f.class==='C')!;}
function full(){const f=completeProjectFixture();if(f.snapshot.scope!=='workspace')throw new Error('scope');return {...f,cv:f.snapshot.workspace.cvsById[f.snapshot.workspace.cvOrder[0]!]!};}
function addFreeSkill(cv:CvDocument,sectionId:string,ctx:DomainContext,label:string,groupId:string|null=null):string {
  const id=ctx.newId(),entry:Extract<CvEntry,{kind:'skill'}>={id,createdAt:ctx.now(),updatedAt:ctx.now(),sourceRef:null,included:true,kind:'skill',fields:{label:B(label),groupId,catalog:null}};
  cv.sectionsById[sectionId]=addSkill(cv.sectionsById[sectionId]!,entry);return id;
}
test('F5 free skills, two groups and stable orders have a single membership per ID',()=>{
  const {cv,ctx}=fixture(),section={...createSection('skills',ctx),entriesById:{},included:true};cv.sectionsById[section.id]=section;cv.sectionOrder.push(section.id);
  const a=ctx.newId(),b=ctx.newId();section.groupsById[a]={id:a,name:A('Grupo A'),skillIds:[]};section.groupsById[b]={id:b,name:A('Grupo B'),skillIds:[]};section.groupOrder=[a,b];
  const x=addFreeSkill(cv,section.id,ctx,'TypeScript',a),y=addFreeSkill(cv,section.id,ctx,'Python',a),z=addFreeSkill(cv,section.id,ctx,'SQLite');
  cv.sectionsById[section.id]=moveSkill(cv.sectionsById[section.id]!,x,b,0);
  assert.deepEqual(cv.sectionsById[section.id]!.groupsById[a]!.skillIds,[y]);assert.deepEqual(cv.sectionsById[section.id]!.groupsById[b]!.skillIds,[x]);
  cv.sectionsById[section.id]=moveSkill(cv.sectionsById[section.id]!,x,null,0);
  assert.deepEqual(cv.sectionsById[section.id]!.ungroupedSkillIds,[x,z]);assert.equal(Object.keys(cv.sectionsById[section.id]!.entriesById).length,3);
  cv.sectionsById[section.id]=reorderSkillGroups(cv.sectionsById[section.id]!,[b,a]);
  cv.sectionsById[section.id]=reorderSkills(cv.sectionsById[section.id]!,null,[z,x]);validateCv(cv);
  assert.deepEqual(cv.sectionsById[section.id]!.groupOrder,[b,a]);
});
test('F5 deleting a skill group appends its skills ungrouped in relative order and leaves other groups intact',()=>{
  const {cv,ctx}=fixture(),s={...createSection('skills',ctx),entriesById:{},included:true};cv.sectionsById[s.id]=s;cv.sectionOrder.push(s.id);
  const g=ctx.newId();s.groupsById[g]={id:g,name:A('Grupo'),skillIds:[]};s.groupOrder=[g];
  const a=addFreeSkill(cv,s.id,ctx,'A',g),b=addFreeSkill(cv,s.id,ctx,'B',g),c=addFreeSkill(cv,s.id,ctx,'C');
  const before=structuredClone(cv.sectionsById[s.id]!);cv.sectionsById[s.id]=removeSkillGroup(before,g);validateCv(cv);
  assert.deepEqual(cv.sectionsById[s.id]!.ungroupedSkillIds,[c,a,b]);assert.deepEqual(before.groupsById[g]!.skillIds,[a,b]);
  for(const e of Object.values(cv.sectionsById[s.id]!.entriesById)){assert.equal(e.kind,'skill');if(e.kind==='skill')assert.equal(e.fields.groupId,null);}
});
test('F5 skill operations reject unknown references, duplicate lists and invalid positions without mutation',()=>{
  const {cv,ctx}=fixture(),s={...createSection('skills',ctx),entriesById:{},included:true};cv.sectionsById[s.id]=s;cv.sectionOrder.push(s.id);
  const a=addFreeSkill(cv,s.id,ctx,'A'),before=structuredClone(cv.sectionsById[s.id]!);
  assert.throws(()=>moveSkill(before,a,ctx.newId(),0));assert.throws(()=>moveSkill(before,a,null,2));assert.throws(()=>reorderSkills(before,null,[a,a]));assert.throws(()=>removeSkillGroup(before,ctx.newId()));
  assert.deepEqual(cv.sectionsById[s.id],before);
});
test('F5 ES to EN plan classifies A/B/C, leaves official names, contacts and URLs unchanged',()=>{
  const {cv,ctx}=full();cv.personalInformation.photo=null;
  cv.personalInformation.headline=B('Python','term');cv.personalInformation.about={class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Trabajo con Python en Instituto Sintético. https://example.test',marks:[]}]}]},locale:'es'},revision:1,protectedSpans:[]};
  const before=structuredClone(cv),plan=buildLanguagePlan(cv,'en');
  assert(plan.preserved.some(p=>p.value==='Instituto Sintético'));assert(plan.preserved.some(p=>p.value==='Compañía Sintética'));
  const next=applyLanguagePlan(cv,manualPlan(plan),ctx);assert.equal(next.documentLocale,'en');
  assert.equal(next.personalInformation.displayName,before.personalInformation.displayName);assert.deepEqual(next.personalInformation.contacts,before.personalInformation.contacts);
  assert.deepEqual(next.personalInformation.headline,before.personalInformation.headline);
  assert(richText(next.personalInformation.about!.current.value).includes('Python'));assert(richText(next.personalInformation.about!.current.value).includes('Instituto Sintético'));assert(richText(next.personalInformation.about!.current.value).includes('https://example.test'));
  for(const id of cv.sectionOrder){const s=cv.sectionsById[id]!;for(const e of Object.values(s.entriesById)){const n=next.sectionsById[id]!.entriesById[e.id]!;if(e.kind==='education'&&n.kind==='education')assert.deepEqual(n.fields.organization,e.fields.organization);if(e.kind==='work'&&n.kind==='work')assert.deepEqual(n.fields.employer,e.fields.employer);}}
  assert.deepEqual(cv,before);
});
test('F5 reviewed sensitive variants are reused, preserve original, and support original/translation/both',()=>{
  const {cv,ctx}=full(),plan=manualPlan(buildLanguagePlan(cv,'en')),item=sensitive(plan);assert.equal(item.status,'reused');assert.equal(item.decision,'reuse');
  for(const mode of ['original','translation','translationAndOriginal'] as const){const p=structuredClone(plan),c=sensitive(p);c.mode=mode;c.decision=mode==='original'?'keepOriginal':'reuse';
    const next=applyLanguagePlan(cv,p,ctx),s=next.sectionsById[c.path[1]!]!.entriesById[c.path[3]!]!;if(s.kind!=='education')throw new Error('fixture');
    const result=resolveSensitive(s.fields.title,next.sensitiveTranslationMemory);assert.deepEqual(s.fields.title.original,item.source.original);
    assert.deepEqual(result.map(v=>v.role),mode==='original'?['original']:mode==='translation'?['translation']:['translation','original']);
    assert.deepEqual(next.sensitiveTranslationMemory,cv.sensitiveTranslationMemory);
  }
});
test('F5 changing an original flags its retained approval stale; new review approves without erasing the old one',()=>{
  const {cv,ctx}=full(),education=Object.values(cv.sectionsById).find(s=>s.kind==='education')!,entry=Object.values(education.entriesById)[0]!;
  if(entry.kind!=='education')throw new Error('fixture');const oldApproval=entry.fields.title.approvalId!;
  entry.fields.title=editSensitiveSource(entry.fields.title,'Título sintético revisado','es');
  assert.equal(sensitiveReviewState(entry.fields.title,cv.sensitiveTranslationMemory),'stale');
  const plan=manualPlan(buildLanguagePlan(cv,'en')),c=sensitive(plan);assert.equal(c.status,'stale');c.decision='approve';c.proposal='Reviewed synthetic degree updated';c.mode='translationAndOriginal';
  const next=applyLanguagePlan(cv,plan,ctx);assert.deepEqual(next.sensitiveTranslationMemory[oldApproval],cv.sensitiveTranslationMemory[oldApproval]);
  assert.equal(Object.keys(next.sensitiveTranslationMemory).length,Object.keys(cv.sensitiveTranslationMemory).length+1);
});
test('F5 displaying only the original retains a valid approval association and detects a later source edit',()=>{
  const {cv,ctx}=full(),plan=manualPlan(buildLanguagePlan(cv,'en')),item=sensitive(plan);item.decision='keepOriginal';item.mode='original';
  const next=applyLanguagePlan(cv,plan,ctx),entry=next.sectionsById[item.path[1]!]!.entriesById[item.path[3]!]!;if(entry.kind!=='education')throw new Error('kind');
  const field=entry.fields.title;assert.equal(field.displayMode,'original');assert.equal(sensitiveReviewState(field,next.sensitiveTranslationMemory),'approved');assert.equal(resolveSensitive(field,next.sensitiveTranslationMemory).length,1);
  const changed=editSensitiveSource(field,'Nuevo título sintético','es');assert.equal(sensitiveReviewState(changed,next.sensitiveTranslationMemory),'stale');assert.deepEqual(next.sensitiveTranslationMemory,cv.sensitiveTranslationMemory);
});
test('F5 unreviewed/missing translations block apply; plan tampering and protected edits fail explicitly',()=>{
  const {cv,ctx}=full(),plan=buildLanguagePlan(cv,'en');assert.throws(()=>applyLanguagePlan(cv,plan,ctx));
  const reviewed=manualPlan(plan),c=sensitive(reviewed);c.source.original!.value='Tampered original';assert.throws(()=>applyLanguagePlan(cv,reviewed,ctx));
  const changed=manualPlan(plan);changed.preserved=[];assert.throws(()=>validateLanguagePlan(cv,changed));
  cv.personalInformation.headline=A('Hola Python');const p=buildLanguagePlan(cv,'en');p.fields[0]!.path=['name'];assert.throws(()=>applyLanguagePlan(cv,p,ctx));
});
test('F5 translating rich text preserves structure, marks and explicit protected spans including multi-node names',()=>{
  const {cv,ctx}=fixture(),id=ctx.newId();cv.personalInformation.about={class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Trabajo en ',marks:[]},{kind:'text',text:'Marca ',marks:[{kind:'bold'}]},{kind:'text',text:'Propia',marks:[{kind:'italic'}]},{kind:'text',text:' hoy',marks:[]}]}]},locale:'es'},revision:1,protectedSpans:[{id,start:11,end:23,value:'Marca Propia',entity:'brand'}]};
  const plan=manualPlan(buildLanguagePlan(cv,'en')),item=plan.fields.find(f=>f.path.join('.')==='personalInformation.about')!;
  if(item.class!=='A')throw new Error('fixture');for(const s of item.segments)if(!s.protected)s.translation=s.source==='Trabajo en '?'I work at ':' today';
  const next=applyLanguagePlan(cv,plan,ctx),about=next.personalInformation.about!;assert.equal(richText(about.current.value),'I work at Marca Propia today');
  assert.deepEqual(about.protectedSpans,[{id,start:10,end:22,value:'Marca Propia',entity:'brand'}]);assert.equal(about.current.value.content[0]!.kind,'paragraph');
});
test('F5 provider receives only permitted fragments; proposals require review and bad/aborted responses never apply',async()=>{
  const {cv}=full();cv.personalInformation.headline=A('Uso TypeScript');
  const before=structuredClone(cv),plan=buildLanguagePlan(cv,'en');let calls=0;
  const proposed=await proposeLanguagePlan(cv,plan,{id:'synthetic-only',offline:true,async propose(requests){calls++;const json=JSON.stringify(requests);assert(!json.includes('Instituto Sintético'));assert(!json.includes('Compañía Sintética'));assert(!json.includes('TypeScript'));assert(!json.includes(cv.id));return requests.map(r=>({id:r.id,text:'Synthetic proposal'}));}});
  assert.equal(calls,1);assert(proposed.fields.some(f=>f.class==='A'&&!f.reviewed));assert.deepEqual(cv,before);
  await assert.rejects(proposeLanguagePlan(cv,plan,{id:'bad',offline:true,async propose(){return [];}}),/TRANSLATION_RESPONSE_INVALID/);
  await assert.rejects(proposeLanguagePlan(cv,plan,{id:'failed',offline:true,async propose(){throw new Error('SYNTHETIC_PRIVATE_PROVIDER_CONTENT');}}),error=>error instanceof Error&&error.message==='TRANSLATION_FAILED');
  const controller=new AbortController();controller.abort();await assert.rejects(proposeLanguagePlan(cv,plan,{id:'never',offline:true,async propose(){throw new Error('must not call');}},controller.signal),/TRANSLATION_CANCELLED/);
});
test('F5 narrative holds only active text and locale; manual translation needs no provider',()=>{
  const {cv,ctx}=fixture(),plan=manualPlan(buildLanguagePlan(cv,'en')),next=applyLanguagePlan(cv,plan,ctx);
  const source=Object.values(cv.sectionsById).find(s=>s.kind==='projects')!,project=Object.values(next.sectionsById[source.id]!.entriesById)[0]!;
  if(project.kind!=='project')throw new Error('fixture');assert.equal(project.fields.title.class,'A');assert.equal(plainText(project.fields.title),'Reviewed English text');
  assert(!JSON.stringify(next).includes('translationsByLocale'));assert.equal(project.fields.title.class==='A'&&project.fields.title.current.locale,'en');
});
test('F5 language codes and substrings of a name do not protect unrelated narrative words',()=>{
  const {cv}=full();cv.personalInformation.givenName='Ana';cv.personalInformation.about={class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Este documento es para analizar con Ana.',marks:[]}]}]},locale:'es'},revision:1,protectedSpans:[]};
  const item=buildLanguagePlan(cv,'en').fields.find(f=>f.path.join('.')==='personalInformation.about')!;if(item.class!=='A')throw new Error('kind');
  assert.deepEqual(item.segments.filter(s=>s.protected).map(s=>s.source),['Ana']);assert(item.segments.some(s=>!s.protected&&s.source.includes('es para analizar')));
});
test('F5 review plan follows manual entry order rather than map insertion or ID order',()=>{
  const {cv,ctx}=fixture(),section=Object.values(cv.sectionsById).find(s=>s.kind==='projects')!,first=section.entryOrder![0]!,copy=structuredClone(section.entriesById[first]!);copy.id=ctx.newId();if(copy.kind!=='project')throw new Error('kind');copy.fields.title=A('Segundo proyecto');section.entriesById[copy.id]=copy;section.entryOrder=[copy.id,first];
  const titles=buildLanguagePlan(cv,'en').fields.filter(f=>f.path[1]===section.id&&f.path.at(-1)==='title');assert.deepEqual(titles.map(f=>f.path[3]),[copy.id,first]);
});
test('F5 explicit protected terms survive translation and reject overlaps/missing terms; reviewing positions is explicit',()=>{
  const {cv,ctx}=fixture();cv.personalInformation.headline=protectNarrativeTerms(A('Trabajo con OpenSynth'),['OpenSynth'],ctx);
  const previous=structuredClone(cv.personalInformation.headline);assert.throws(()=>protectNarrativeTerms(previous,['Missing'],ctx));assert.throws(()=>protectNarrativeTerms(previous,['OpenSynth','Synth'],ctx));
  cv.personalInformation.headline={...previous,current:{value:'Ahora trabajo con OpenSynth',locale:'es'}};assert.throws(()=>validateCv(cv));
  cv.personalInformation.headline=protectNarrativeTerms(cv.personalInformation.headline,['OpenSynth'],ctx);validateCv(cv);
  const plan=manualPlan(buildLanguagePlan(cv,'en')),next=applyLanguagePlan(cv,plan,ctx);assert(plainText(next.personalInformation.headline!).includes('OpenSynth'));assert.equal(next.personalInformation.headline!.class,'A');
});
test('F5 deliberately kept narrative retains its real source language rather than claiming it was translated',()=>{
  const {cv,ctx}=fixture(),plan=manualPlan(buildLanguagePlan(cv,'en'));const item=plan.fields.find(f=>f.class==='A'&&f.path.at(-1)==='title')!;if(item.class!=='A')throw new Error('kind');item.decision='keepOriginal';
  const next=applyLanguagePlan(cv,plan,ctx);const section=next.sectionsById[item.path[1]!]!,e=section.entriesById[item.path[3]!]!;if(e.kind!=='project'||e.fields.title.class!=='A')throw new Error('kind');assert.deepEqual(e.fields.title,item.source);assert.equal(e.fields.title.current.locale,'es');assert.equal(next.documentLocale,'en');
});
test('F5 user controls A/B/C classification without changing the literal and unknown original is never invented',()=>{
  const {ctx}=fixture(),c=classifyText(A('Curso Superior Sintético'),'C','es',ctx,'certification');assert.equal(c.class,'C');assert.equal(plainText(c),'Curso Superior Sintético');
  const b=classifyText(A('AWS Certified Synthetic'),'B','es',ctx,'certification');assert.equal(b.class,'B');
  assert.equal(classifyText(b,'A','es',ctx,'certification').class,'A');
  const unknown=sensitiveFromVisible([{role:'translation',value:'Synthetic visible translation','locale':'en'}],{fieldKind:'certification'},ctx);assert.throws(()=>classifyText(unknown,'A','en',ctx,'certification'));assert.equal(unknown.original,null);
});
