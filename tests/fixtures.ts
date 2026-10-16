import { A, B, createProfile, createSection, emptyPersonal, validateProfile } from '../src/domain/index.js';
import type { DomainContext, MasterProfile, TemplateDefinition, Entry } from '../src/domain/index.js';
export function context():DomainContext {let counter=0;return {newId:()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`,now:()=> '2026-10-16T12:00:00.000Z'};}
export const template:TemplateDefinition={id:'synthetic-simple',version:1,rendererContractVersion:1,layout:'singleColumn',capabilities:['education','work','skills','languages','certifications','projects','custom'],resourceRefs:[]};
export function profileFixture(ctx=context()):{profile:MasterProfile;ctx:DomainContext} {
  const p=createProfile(emptyPersonal('Persona Sintética Ștefan'),ctx);
  p.personalInformation.contacts.push({id:ctx.newId(),kind:'email',label:null,value:'synthetic@example.org'});
  p.personalInformation.birthDate={precision:'day',year:1990,month:7,day:19};
  const section=createSection('projects',ctx);
  const e:Entry={id:ctx.newId(),createdAt:ctx.now(),updatedAt:ctx.now(),sourceRef:null,kind:'project',fields:{title:A('Proyecto sintético'),period:{start:{precision:'month',year:2020,month:3},end:null,ongoing:true},description:{class:'A',current:{value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Descripción propia',marks:[{kind:'bold'}]}]}]},locale:'es'},revision:1},links:[]}};
  section.entriesById[e.id]=e;section.entryOrder!.push(e.id);p.sectionsById[section.id]=section;p.sectionOrder.push(section.id);
  const other=createSection('custom',ctx,A('Información adicional'));p.sectionsById[other.id]=other;p.sectionOrder.push(other.id);
  p.personalInformation.headline=B('Marca Sintética','brand');
  return {profile:validateProfile(p),ctx};
}
