import { renderFail } from './render-contract.js';
import type { Digest, DomainContext, PdfDestination, PdfGeneration, PdfRenderPort, RenderSource } from './render-contract.js';
import type { RenderSnapshotFactory } from './render-snapshot.js';
import { visiblePdfName } from './pdf-title.js';

// Generation tokens are assigned before any await. Aborted or stale completions never publish.
export class PdfPreviewService {
  private token=0;
  private controller:AbortController|undefined;
  private ready:PdfGeneration|undefined;
  private fileName='CVForge.pdf';
  private links=new Set<string>();
  constructor(private readonly snapshots:Pick<RenderSnapshotFactory,'capture'>,private readonly source:RenderSource,private readonly renderer:PdfRenderPort,private readonly destination:PdfDestination,private readonly digest:Digest,private readonly ctx:DomainContext){}
  invalidate():void {this.token++;this.controller?.abort();this.ready=undefined;this.links.clear();}
  canOpenLink(url:string):boolean{return this.links.has(url)&&/^(https?:|mailto:|tel:)/i.test(url);}
  async generate(cvId:string,revision:number):Promise<PdfGeneration>{
    this.invalidate();const token=this.token,controller=new AbortController();this.controller=controller;
    const started=performance.now(),snapshot=await this.snapshots.capture(cvId,revision,controller.signal);
    const artifact=await this.renderer.render(snapshot,controller.signal);
    if(token!==this.token||controller.signal.aborted)renderFail('RENDER_OBSOLETE');
    const current=(await this.source.snapshot()).content.workspace.cvsById[cvId];
    if(token!==this.token||current?.revision!==revision)renderFail('RENDER_OBSOLETE');
    const bytes=new Uint8Array(artifact.bytes);
    this.ready={id:this.ctx.newId(),cvId,revision,fingerprint:snapshot.fingerprint,sha256:this.digest(bytes),bytes,metrics:{snapshotToPdfMs:performance.now()-started,pdfBytes:bytes.length,pageCount:artifact.pageCount}};
    this.links.clear();
    const visit=(value:unknown):void=>{if(typeof value==='string'){if(/^(https?:|mailto:|tel:)/i.test(value))this.links.add(value);else if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))this.links.add('mailto:'+value);}else if(value&&typeof value==='object')Object.values(value).forEach(visit);};visit(snapshot.projection);
    this.fileName=visiblePdfName(snapshot.projection);return structuredClone(this.ready);
  }
  async export(id:string,digest:string):Promise<{cancelled:boolean;sha256?:string;byteLength?:number;revision?:number}>{
    const ready=this.ready??renderFail('RENDER_OBSOLETE'),name=this.fileName;
    if(ready.id!==id||ready.sha256!==digest)renderFail('RENDER_OBSOLETE');
    const current=(await this.source.snapshot()).content.workspace.cvsById[ready.cvId];
    if(current?.revision!==ready.revision)renderFail('RENDER_OBSOLETE');
    // Capture before the native dialog. A later generation cannot replace the chosen bytes.
    const bytes=new Uint8Array(ready.bytes),path=await this.destination.choose(name);
    if(!path)return {cancelled:true};
    const receipt=await this.destination.write(path,bytes);
    if(receipt.sha256!==ready.sha256||receipt.byteLength!==bytes.length)renderFail('RENDER_EXPORT_INTEGRITY');
    return {cancelled:false,...receipt,revision:ready.revision};
  }
}
