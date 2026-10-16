import { selectedApprovals } from './language.js';
import { parse, fail, IdSchema, Timestamp, assertOrder } from './primitives.js';
import type { DomainContext } from './primitives.js';
import { validateProfile, validateCv, PersonalSchema } from './model.js';
import type { CvDocument, Entity, MasterProfile, PersonalInformation, ProfileSection, TemplateDefinition } from './model.js';
export function contextStamp(ctx: DomainContext): { id: string; createdAt: string; updatedAt: string; revision: number } {
  const at=parse(Timestamp,ctx.now()); return {id:parse(IdSchema,ctx.newId()),createdAt:at,updatedAt:at,revision:0};
}
export function emptyPersonal(displayName: string): PersonalInformation {
  return parse(PersonalSchema,{displayName,givenName:null,familyName:null,otherNames:[],headline:null,about:null,contacts:[],addresses:[],birthDate:null,nationalities:[],gender:null,identifiers:[],photo:null});
}
export function createProfile(personal: PersonalInformation,ctx: DomainContext): MasterProfile {
  return validateProfile({...contextStamp(ctx),kind:'profile',personalInformation:personal,sectionsById:{},sectionOrder:[],sensitiveTranslationMemory:{}});
}
export function createSection(kind: ProfileSection['kind'],ctx: DomainContext,title: ProfileSection['title']=null): ProfileSection {
  return {id:parse(IdSchema,ctx.newId()),kind,title,entriesById:{},entryOrder:kind==='skills'?null:[],groupsById:{},groupOrder:[],ungroupedSkillIds:[]};
}
function remapMaterialized(profile: MasterProfile,ctx: DomainContext): {materialized:MasterProfile;idMap:Map<string,string>} {
  const idMap=new Map<string,string>();
  function collect(v:unknown):void {
    if(!v||typeof v!=='object')return;
    if(Array.isArray(v)){v.forEach(collect);return;}
    for(const [key,value]of Object.entries(v)){
      if(['sourceRef','catalog','templateRef'].includes(key))continue;
      if(key==='id'&&typeof value==='string')idMap.set(value,parse(IdSchema,ctx.newId()));else collect(value);
    }
  }
  collect(profile);
  const refs=new Set(['id','approvalId','groupId']);
  const lists=new Set(['sectionOrder','entryOrder','groupOrder','ungroupedSkillIds','skillIds','contacts','addresses']);
  function copy(v:unknown,parent=''):unknown {
    if(Array.isArray(v))return v.map(x=>typeof x==='string'&&lists.has(parent)?idMap.get(x)??x:copy(x));
    if(!v||typeof v!=='object')return v;
    return Object.fromEntries(Object.entries(v).map(([key,value])=>[idMap.get(key)??key,['sourceRef','catalog','templateRef'].includes(key)?structuredClone(value):typeof value==='string'&&refs.has(key)?idMap.get(value)??value:copy(value,key)]));
  }
  return {materialized:copy(profile) as MasterProfile,idMap};
}
export function createCvFromProfile(profile: MasterProfile,options: {name:string;documentLocale:'es'|'en';template:TemplateDefinition;sectionIds:string[]},ctx:DomainContext):CvDocument {
  const original=validateProfile(profile);
  if(new Set(options.sectionIds).size!==options.sectionIds.length||options.sectionIds.some(id=>!original.sectionsById[id]))fail('selection.invalid');
  // Explicit section selection; the caller controls the chosen profile content.
  const selected=structuredClone(original);
  selected.sectionOrder=original.sectionOrder.filter(id=>options.sectionIds.includes(id));
  selected.sectionsById=Object.fromEntries(selected.sectionOrder.map(id=>[id,original.sectionsById[id]!]));
  selected.sensitiveTranslationMemory=selectedApprovals(selected,original.sensitiveTranslationMemory);
  const {materialized,idMap}=remapMaterialized(selected,ctx);
  const sections:CvDocument['sectionsById']={};
  for(const sourceId of selected.sectionOrder) {
    const id=idMap.get(sourceId)!,section=materialized.sectionsById[id]!;
    const sourceSection=original.sectionsById[sourceId]!;
    const entries:CvDocument['sectionsById'][string]['entriesById']={};
    for(const old of Object.values(sourceSection.entriesById)) {
      const newId=idMap.get(old.id)!;
      entries[newId]={...section.entriesById[newId]!,included:true,sourceRef:{kind:'profile',profileId:original.id,profileEntryId:old.id,profileRevision:original.revision}};
    }
    sections[id]={...section,included:true,entriesById:entries};
  }
  const p=materialized.personalInformation;
  const at=parse(Timestamp,ctx.now());
  return validateCv({kind:'cv',id:materialized.id,revision:0,createdAt:at,updatedAt:at,name:options.name,documentTitle:null,documentLocale:options.documentLocale,
    personalInformation:p,sectionsById:sections,sectionOrder:materialized.sectionOrder,sensitiveTranslationMemory:materialized.sensitiveTranslationMemory,
    presentation:{templateRef:{id:options.template.id,version:options.template.version},density:'normal',accentColor:'#224466',fontFamily:'Liberation Sans',page:'A4',numbering:false,datePrecision:'day',showCefrGuide:false,
      personalFieldVisibility:{displayName:true,givenName:false,familyName:false,otherNames:false,headline:true,about:true,birthDate:false,nationalities:false,gender:false,identifiers:false,contacts:p.contacts.map(c=>c.id),addresses:p.addresses.map(a=>a.id)}}});
}
export function reorderSections<T extends Entity>(entity:T,order:string[]):T {
  assertOrder(order,Object.keys(entity.sectionsById),['sectionOrder']);
  const copy=structuredClone(entity);copy.sectionOrder=[...order];return (copy.kind==='profile'?validateProfile(copy):validateCv(copy)) as T;
}
export function includeSection(cv:CvDocument,id:string,included:boolean):CvDocument {
  const copy=validateCv(cv);if(!copy.sectionsById[id])fail('section.notFound',[id]);copy.sectionsById[id].included=included;return validateCv(copy);
}
export function includeEntry(cv:CvDocument,sectionId:string,entryId:string,included:boolean):CvDocument {
  const copy=validateCv(cv);const entry=copy.sectionsById[sectionId]?.entriesById[entryId];if(!entry)fail('entry.notFound',[sectionId,entryId]);entry.included=included;return validateCv(copy);
}
