import { z } from 'zod';
import { IdSchema, DocumentLocale, parse, fail, assertOrder, checkMap, assertDataTree, canonical } from './primitives.js';
import { MasterProfileSchema, CvDocumentSchema, AssetMapSchema, TemplateSchema, assertEntityInvariants } from './model.js';
import type { Entity, Asset, TemplateDefinition } from './model.js';
import { RevisionSchema, assertRevisionInvariants } from './revisions.js';
import { referencedAssets, assertResourceReferences } from './assets.js';
export const DOMAIN_MODEL_VERSION=1;
export const WorkspaceSchema=z.strictObject({id:IdSchema,profile:MasterProfileSchema.nullable(),cvsById:z.record(IdSchema,CvDocumentSchema),cvOrder:z.array(IdSchema),settings:z.strictObject({uiLocale:DocumentLocale})});
export type Workspace=z.infer<typeof WorkspaceSchema>;
const resources={revisions:z.array(RevisionSchema),assetsById:AssetMapSchema,templates:z.array(TemplateSchema)};
export const ProjectSnapshotSchema=z.discriminatedUnion('scope',[
  z.strictObject({scope:z.literal('cv'),cv:CvDocumentSchema,...resources}),
  z.strictObject({scope:z.literal('workspace'),workspace:WorkspaceSchema,...resources}),
]);
export type ProjectSnapshot=z.infer<typeof ProjectSnapshotSchema>;
export function entitiesOf(project:ProjectSnapshot):Entity[]{return project.scope==='cv'?[project.cv]:[...(project.workspace.profile?[project.workspace.profile]:[]),...Object.values(project.workspace.cvsById)];}
export const templateKey=(t:{id:string;version:number}):string=>`${t.id}@${t.version}`;
// Optional local-validation memo for a durable repository. Exact JSON values,
// never IDs/revision numbers alone, determine reuse. The complete graph bounds,
// ownership, history and resource closure are still checked on every call.
// Only strings are retained: callers cannot mutate a cached validated object.
export class ProjectValidationCache {
  private values=new Map<string,{json:string;validated:string;canonical?:string}>();
  private canonicalByEntity=new WeakMap<Entity,{validated:string;canonical?:string}>();
  private readonly entitySchema=z.discriminatedUnion('kind',[MasterProfileSchema,CvDocumentSchema]);
  private used=new Set<string>();
  private entity(value:unknown,kind?:Entity['kind']):Entity{
    const e=value as Entity,key=`${e?.id}@${e?.revision}`,json=JSON.stringify(value),old=this.values.get(key);
    // schema's root preprocessor checked the entire graph before any transform.
    // Keep every schema/invariant check, without walking each subtree again.
    if(!old||old.json!==json){const valid=parse(this.entitySchema,value);assertEntityInvariants(valid);this.values.set(key,{json,validated:JSON.stringify(valid)});}
    if(kind&&e.kind!==kind)fail('entity.wrongKind');this.used.add(key);
    const copy=JSON.parse(json) as Entity;this.canonicalByEntity.set(copy,this.values.get(key)!);return copy;
  }
  readonly schema=z.preprocess(value=>{assertDataTree(value);return value;},z.discriminatedUnion('scope',[
    ProjectSnapshotSchema.options[0].extend({cv:z.unknown().transform(v=>this.entity(v,'cv')),revisions:z.array(RevisionSchema.extend({snapshot:z.unknown().transform(v=>this.entity(v))}))}),
    ProjectSnapshotSchema.options[1].extend({workspace:WorkspaceSchema.extend({profile:z.unknown().nullable().transform(v=>v===null?null:this.entity(v,'profile')),cvsById:z.record(IdSchema,z.unknown().transform(v=>this.entity(v,'cv')))}),revisions:z.array(RevisionSchema.extend({snapshot:z.unknown().transform(v=>this.entity(v))}))}),
  ]));
  serialized(e:Entity):string{const value=this.canonicalByEntity.get(e)!;return value.canonical??=canonical(JSON.parse(value.validated));}
  begin():void{this.used.clear();}
  finish():void{for(const key of this.values.keys())if(!this.used.has(key))this.values.delete(key);}
}
export function validateProject(value:unknown,memo?:ProjectValidationCache):ProjectSnapshot {
  if(!memo)assertDataTree(value);memo?.begin();const p=parse(memo?.schema??ProjectSnapshotSchema,value) as ProjectSnapshot;
  checkMap(p.assetsById,['assetsById']);
  const entities=entitiesOf(p);const owners=new Map(entities.map(e=>[e.id,e]));
  if(owners.size!==entities.length)fail('project.duplicateEntityId');
  if(p.scope==='workspace'){
    checkMap(p.workspace.cvsById,['workspace','cvsById']);assertOrder(p.workspace.cvOrder,Object.keys(p.workspace.cvsById),['workspace','cvOrder']);
    if(owners.has(p.workspace.id))fail('project.duplicateEntityId');
  }
  const ids=new Set<string>(p.scope==='workspace'?[p.workspace.id]:[]);
  // IDs may repeat in history snapshots, but never between current entities.
  function unique(v:unknown):void{
    if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(unique);return;}
    for(const[k,x]of Object.entries(v)){if(['sourceRef','catalog','templateRef'].includes(k))continue;if(k==='id'&&typeof x==='string'){if(ids.has(x))fail('project.duplicateId',[x]);ids.add(x);}else unique(x);}
  }
  entities.forEach(e=>{if(!memo)assertEntityInvariants(e);unique(e);});
  const revisions=new Set<string>();
  const all=[...entities];
  // Canonical comparison is needed only when two snapshots claim the same
  // version, not for every unrelated current CV on every read/commit.
  const versions=new Map(entities.map(e=>[`${e.id}@${e.revision}`,e]));
  for(const r of p.revisions){assertRevisionInvariants(r,!!memo);const owner=owners.get(r.entityId);
    if(!owner||owner.kind!==r.entityKind||r.number>owner.revision)fail('revision.invalidOwnerOrFuture');
    const key=`${r.entityId}@${r.number}`,previous=versions.get(key);
    if(previous&&(memo?.serialized(previous)??canonical(previous))!==(memo?.serialized(r.snapshot)??canonical(r.snapshot)))fail('revision.divergentSnapshot');versions.set(key,r.snapshot);
    if(ids.has(r.id)||revisions.has(r.id))fail('revision.duplicateId');revisions.add(r.id);all.push(r.snapshot);
  }
  const idOwners=new Map<string,string>(p.scope==='workspace'?[[p.workspace.id,'workspace']]:[]);
  function checkOwner(v:unknown,owner:string):void {
    if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(x=>checkOwner(x,owner));return;}
    for(const [key,x]of Object.entries(v)){
      if(['sourceRef','catalog','templateRef'].includes(key))continue;
      if(key==='id'&&typeof x==='string'){if(idOwners.has(x)&&idOwners.get(x)!==owner)fail('revision.crossOwnerId',[x]);idOwners.set(x,owner);}else checkOwner(x,owner);
    }
  }
  all.forEach(e=>checkOwner(e,e.id));
  for(const id of revisions)if(idOwners.has(id))fail('revision.duplicateId');
  const keys=p.templates.map(templateKey);if(new Set(keys).size!==keys.length)fail('template.duplicate');
  const requiredTemplates=new Set(all.filter(e=>e.kind==='cv').map(e=>templateKey(e.presentation.templateRef)));
  if(keys.length!==requiredTemplates.size||keys.some(k=>!requiredTemplates.has(k)))fail('template.extraOrMissing');
  const requiredAssets=new Set<string>();
  for(const e of all){assertResourceReferences(e,p.assetsById,p.templates);referencedAssets(e).forEach(id=>requiredAssets.add(id));}
  for(const t of p.templates)for(const r of t.resourceRefs)requiredAssets.add(r.assetId);
  const assetIds=Object.keys(p.assetsById);if(assetIds.length!==requiredAssets.size||assetIds.some(id=>!requiredAssets.has(id)))fail('asset.extraOrMissing');
  for(const a of Object.values(p.assetsById))if(idOwners.has(a.id)||revisions.has(a.id))fail('asset.idCollision',[a.id]);
  memo?.finish();return p;
}
export function projectForCv(workspaceProject:ProjectSnapshot,cvId:string):ProjectSnapshot {
  const source=validateProject(workspaceProject);if(source.scope!=='workspace')fail('project.workspaceRequired');
  const cv=source.workspace.cvsById[cvId];if(!cv)fail('project.cvNotFound');
  const revisions=source.revisions.filter(r=>r.entityId===cvId);
  const entities=[cv,...revisions.map(r=>r.snapshot)];
  const keys=new Set(entities.filter(e=>e.kind==='cv').map(e=>templateKey(e.presentation.templateRef)));
  const templates=source.templates.filter(t=>keys.has(templateKey(t)));
  const assets=new Set<string>();entities.forEach(e=>referencedAssets(e).forEach(id=>assets.add(id)));templates.forEach(t=>t.resourceRefs.forEach(r=>assets.add(r.assetId)));
  return validateProject({scope:'cv',cv,revisions,assetsById:Object.fromEntries([...assets].map(id=>[id,source.assetsById[id]!])),templates});
}
