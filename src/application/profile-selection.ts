import {z} from 'zod';
import {emptyPersonal,parse,validateProfile} from '../domain/index.js';
import type {MasterProfile,PersonalInformation} from '../domain/index.js';
import {reject} from './contracts.js';
export const personalSelectionKeys=['displayName','givenName','familyName','otherNames','headline','about','birthDate','nationalities','gender','identifiers'] as const;
export const ProfileSelectionSchema=z.strictObject({personalFields:z.array(z.enum(personalSelectionKeys)),contactIds:z.array(z.uuid()),addressIds:z.array(z.uuid()),photo:z.boolean(),sections:z.array(z.strictObject({sectionId:z.uuid(),entryIds:z.array(z.uuid())}))});
export type ProfileSelection=z.infer<typeof ProfileSelectionSchema>;
export function selectProfileContent(original:MasterProfile,input:ProfileSelection):MasterProfile {
  const selection=parse(ProfileSelectionSchema,input),p=original.personalInformation;
  const unique=(ids:string[])=>new Set(ids).size===ids.length;
  if(!selection.personalFields.includes('displayName'))reject('PROFILE_NAME_SELECTION_REQUIRED');
  if(!unique(selection.personalFields)||!unique(selection.contactIds)||!unique(selection.addressIds)||!unique(selection.sections.map(s=>s.sectionId)))reject('PROFILE_SELECTION_INVALID');
  if(selection.contactIds.some(id=>!p.contacts.some(c=>c.id===id))||selection.addressIds.some(id=>!p.addresses.some(a=>a.id===id))||(selection.photo&&!p.photo))reject('PROFILE_SELECTION_INVALID');
  const selected=structuredClone(original),personal=emptyPersonal(p.displayName);
  for(const key of selection.personalFields)(personal as unknown as Record<string,unknown>)[key]=structuredClone(p[key]);
  personal.contacts=structuredClone(p.contacts.filter(c=>selection.contactIds.includes(c.id)));personal.addresses=structuredClone(p.addresses.filter(a=>selection.addressIds.includes(a.id)));
  personal.photo=selection.photo&&p.photo?{...structuredClone(p.photo),visible:true}:null;selected.personalInformation=personal;
  const sections=new Map(selection.sections.map(s=>[s.sectionId,s]));
  if(selection.sections.some(s=>!original.sectionsById[s.sectionId]))reject('PROFILE_SELECTION_INVALID');
  selected.sectionOrder=original.sectionOrder.filter(id=>sections.has(id));selected.sectionsById={};
  for(const id of selected.sectionOrder){const s=structuredClone(original.sectionsById[id]!),ids=sections.get(id)!.entryIds;
    if(!unique(ids)||ids.some(id=>!s.entriesById[id]))reject('PROFILE_SELECTION_INVALID');
    s.entriesById=Object.fromEntries(Object.entries(s.entriesById).filter(([id])=>ids.includes(id)));
    if(s.kind==='skills'){s.ungroupedSkillIds=s.ungroupedSkillIds.filter(id=>ids.includes(id));for(const g of Object.values(s.groupsById))g.skillIds=g.skillIds.filter(id=>ids.includes(id));}
    else s.entryOrder=s.entryOrder!.filter(id=>ids.includes(id));selected.sectionsById[id]=s;
  }
  return validateProfile(selected);
}
