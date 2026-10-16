import { parse, checkMap, fail } from './primitives.js';
import { AssetMapSchema, validateEntity, TemplateSchema } from './model.js';
import type { Entity, Asset, TemplateDefinition } from './model.js';
export function referencedAssets(entity:Entity):Set<string> {
  const ids=new Set<string>();if(entity.personalInformation.photo)ids.add(entity.personalInformation.photo.assetId);return ids;
}
export function validateResources(entity:Entity,assets:Record<string,Asset>,templates:TemplateDefinition[]=[]):void {
  const e=validateEntity(entity);parse(AssetMapSchema,assets);checkMap(assets,['assetsById']);
  for(const id of referencedAssets(e)) {
    const a=assets[id];if(!a||a.role!=='photo')fail('asset.missingPhoto',[id]);
  }
  for(const t of templates) {
    parse(TemplateSchema,t);
    for(const r of t.resourceRefs)if(!assets[r.assetId]||assets[r.assetId]!.role!=='templateResource')fail('asset.missingTemplateResource',[r.assetId]);
  }
  if(e.kind==='cv') {
    const t=templates.find(t=>t.id===e.presentation.templateRef.id&&t.version===e.presentation.templateRef.version);
    if(!t)fail('template.missing');
    for(const s of Object.values(e.sectionsById))if(s.included&&!t.capabilities.includes(s.kind))fail('template.unsupportedSection',[s.id]);
  }
}
