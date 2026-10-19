import { randomUUID } from 'node:crypto';
import { A, B, createSection, validateCv, approveSensitive } from '../src/domain/index.js';
import type { CvDocument, CvSection, RichNarrative } from '../src/domain/index.js';
import { newMvpEntry } from '../src/application/editor-model.js';
import { completeProjectFixture } from './fixtures.js';
export const f8Context={newId:randomUUID,now:()=> '2026-10-19T12:00:00.000Z'};
export function paragraphs(count:number):RichNarrative {return {class:'A',revision:1,protectedSpans:[],current:{locale:'es',value:{kind:'doc',content:Array.from({length:count},(_,i)=>({kind:'paragraph',content:[{kind:'text',text:`F8_PARAGRAPH_${String(i+1).padStart(2,'0')} Texto sintético íntegro con á é í ó ú ñ ¿ ¡ ă â î ș ț. `+'Contenido de paginación y lectura verificable. '.repeat(6)+` F8_END_${String(i+1).padStart(2,'0')}`,marks:[]}]}))}}};}
export function f8Corpus():{name:string;cv:CvDocument}[]{
 const fixture=completeProjectFixture();if(fixture.snapshot.scope!=='workspace')throw Error();
 const base=structuredClone(fixture.snapshot.workspace.cvsById[fixture.snapshot.workspace.cvOrder[0]!]!);
 base.presentation.templateRef={id:'lateral',version:1};base.presentation.fontFamily='Liberation Sans';base.presentation.numbering=true;
 base.personalInformation.displayName='Persona de prueba Ștefan';base.personalInformation.about=paragraphs(1);base.personalInformation.about.current.value.content[0]={kind:'paragraph',content:[{kind:'text',text:'Perfil sintético: á é í ó ú ñ ¿ ¡ ă â î ș ț. Experiencia en desarrollo y documentación técnica.',marks:[]}]};base.presentation.personalFieldVisibility.about=true;
 for(const s of Object.values(base.sectionsById))s.included=true;
 const minimal=structuredClone(base);for(const s of Object.values(minimal.sectionsById))s.included=false;minimal.personalInformation.contacts=[];minimal.presentation.personalFieldVisibility.contacts=[];minimal.personalInformation.photo=null;minimal.personalInformation.headline=null;minimal.personalInformation.about=null;
 const small=structuredClone(base);for(const s of Object.values(small.sectionsById))if(!['education','work'].includes(s.kind))s.included=false;
 const english=structuredClone(base);english.documentLocale='en';english.personalInformation.photo=null;
 const oversized=structuredClone(base),medium=structuredClone(base),large=structuredClone(base),skills=structuredClone(base),languages=structuredClone(base),url=structuredClone(base),sensitive=structuredClone(base),hidden=structuredClone(base),custom=structuredClone(base);
 const project=(cv:CvDocument)=>Object.values(cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='project')!;
 const huge=project(oversized);
 if(huge.kind==='project')huge.fields.description={class:'A',revision:1,protectedSpans:[],current:{locale:'es',value:{kind:'doc',content:[
  {kind:'paragraph',content:[{kind:'text',text:'OVERSIZED_START '+('Un párrafo muy largo conserva todas sus palabras y sus marcas. '.repeat(210))+' OVERSIZED_END',marks:[{kind:'bold'},{kind:'italic'}]}]},
  {kind:'orderedList',items:Array.from({length:8},(_,i)=>({kind:'listItem',content:[{kind:'paragraph',content:[{kind:'text',text:`LONG_LIST_${i} `+'Texto de lista. '.repeat(25)+` LIST_END_${i}`,marks:[]}]}]}))}
 ]}}};
 const longProject=project(large);if(longProject.kind==='project')longProject.fields.description=paragraphs(48);
 const skillSection=Object.values(skills.sectionsById).find(s=>s.kind==='skills')!;
 const gid=f8Context.newId();skillSection.groupsById[gid]={id:gid,name:A('Segundo grupo'),skillIds:[]};skillSection.groupOrder.push(gid);
 for(let i=0;i<80;i++){const e=newMvpEntry('skill',f8Context,'es');if(e.kind!=='skill')throw Error();const groupId=skillSection.groupOrder[i%2]!;e.fields={...e.fields,label:B(`SKILL_${String(i).padStart(3,'0')} Tecnología sintética`,'term'),groupId};skillSection.entriesById[e.id]=e;skillSection.groupsById[groupId]!.skillIds.push(e.id);}
 const languageSection=Object.values(languages.sectionsById).find(s=>s.kind==='languages')!;
 for(let i=0;i<14;i++){const e=newMvpEntry('foreignLanguage',f8Context,'es');if(e.kind!=='foreignLanguage')throw Error();e.fields.language={code:null,name:`LANGUAGE_${i} sintético`};e.fields.proficiency={listening:'B1',reading:null,spokenInteraction:null,spokenProduction:null,writing:null};languageSection.entriesById[e.id]=e;languageSection.entryOrder!.push(e.id);}
 const linked=project(url);if(linked.kind==='project')linked.fields.links=[{id:f8Context.newId(),label:null,url:'https://example.test/'+('long-url-segment-'.repeat(35))+'end'}];
 const education=Object.values(sensitive.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='education')!;
 if(education.kind==='education'){education.fields.title={...education.fields.title,original:{value:'PRIVATE_SENSITIVE_ORIGINAL',locale:'en',revision:1}};const alternate=approveSensitive(education.fields.title,'PRIVATE_ALTERNATIVE_TRANSLATION','ro',f8Context),visible=approveSensitive(education.fields.title,'TITULACIÓN VISIBLE ESPAÑOLA','es',f8Context);education.fields.title=visible.field;sensitive.sensitiveTranslationMemory[alternate.approval.id]=alternate.approval;sensitive.sensitiveTranslationMemory[visible.approval.id]=visible.approval;}
 const hiddenSection=Object.values(hidden.sectionsById).find(s=>s.kind==='projects')!;hiddenSection.included=false;const he=Object.values(hiddenSection.entriesById)[0]!;if(he.kind==='project')he.fields.title=A('PRIVATE_HIDDEN_SECTION');
 const work=Object.values(hidden.sectionsById).find(s=>s.kind==='work')!,old=Object.values(work.entriesById)[0]!,excluded=structuredClone(old);excluded.id=f8Context.newId();excluded.included=false;if(excluded.kind==='work'){excluded.fields.position=A('PRIVATE_HIDDEN_ENTRY');excluded.fields.links=excluded.fields.links.map(l=>({...l,id:f8Context.newId()}));}work.entriesById[excluded.id]=excluded;work.entryOrder!.push(excluded.id);
 for(let i=0;i<2;i++){const s:CvSection={...createSection('custom',f8Context,A(`CUSTOM_SECTION_${i}`)),entriesById:{},included:true};for(let j=0;j<3;j++){const e=newMvpEntry('custom',f8Context,'es');if(e.kind!=='custom')throw Error();e.fields.title=A(`CUSTOM_ENTRY_${i}_${j}`);e.fields.description=paragraphs(1);s.entriesById[e.id]=e;s.entryOrder!.push(e.id);}custom.sectionsById[s.id]=s;custom.sectionOrder.push(s.id);}
 return [{name:'english-no-photo',cv:english},{name:'minimal',cv:minimal},{name:'oversized',cv:oversized},{name:'small',cv:small},{name:'medium',cv:medium},{name:'large',cv:large},{name:'skills',cv:skills},{name:'languages',cv:languages},{name:'photo',cv:structuredClone(base)},{name:'urls',cv:url},{name:'sensitive',cv:sensitive},{name:'hidden',cv:hidden},{name:'custom',cv:custom}].map(c=>({...c,cv:validateCv(c.cv)}));
}
