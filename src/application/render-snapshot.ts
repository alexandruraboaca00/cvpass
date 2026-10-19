import { canonical, createExportProjection, validateCv, validateResources } from '../domain/index.js';
import type { ExportImage } from '../domain/index.js';
import { builtinTemplate, renderFail, throwIfAborted } from './render-contract.js';
import type { BuiltinResources, Digest, DomainContext, ImageNormalizer, RenderSnapshot, RenderSource } from './render-contract.js';
const bytes=(value:unknown)=>new TextEncoder().encode(canonical(value));
export function freeze<T>(value:T):T {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;
}
export class RenderSnapshotFactory {
  constructor(private readonly source:RenderSource,private readonly loadResources:()=>Promise<BuiltinResources>,private readonly images:ImageNormalizer,private readonly digest:Digest,private readonly ctx:DomainContext,private readonly engineVersion:string){}
  async capture(cvId:string,expectedRevision:number,signal?:AbortSignal):Promise<RenderSnapshot>{
    throwIfAborted(signal);
    const record=await this.source.snapshot(),cv=validateCv(structuredClone(record.content.workspace.cvsById[cvId]??renderFail('RENDER_CV_NOT_FOUND')));
    if(cv.revision!==expectedRevision)renderFail('REVISION_CONFLICT');
    const template=builtinTemplate(cv.presentation.templateRef.id,cv.presentation.templateRef.version);
    if(cv.presentation.fontFamily!=='Liberation Sans')renderFail('RENDER_FONT_UNSUPPORTED');
    validateResources(cv,record.content.assetsById,record.content.templates);
    // Copy all bytes needed before awaiting preparation; later edits cannot alter this render.
    const placement=cv.personalInformation.photo?.visible?structuredClone(cv.personalInformation.photo):null;
    const asset=placement?structuredClone(record.content.assetsById[placement.assetId]!):null;
    const imageBytes=asset?new Uint8Array(record.content.blobs.get(asset.sha256)??renderFail('RENDER_ASSET_MISSING')):null;
    const storedAssets=Object.fromEntries(template.resourceRefs.map(r=>[r.assetId,structuredClone(record.content.assetsById[r.assetId])])),storedResources=new Map(template.resourceRefs.flatMap(r=>{const a=record.content.assetsById[r.assetId],b=a?record.content.blobs.get(a.sha256):null;return a&&b?[[a.sha256,new Uint8Array(b)] as const]:[];}));
    const catalog=await this.loadResources();throwIfAborted(signal);
    const selected=record.content.templates.find(t=>t.id===template.id&&t.version===template.version)!;
    if(canonical(selected)!==canonical(template))renderFail('RENDER_TEMPLATE_RESOURCE_MISMATCH');
    for(const ref of catalog.template.resourceRefs){
      const expected=catalog.resources.assetsById[ref.assetId]!,stored=storedAssets[ref.assetId],blob=stored?storedResources.get(stored.sha256):null;
      if(!stored||canonical(stored)!==canonical(expected)||!blob||this.digest(blob)!==expected.sha256)renderFail('RENDER_TEMPLATE_RESOURCE_MISMATCH');
    }
    let photo:ExportImage|undefined;
    if(placement)photo=await this.images.normalize(asset!,imageBytes!,placement,signal);
    throwIfAborted(signal);
    const projection=createExportProjection(cv,photo?()=>structuredClone(photo):undefined),projectionDigest=this.digest(bytes(projection));
    const rendererVersion=template.id==='simple'?'simple-1' as const:'lateral-1' as const;
    const identity={projectionDigest,rendererVersion,engineVersion:this.engineVersion,resourceVersion:catalog.resourceVersion,fontDigests:catalog.fonts.map(f=>f.sha256)};
    return freeze({id:this.ctx.newId(),cvId:cv.id,revision:cv.revision,capturedAt:this.ctx.now(),fingerprint:this.digest(bytes(identity)),projectionDigest,rendererVersion,engineVersion:this.engineVersion,resourceVersion:catalog.resourceVersion,projection,fonts:structuredClone(catalog.fonts)});
  }
}
