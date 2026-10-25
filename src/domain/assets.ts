import { parse, checkMap, fail } from './primitives.js';
import { AssetMapSchema, validateEntity, TemplateSchema } from './model.js';
import type { Entity, Asset, TemplateDefinition } from './model.js';
export function referencedAssets(entity:Entity):Set<string> {
  const ids=new Set<string>();if(entity.personalInformation.photo)ids.add(entity.personalInformation.photo.assetId);
  if(entity.kind==='cv')for(const record of entity.importRecords??[])if(record.source.assetId)ids.add(record.source.assetId);
  return ids;
}
export function validateResources(entity:Entity,assets:Record<string,Asset>,templates:TemplateDefinition[]=[]):void {
  const e=validateEntity(entity);parse(AssetMapSchema,assets);checkMap(assets,['assetsById']);
  templates.forEach(t=>parse(TemplateSchema,t));
  assertResourceReferences(e,assets,templates);
}
// Internal: schema/graph and entity invariants have already been checked.
export function assertResourceReferences(e:Entity,assets:Record<string,Asset>,templates:TemplateDefinition[]):void {
  if(e.personalInformation.photo){const id=e.personalInformation.photo.assetId;if(!assets[id]||assets[id]!.role!=='photo')fail('asset.missingPhoto',[id]);}
  if(e.kind==='cv')for(const record of e.importRecords??[])if(record.source.assetId){
    const a=assets[record.source.assetId];if(!a||a.role!=='source'||a.sha256!==record.source.sha256||a.byteLength!==record.source.byteLength)fail('asset.missingImportSource');
  }
  for(const t of templates) {
    for(const r of t.resourceRefs)if(!assets[r.assetId]||assets[r.assetId]!.role!=='templateResource')fail('asset.missingTemplateResource',[r.assetId]);
  }
  if(e.kind==='cv') {
    const t=templates.find(t=>t.id===e.presentation.templateRef.id&&t.version===e.presentation.templateRef.version);
    if(!t)fail('template.missing');
    for(const s of Object.values(e.sectionsById))if(s.included&&!t.capabilities.includes(s.kind))fail('template.unsupportedSection',[s.id]);
  }
}
