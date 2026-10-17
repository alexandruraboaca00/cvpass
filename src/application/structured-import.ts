import { z } from 'zod';
import { AssetSchema, ImportRecordSchema, IdSchema, assertDataTree, canonical, checkpoint, parse, referencedAssets, templateKey, validateProject } from '../domain/index.js';
import type { Asset, DomainContext, ImportRecord } from '../domain/index.js';
import type { BackupReceipt } from './contracts.js';
import type { LibraryService } from './library.js';
import type { ImportAnalysis, ImportCandidate, ImportDraft, StructuredImportPort } from './import-contract.js';
import { importFail } from './import-contract.js';
import { validateImportDraft } from './import-draft.js';
import type { PhotoView } from './editor.js';

export type ImportReviewInput=Pick<ImportDraft,'cv'|'rawDates'|'rawNumbers'|'documentLocale'>&{acknowledgeIssues:boolean};
export interface ImportView {
  id:string;source:ImportAnalysis['source'];detected:ImportAnalysis['detected'];code:string|null;
  candidates:{key:string;format:ImportCandidate['format'];attachmentName:string|null;status:ImportCandidate['status'];code:string|null;sha256:string;summary:{displayName:string;documentLocale:string|null;entries:number}|null}[];
  selectedKey:string|null;selectionReason:ImportRecord['candidate']['selectionReason']|null;
  draft:ImportDraft|null;photo:PhotoView|null;
  workspace:{profileName:string|null;cvs:{name:string;documentLocale:string}[]}|null;
}
interface ActiveImport {
  id:string;bytes:Uint8Array;controller:AbortController;analysis:ImportAnalysis|null;selectedKey:string|null;
  selectionReason:ImportRecord['candidate']['selectionReason']|null;stagedAssets:Record<string,Asset>;stagedBlobs:Map<string,Uint8Array>;confirming:boolean;
}
const valueAt=(object:unknown,path:string[]):unknown=>path.reduce<unknown>((value,key)=>value&&typeof value==='object'&&Object.hasOwn(value,key)?(value as Record<string,unknown>)[key]:undefined,object);
const ReviewShape=z.strictObject({cv:z.custom<ImportDraft['cv']>(v=>!!v&&typeof v==='object'&&!Array.isArray(v)),rawDates:z.record(z.string().max(500),z.string().max(1000)),rawNumbers:z.record(z.string().max(500),z.string().max(1000)),documentLocale:z.enum(['es','en']).nullable(),acknowledgeIssues:z.boolean()});
export class StructuredImportService {
  private active:ActiveImport|null=null;
  constructor(private readonly library:LibraryService,private readonly port:StructuredImportPort,private readonly ctx:DomainContext){}
  async begin(id:string,bytes:Uint8Array,fileName:string):Promise<ImportView>{
    parse(IdSchema,id);if(this.active)importFail('IMPORT_ALREADY_OPEN');
    const active:ActiveImport={id,bytes:new Uint8Array(bytes),controller:new AbortController(),analysis:null,selectedKey:null,selectionReason:null,stagedAssets:{},stagedBlobs:new Map(),confirming:false};
    this.active=active;
    try{
      const analysis=await this.port.analyze(active.bytes,fileName,active.controller.signal);
      if(this.active!==active||active.controller.signal.aborted)importFail('IMPORT_CANCELLED');
      active.analysis=analysis;active.selectedKey=analysis.selectedKey;active.selectionReason=analysis.selectionReason;
      return this.view(active);
    }catch(error){if(this.active===active)this.active=null;throw error;}
  }
  cancel(id?:string):void{
    const active=this.active;if(!active||(id&&active.id!==id))return;
    if(active.confirming)importFail('IMPORT_CONFIRM_IN_PROGRESS');
    active.controller.abort();this.active=null;
  }
  isOpen():boolean{return this.active!==null;}
  private session(id:string):ActiveImport{const active=this.active;if(!active||active.id!==id)importFail('IMPORT_SESSION_NOT_FOUND');if(!active.analysis)importFail('IMPORT_ANALYZING');if(active.confirming)importFail('IMPORT_CONFIRM_IN_PROGRESS');return active;}
  private candidate(active:ActiveImport):ImportCandidate{
    return active.analysis!.candidates.find(c=>c.key===active.selectedKey&&c.project!==null)??importFail('IMPORT_CANDIDATE_REQUIRED');
  }
  select(id:string,key:string):ImportView{
    const active=this.session(id);if(!active.analysis!.candidates.some(c=>c.key===key&&c.project))importFail('IMPORT_CANDIDATE_INVALID');
    active.selectedKey=key;active.selectionReason='explicit';active.stagedAssets={};active.stagedBlobs.clear();return this.view(active);
  }
  stagePhoto(id:string,asset:Asset,bytes:Uint8Array):{assetId:string;photo:PhotoView}{
    const active=this.session(id);this.candidate(active);parse(AssetSchema,asset);
    if(asset.role!=='photo')importFail('IMPORT_PHOTO_INVALID');
    active.stagedAssets[asset.id]=asset;active.stagedBlobs.set(asset.sha256,new Uint8Array(bytes));
    return {assetId:asset.id,photo:{mediaType:asset.mediaType,bytes:new Uint8Array(bytes),dimensions:asset.dimensions!,crop:{x:0,y:0,width:1,height:1}}};
  }
  async confirm(id:string,input:ImportReviewInput):Promise<{cvId:string}>{
    const active=this.session(id),candidate=this.candidate(active),base=candidate.draft,project=candidate.project!;
    if(!base||project.snapshot.scope!=='cv')importFail('IMPORT_CV_REQUIRED');
    assertDataTree(input);if(canonical(input).length>10*1024*1024)importFail('IMPORT_REVIEW_LIMIT');
    if(!ReviewShape.safeParse(input).success)importFail('IMPORT_REVIEW_INVALID');
    if(input.cv.id!==base.cv.id||input.cv.revision!==base.cv.revision||input.cv.createdAt!==base.cv.createdAt||input.cv.updatedAt!==base.cv.updatedAt||canonical(input.cv.importRecords??[])!==canonical(base.cv.importRecords??[]))importFail('IMPORT_IDENTITY_CHANGED');
    if(base.issues.some(i=>i.resolution==='pending')&&input.acknowledgeIssues!==true)importFail('IMPORT_ISSUES_REQUIRE_REVIEW');
    const cv=validateImportDraft(input),snapshot=structuredClone(project.snapshot),resources={...snapshot.assetsById,...active.stagedAssets},blobs=new Map([...project.blobs,...active.stagedBlobs]);
    const native=candidate.format==='cvproj',original=native?checkpoint(snapshot.cv,this.ctx,'import'):null;if(original)original.retention='pinned';
    const source=active.analysis!.source;
    let sourceAsset:Asset|null=null;
    if(candidate.format!=='cvproj'){
      sourceAsset=parse(AssetSchema,{id:this.ctx.newId(),sha256:source.sha256,mediaType:candidate.format==='europassXml'?'application/xml':'application/pdf',role:'source',byteLength:source.byteLength,dimensions:null});
      resources[sourceAsset.id]=sourceAsset;blobs.set(sourceAsset.sha256,new Uint8Array(active.bytes));
    }
    const record=parse(ImportRecordSchema,{recordVersion:1,id:this.ctx.newId(),format:candidate.format,adapterVersion:candidate.format==='cvproj'?'cvproj-v1':candidate.format==='cvforgePdf'?'cvforge-payload-v1':'europass-candidate4-v1',importedAt:this.ctx.now(),
      source:{...source,assetId:sourceAsset?.id??null},candidate:{key:candidate.key,attachmentName:candidate.attachmentName,sha256:candidate.sha256,selectionReason:active.selectionReason!},localeEvidence:base.localeEvidence,
      mappings:base.mappings,issues:base.issues.map(i=>({...i,resolution:i.resolution==='informational'?'informational':i.targetPath.length&&valueAt(cv,i.targetPath)!==undefined&&JSON.stringify(valueAt(cv,i.targetPath))!==JSON.stringify(valueAt(base.cv,i.targetPath))?'corrected':'excluded'}))});
    // Old native snapshots remain recoverable; accepting corrections/provenance is a new revision.
    snapshot.cv={...cv,revision:native?cv.revision+1:0,updatedAt:this.ctx.now(),importRecords:[...(cv.importRecords??[]).map(r=>({...r,issues:r.issues.map(i=>i.resolution==='pending'?{...i,resolution:'excluded' as const}:i)})),record]};
    if(original)snapshot.revisions.push(original);
    const all=[snapshot.cv,...snapshot.revisions.map(r=>r.snapshot)],keys=new Set(all.filter(e=>e.kind==='cv').map(e=>templateKey(e.presentation.templateRef)));
    snapshot.templates=snapshot.templates.filter(t=>keys.has(templateKey(t)));
    const needed=new Set<string>();all.forEach(e=>referencedAssets(e).forEach(id=>needed.add(id)));snapshot.templates.forEach(t=>t.resourceRefs.forEach(r=>needed.add(r.assetId)));
    snapshot.assetsById=Object.fromEntries([...needed].map(id=>[id,resources[id]??importFail('IMPORT_ASSET_REFERENCE_INVALID')]));
    const hashes=new Set(Object.values(snapshot.assetsById).map(a=>a.sha256)),selectedBlobs=new Map([...hashes].map(hash=>[hash,blobs.get(hash)??importFail('IMPORT_ASSET_REFERENCE_INVALID')]));
    validateProject(snapshot);
    active.confirming=true;
    try{const imported=await this.library.addImportedCv({snapshot,blobs:selectedBlobs});this.active=null;return {cvId:imported.id};}
    finally{active.confirming=false;}
  }
  async confirmWorkspace(id:string,mode:'emptyWorkspace'|'replaceWorkspace',confirmReplace=false):Promise<{backup?:BackupReceipt}>{
    const active=this.session(id),candidate=this.candidate(active);if(candidate.format!=='cvproj'||candidate.project?.snapshot.scope!=='workspace')importFail('IMPORT_WORKSPACE_REQUIRED');
    if(!['emptyWorkspace','replaceWorkspace'].includes(mode))importFail('IMPORT_MODE_INVALID');
    active.confirming=true;
    try{const result=await this.library.restoreImportedWorkspace(candidate.project,{mode,...(confirmReplace?{confirmReplace:true as const}:{})});this.active=null;return result;}
    finally{active.confirming=false;}
  }
  private view(active:ActiveImport):ImportView{
    const analysis=active.analysis!,candidate=analysis.candidates.find(c=>c.key===active.selectedKey),snapshot=candidate?.project?.snapshot;
    let photo:PhotoView|null=null;
    if(snapshot?.scope==='cv'&&snapshot.cv.personalInformation.photo){const placement=snapshot.cv.personalInformation.photo,asset=snapshot.assetsById[placement.assetId]!,bytes=candidate!.project!.blobs.get(asset.sha256)!;photo={mediaType:asset.mediaType,bytes:new Uint8Array(bytes),dimensions:asset.dimensions!,crop:placement.crop};}
    return {id:active.id,source:analysis.source,detected:analysis.detected,code:analysis.code,candidates:analysis.candidates.map(({key,format,attachmentName,status,code,sha256,draft})=>({key,format,attachmentName,status,code,sha256,summary:draft?{displayName:draft.cv.personalInformation.displayName,documentLocale:draft.documentLocale,entries:Object.values(draft.cv.sectionsById).reduce((n,s)=>n+Object.keys(s.entriesById).length,0)}:null})),selectedKey:active.selectedKey,selectionReason:active.selectionReason,
      draft:candidate?.draft?structuredClone(candidate.draft):null,photo,workspace:snapshot?.scope==='workspace'?{profileName:snapshot.workspace.profile?.personalInformation.displayName??null,cvs:snapshot.workspace.cvOrder.map(id=>{const cv=snapshot.workspace.cvsById[id]!;return {name:cv.name,documentLocale:cv.documentLocale};})}:null};
  }
}
