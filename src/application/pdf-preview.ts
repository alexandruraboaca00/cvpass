import { renderFail } from './render-contract.js';
import type { Digest, DomainContext, PdfDestination, PdfGeneration, PdfRenderPort, RenderSource } from './render-contract.js';
import type { RenderSnapshotFactory } from './render-snapshot.js';
import { visiblePdfName } from './pdf-title.js';
import type { ExportRecord, ExportRecordRepository } from './export-record.js';
function linkKey(value:string):string|null {
  try{const url=new URL(value);return ['http:','https:','mailto:','tel:'].includes(url.protocol)?url.href:null;}catch{return null;}
}

// Generation tokens are assigned before any await. Aborted or stale completions never publish.
export class PdfPreviewService {
  private token=0;
  private controller:AbortController|undefined;
  private ready:PdfGeneration|undefined;
  private fileName='CVPass.pdf';
  private links=new Set<string>();
  private exportMetadata:Omit<ExportRecord,'id'|'exportedAt'|'sha256'|'byteLength'|'pageCount'>|undefined;
  constructor(private readonly snapshots:Pick<RenderSnapshotFactory,'capture'>,private readonly source:RenderSource,private readonly renderer:PdfRenderPort,private readonly destination:PdfDestination,private readonly digest:Digest,private readonly ctx:DomainContext,private readonly records?:ExportRecordRepository){}
  invalidate():void {this.token++;this.controller?.abort();this.ready=undefined;this.links.clear();}
  canOpenLink(url:string):boolean{const key=linkKey(url);return key!==null&&this.links.has(key);}
  async generate(cvId:string,revision:number):Promise<PdfGeneration>{
    this.invalidate();const token=this.token,controller=new AbortController();this.controller=controller;
    const started=performance.now(),snapshot=await this.snapshots.capture(cvId,revision,controller.signal);
    const artifact=await this.renderer.render(snapshot,controller.signal);
    if(token!==this.token||controller.signal.aborted)renderFail('RENDER_OBSOLETE');
    const current=(await this.source.snapshot()).content.workspace.cvsById[cvId];
    if(token!==this.token||current?.revision!==revision)renderFail('RENDER_OBSOLETE');
    const bytes=new Uint8Array(artifact.bytes);
    this.ready={id:this.ctx.newId(),cvId,revision,fingerprint:snapshot.fingerprint,sha256:this.digest(bytes),bytes,metrics:{snapshotToPdfMs:performance.now()-started,pdfBytes:bytes.length,pageCount:artifact.pageCount}};
    this.exportMetadata={recordVersion:1,cvId,revision,templateRef:snapshot.projection.presentation.templateRef as ExportRecord['templateRef'],rendererVersion:snapshot.rendererVersion,engineVersion:snapshot.engineVersion,presentation:structuredClone(snapshot.projection.presentation),projectionDigest:snapshot.projectionDigest,compositionDigest:snapshot.fingerprint,structuralPolicy:'visible-export-v1'};
    this.links.clear();
    const visit=(value:unknown):void=>{if(typeof value==='string'){const key=linkKey(value)??(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?linkKey('mailto:'+value):null);if(key)this.links.add(key);}else if(value&&typeof value==='object')Object.values(value).forEach(visit);};visit(snapshot.projection);
    this.fileName=visiblePdfName(snapshot.projection);return structuredClone(this.ready);
  }
  async export(id:string,digest:string):Promise<{cancelled:boolean;sha256?:string;byteLength?:number;revision?:number}>{
    const ready=this.ready??renderFail('RENDER_OBSOLETE'),name=this.fileName,metadata=structuredClone(this.exportMetadata);
    if(ready.id!==id||ready.sha256!==digest)renderFail('RENDER_OBSOLETE');
    const current=(await this.source.snapshot()).content.workspace.cvsById[ready.cvId];
    if(current?.revision!==ready.revision)renderFail('RENDER_OBSOLETE');
    // Capture before the native dialog. A later generation cannot replace the chosen bytes.
    const bytes=new Uint8Array(ready.bytes),path=await this.destination.choose(name);
    if(!path)return {cancelled:true};
    const receipt=await this.destination.write(path,bytes);
    if(receipt.sha256!==ready.sha256||receipt.byteLength!==bytes.length)renderFail('RENDER_EXPORT_INTEGRITY');
    if(this.records){
      const savedMetadata=metadata??renderFail('EXPORT_RECORD_MISSING');
      try{await this.records.appendExport({...savedMetadata,id:this.ctx.newId(),exportedAt:this.ctx.now(),sha256:ready.sha256,byteLength:bytes.length,pageCount:ready.metrics.pageCount});}
      catch{renderFail('EXPORT_FILE_WRITTEN_RECORD_FAILED');}
    }
    return {cancelled:false,...receipt,revision:ready.revision};
  }
}
