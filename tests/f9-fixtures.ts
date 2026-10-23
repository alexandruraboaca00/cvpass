import {A,B,createSection,projectForCv,validateCv,validateProject} from '../src/domain/index.js';
import type {CvDocument,DomainContext,ProjectSnapshot} from '../src/domain/index.js';
import type {ProjectData} from '../src/application/contracts.js';
import {copyProjectIdentities} from '../src/application/copies.js';
import {newMvpEntry} from '../src/application/editor-model.js';
import {completeProjectFixture} from './fixtures.js';

// Fixed clock, identities, content, counts and ordering: no private benchmark data.
export function f9Context():DomainContext {
  let n=1000;return {newId:()=>`f9000000-0000-4000-8000-${String(++n).padStart(12,'0')}`,now:()=> '2026-10-23T12:00:00.000Z'};
}
export function f9Corpus():{name:string;cv:CvDocument}[]{
  const f=completeProjectFixture();if(f.snapshot.scope!=='workspace')throw Error('fixture');
  const base=structuredClone(f.snapshot.workspace.cvsById[f.snapshot.workspace.cvOrder[0]!]!);
  for(const s of Object.values(base.sectionsById))s.included=true;
  base.personalInformation.displayName='Persona F9 sintética Ștefan';
  const small=structuredClone(base);for(const s of Object.values(small.sectionsById))s.included=['education','work'].includes(s.kind);
  const long=structuredClone(base),project=Object.values(long.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='project')!;
  if(project.kind!=='project')throw Error('fixture');
  project.fields.description={class:'A',revision:1,protectedSpans:[],current:{locale:'es',value:{kind:'doc',content:Array.from({length:48},(_,i)=>({kind:'paragraph',content:[{kind:'text',text:`F9_PARAGRAPH_${i+1} `+'Contenido sintético íntegro á é í ó ú ñ ¿ ¡ ă â î ș ț. '.repeat(6)+` F9_END_${i+1}`,marks:[]}]}))}}};
  const skills=structuredClone(base),ctx=f9Context(),s=Object.values(skills.sectionsById).find(s=>s.kind==='skills')!;
  const group=ctx.newId();s.groupsById[group]={id:group,name:A('Segundo grupo'),skillIds:[]};s.groupOrder.push(group);
  for(let i=0;i<40;i++){const e=newMvpEntry('skill',ctx,'es');if(e.kind!=='skill')throw Error();const gid=s.groupOrder[i%2]!;e.fields.label=B(`F9 Skill ${i+1}`,'term');e.fields.groupId=gid;s.entriesById[e.id]=e;s.groupsById[gid]!.skillIds.push(e.id);}
  const languages=structuredClone(base),l=Object.values(languages.sectionsById).find(s=>s.kind==='languages')!;
  for(let i=0;i<6;i++){const e=newMvpEntry('foreignLanguage',ctx,'es');if(e.kind!=='foreignLanguage')throw Error();e.fields.language={code:null,name:`F9 Language ${i+1}`};e.fields.proficiency={listening:'B1',reading:null,spokenInteraction:null,spokenProduction:null,writing:null};l.entriesById[e.id]=e;l.entryOrder!.push(e.id);}
  const custom=structuredClone(base);
  for(let i=0;i<2;i++){const s={...createSection('custom',ctx,A(`F9 Custom ${i+1}`)),included:true,entriesById:{} as CvDocument['sectionsById'][string]['entriesById']};for(let j=0;j<3;j++){const e=newMvpEntry('custom',ctx,'es');if(e.kind!=='custom')throw Error();e.fields.title=A(`F9 Entry ${i+1}-${j+1}`);s.entriesById[e.id]=e;s.entryOrder!.push(e.id);}custom.sectionsById[s.id]=s;custom.sectionOrder.push(s.id);}
  return [{name:'small',cv:small},{name:'medium',cv:base},{name:'long',cv:long},{name:'skills',cv:skills},{name:'languages',cv:languages},{name:'custom',cv:custom}].map(c=>({...c,cv:validateCv(c.cv)}));
}
export function f9Workspace(count=100):ProjectData {
  const fixture=completeProjectFixture();if(fixture.snapshot.scope!=='workspace')throw Error('fixture');
  const original=projectForCv(fixture.snapshot,fixture.snapshot.workspace.cvOrder[0]!);if(original.scope!=='cv')throw Error('fixture');
  const ctx=f9Context(),cases=f9Corpus();
  fixture.snapshot.workspace.cvsById={};fixture.snapshot.workspace.cvOrder=[];fixture.snapshot.revisions=[];
  for(let i=0;i<count;i++){
    const c=cases[i%cases.length]!,source:ProjectSnapshot={...original,cv:c.cv,revisions:[]};
    const p=copyProjectIdentities(source,ctx);if(p.scope!=='cv')throw Error();
    p.cv.name=`F9 ${String(i+1).padStart(3,'0')} ${c.name}`;
    fixture.snapshot.workspace.cvsById[p.cv.id]=p.cv;fixture.snapshot.workspace.cvOrder.push(p.cv.id);
  }
  return {snapshot:validateProject(fixture.snapshot),blobs:fixture.blobs};
}
