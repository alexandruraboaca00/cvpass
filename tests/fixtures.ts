import { A, B, createProfile, createSection, emptyPersonal, validateProfile } from '../src/domain/index.js';
import type { DomainContext, MasterProfile, TemplateDefinition, Entry } from '../src/domain/index.js';
export function context():DomainContext {let counter=0;return {newId:()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`,now:()=> '2026-10-16T12:00:00.000Z'};}
export const template:TemplateDefinition={id:'synthetic-simple',version:1,rendererContractVersion:1,layout:'singleColumn',capabilities:['education','work','skills','languages','certifications','projects','custom'],resourceRefs:[]};
export function profileFixture(ctx=context()):{profile:MasterProfile;ctx:DomainContext} {
  const p=createProfile(emptyPersonal('Persona Sintética Ștefan'),ctx);
  p.personalInformation.contacts.push({id:ctx.newId(),kind:'email',label:null,value:'synthetic@example.org'});
  p.personalInformation.birthDate={precision:'day',year:1990,month:7,day:19};
  const section=createSection('projects',ctx);
  const e:Entry={id:ctx.newId(),createdAt:ctx.now(),updatedAt:ctx.now(),sourceRef:null,kind:'project',fields:{title:A('Proyecto sintético'),period:{start:{precision:'month',year:2020,month:3},end:null,ongoing:true},description:{class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Descripción propia',marks:[{kind:'bold'}]}]}]},locale:'es'},revision:1,protectedSpans:[]},links:[]}};
  section.entriesById[e.id]=e;section.entryOrder!.push(e.id);p.sectionsById[section.id]=section;p.sectionOrder.push(section.id);
  const other=createSection('custom',ctx,A('Información adicional'));p.sectionsById[other.id]=other;p.sectionOrder.push(other.id);
  p.personalInformation.headline=B('Marca Sintética','brand');
  return {profile:validateProfile(p),ctx};
}

import { createCvFromProfile, EntrySchema, A as narrative, B as literal, SensitiveSchema, keepOriginal, approveSensitive, parse, checkpoint, validateProject } from '../src/domain/index.js';
import type { ProjectSnapshot, ProfileSection } from '../src/domain/index.js';
import { deflateSync } from 'node:zlib';
import { crc32, makeAsset } from '../src/adapters/asset-bytes.js';
export function syntheticPng(width=4,height=2,privateText: boolean|string=false):Uint8Array {
  const chunk=(name:string,data:Uint8Array):Buffer=>{const type=Buffer.from(name),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([len,type,data,crc]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
  const rows=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=y*(width*3+1)+1+x*3;if(width===4&&x<2)rows[at]=255;else rows[at+2]=255;}
  return new Uint8Array(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),...(privateText?[chunk('tEXt',Buffer.from('Comment\0'+(typeof privateText==='string'?privateText:'PRIVATE_ORIGINAL_METADATA')))]:[]),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));
}
export function completeProjectFixture():{snapshot:ProjectSnapshot;blobs:Map<string,Uint8Array>;ctx:DomainContext} {
 const {profile:p,ctx}=profileFixture();
 const rich={class:'A' as const,current:{value:{kind:'doc' as const,content:[{kind:'bulletList' as const,items:[{kind:'listItem' as const,content:[{kind:'paragraph' as const,content:[{kind:'text' as const,text:'Trabajo sintético verificable',marks:[]}]}]}]}]},locale:'es'},revision:1,protectedSpans:[]};
 const sensitive=(value:string)=>keepOriginal(parse(SensitiveSchema,{class:'C',id:ctx.newId(),original:{value,locale:'es',revision:1},context:{fieldKind:'qualification',organization:'Instituto Sintético'},outputLocale:'es',displayMode:'original',decision:'pending',approvalId:null,importedVisibleVariants:[]}));
 const add=(s:ProfileSection,kind:Entry['kind'],fields:unknown):string=>{const e=parse(EntrySchema,{id:ctx.newId(),kind,fields,createdAt:ctx.now(),updatedAt:ctx.now(),sourceRef:null});s.entriesById[e.id]=e;if(s.entryOrder)s.entryOrder.push(e.id);return e.id;};
 const section=(kind:ProfileSection['kind']):ProfileSection=>{const s=createSection(kind,ctx);p.sectionsById[s.id]=s;p.sectionOrder.push(s.id);return s;};
 add(section('education'),'education',{title:sensitive('Título sintético'),organization:literal('Instituto Sintético','organization'),period:{start:null,end:{precision:'year',year:2019},ongoing:false},description:null,links:[],location:null,eqf:null,web:null,address:null,fieldOfStudy:null,grade:null,thesis:null,subjects:[],nationalClassification:null,credits:null,validity:null});
 add(section('work'),'work',{position:narrative('Analista sintético'),employer:literal('Compañía Sintética','organization'),period:{start:{precision:'month',year:2020,month:2},end:null,ongoing:true},description:rich,links:[{id:ctx.newId(),label:'Proyecto',url:'https://example.org/project'}],location:null,sector:null,department:null,web:null,contact:null});
 const skills=section('skills'),groupId=ctx.newId();skills.groupsById[groupId]={id:groupId,name:narrative('Herramientas'),skillIds:[]};skills.groupOrder=[groupId];
 const skillId=add(skills,'skill',{label:literal('TypeScript','term'),groupId,catalog:null});skills.groupsById[groupId]!.skillIds.push(skillId);
 const ungrouped=add(skills,'skill',{label:narrative('Documentación'),groupId:null,catalog:null});skills.ungroupedSkillIds.push(ungrouped);
 const languages=section('languages');add(languages,'nativeLanguage',{language:{code:'ro',name:null}});add(languages,'nativeLanguage',{language:{code:'es',name:null}});
 add(languages,'foreignLanguage',{language:{code:'en',name:null},proficiency:{listening:null,reading:null,spokenInteraction:'B1',spokenProduction:null,writing:null}});
 add(section('certifications'),'certification',{title:sensitive('Certificado sintético'),issuer:literal('Entidad Sintética','organization'),issued:{precision:'month',year:2021,month:11},learningMode:'Modalidad original',description:null,links:[]});
 const custom=p.sectionsById[p.sectionOrder[1]!]!;add(custom,'custom',{title:narrative('Actividad sintética'),period:{start:{precision:'year',year:2018},end:{precision:'year',year:2019},ongoing:false},description:null,links:[]});
 const education=Object.values(p.sectionsById).find(s=>s.kind==='education')!,educationEntry=Object.values(education.entriesById)[0]!;
 if(educationEntry.kind!=='education')throw new Error('fixture');const reviewed=approveSensitive(educationEntry.fields.title,'Reviewed synthetic degree','en',ctx,'translationAndOriginal');
 educationEntry.fields.title=reviewed.field;p.sensitiveTranslationMemory[reviewed.approval.id]=reviewed.approval;
 const original=syntheticPng(4,2,true),asset=makeAsset(ctx.newId(),original,'photo','image/png');
 p.personalInformation.photo={assetId:asset.id,crop:{x:0.5,y:0,width:0.5,height:1},visible:true};
 const profile=validateProfile(p);
 const first=createCvFromProfile(profile,{name:'Primer CV privado',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);
 const rev=checkpoint(first,ctx);first.revision=1;first.sectionsById[first.sectionOrder[0]!]!.included=false;
 const second=createCvFromProfile(profile,{name:'PRIVATE_OTHER_CV',documentLocale:'en',template,sectionIds:[]},ctx);
 profile.personalInformation.otherNames.push('PRIVATE_PROFILE_ONLY');profile.revision++;
 const snapshot=validateProject({scope:'workspace',workspace:{id:ctx.newId(),profile,cvsById:{[first.id]:first,[second.id]:second},cvOrder:[first.id,second.id],settings:{uiLocale:'es'}},revisions:[rev],assetsById:{[asset.id]:asset},templates:[template]});
 return {snapshot,blobs:new Map([[asset.sha256,original]]),ctx};
}
