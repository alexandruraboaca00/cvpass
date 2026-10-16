import { z } from 'zod';
import { IdSchema, DocumentLocale, parse, fail, assertOrder, checkMap, assertDataTree } from './primitives.js';
import { MasterProfileSchema, CvDocumentSchema, AssetMapSchema, TemplateSchema, validateEntity } from './model.js';
import type { Entity, Asset, TemplateDefinition } from './model.js';
import { RevisionSchema, validateRevision } from './revisions.js';
import { referencedAssets, validateResources } from './assets.js';
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
export function validateProject(value:unknown):ProjectSnapshot {
  assertDataTree(value);const p=parse(ProjectSnapshotSchema,value);
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
  entities.forEach(e=>{validateEntity(e);unique(e);});
  const revisions=new Set<string>();
  const all=[...entities];
  for(const r of p.revisions){validateRevision(r);const owner=owners.get(r.entityId);
    if(!owner||owner.kind!==r.entityKind||r.number>owner.revision)fail('revision.invalidOwnerOrFuture');
    if(ids.has(r.id)||revisions.has(r.id))fail('revision.duplicateId');revisions.add(r.id);all.push(r.snapshot);
  }
  const keys=p.templates.map(templateKey);if(new Set(keys).size!==keys.length)fail('template.duplicate');
  const requiredTemplates=new Set(all.filter(e=>e.kind==='cv').map(e=>templateKey(e.presentation.templateRef)));
  if(keys.length!==requiredTemplates.size||keys.some(k=>!requiredTemplates.has(k)))fail('template.extraOrMissing');
  const requiredAssets=new Set<string>();
  for(const e of all){validateResources(e,p.assetsById,p.templates);referencedAssets(e).forEach(id=>requiredAssets.add(id));}
  for(const t of p.templates)for(const r of t.resourceRefs)requiredAssets.add(r.assetId);
  const assetIds=Object.keys(p.assetsById);if(assetIds.length!==requiredAssets.size||assetIds.some(id=>!requiredAssets.has(id)))fail('asset.extraOrMissing');
  for(const a of Object.values(p.assetsById))if(ids.has(a.id)||revisions.has(a.id))fail('asset.idCollision',[a.id]);
  return p;
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
