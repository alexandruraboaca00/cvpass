import { assertOrder, fail, parse, IdSchema } from './primitives.js';
import type { ProfileSection, Entry } from './model.js';

// The lists are the only source of order. Operations return a copy for parent drafts.
function skills<T extends ProfileSection>(section:T):T {
  if (section.kind !== 'skills') fail('skills.expectedSection');
  return structuredClone(section);
}
function list(section:ProfileSection,groupId:string|null):string[] {
  return groupId === null ? section.ungroupedSkillIds : section.groupsById[groupId]?.skillIds ?? fail('skills.groupNotFound');
}
export function addSkill<T extends ProfileSection>(section:T,entry:Extract<T['entriesById'][string],{kind:'skill'}>,index?:number):T {
  const copy=skills(section); parse(IdSchema,entry.id);
  if(copy.entriesById[entry.id])fail('skills.duplicate');
  const order=list(copy,entry.fields.groupId),position=index ?? order.length;
  if(!Number.isSafeInteger(position)||position<0||position>order.length)fail('skills.invalidPosition');
  copy.entriesById[entry.id]=structuredClone(entry);order.splice(position,0,entry.id);return copy;
}
export function moveSkill<T extends ProfileSection>(section:T,skillId:string,groupId:string|null,index:number):T {
  const copy=skills(section),entry=copy.entriesById[skillId];
  if(!entry||entry.kind!=='skill')fail('skills.notFound');
  const from=list(copy,entry.fields.groupId),to=list(copy,groupId),previous=from.indexOf(skillId);
  if(previous<0)fail('skills.invalidMembership');
  from.splice(previous,1);
  if(!Number.isSafeInteger(index)||index<0||index>to.length)fail('skills.invalidPosition');
  to.splice(index,0,skillId);entry.fields.groupId=groupId;return copy;
}
export function removeSkillGroup<T extends ProfileSection>(section:T,groupId:string):T {
  const copy=skills(section),group=copy.groupsById[groupId];
  if(!group)fail('skills.groupNotFound');
  for(const id of group.skillIds){const entry=copy.entriesById[id];if(entry?.kind!=='skill')fail('skills.invalidMembership');entry.fields.groupId=null;}
  copy.ungroupedSkillIds.push(...group.skillIds);delete copy.groupsById[groupId];
  copy.groupOrder=copy.groupOrder.filter(id=>id!==groupId);return copy;
}
export function reorderSkillGroups<T extends ProfileSection>(section:T,order:string[]):T {
  const copy=skills(section);assertOrder(order,Object.keys(copy.groupsById),['groupOrder']);copy.groupOrder=[...order];return copy;
}
export function reorderSkills<T extends ProfileSection>(section:T,groupId:string|null,order:string[]):T {
  const copy=skills(section),target=list(copy,groupId);assertOrder(order,target,['skillIds']);target.splice(0,target.length,...order);return copy;
}
