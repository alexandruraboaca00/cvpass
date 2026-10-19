import { BrowserWindow, protocol, session } from 'electron';
import { Worker } from 'node:worker_threads';
import { simpleHtml } from './simple.js';
import { lateralHtml, paginateLateral } from './lateral.js';
import { assertFontCoverage } from './font-coverage.js';
import { builtinTemplate, renderFail, throwIfAborted } from '../../application/render-contract.js';
import type { PdfArtifact, PdfRenderPort, RenderSnapshot } from '../../application/render-contract.js';

// Register once, before app.whenReady(). Content is held in memory, never a user-supplied URL.
protocol.registerSchemesAsPrivileged([{scheme:'cvforge-render',privileges:{standard:true,secure:true}}]);
export class ChromiumPdfRenderer implements PdfRenderPort {
  private tail:Promise<unknown>=Promise.resolve();
  private jobs=new Map<string,string>();
  private readonly isolated=session.fromPartition('cvforge-pdf-memory');
  constructor(){
    this.isolated.setPermissionRequestHandler((_w,_p,cb)=>cb(false));
    this.isolated.webRequest.onBeforeRequest((details,cb)=>cb({cancel:!['cvforge-render:','data:'].includes(new URL(details.url).protocol)}));
    this.isolated.protocol.handle('cvforge-render',request=>{
      const html=this.jobs.get(request.url);return html?new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}}):new Response('',{status:404});
    });
  }
  render(snapshot:RenderSnapshot,signal:AbortSignal):Promise<PdfArtifact>{
    const result=this.tail.then(()=>this.perform(snapshot,signal));this.tail=result.catch(()=>{});return result;
  }
  private async perform(snapshot:RenderSnapshot,signal:AbortSignal):Promise<PdfArtifact>{
    throwIfAborted(signal);assertFontCoverage(snapshot);
    builtinTemplate(snapshot.projection.presentation.templateRef.id,snapshot.projection.presentation.templateRef.version);
    if(snapshot.engineVersion!==process.versions.chrome)renderFail('RENDER_ENGINE_MISMATCH');
    const lateral=snapshot.projection.presentation.templateRef.id==='lateral';
    if(snapshot.rendererVersion!==(lateral?'lateral-1':'simple-1'))renderFail('RENDER_TEMPLATE_UNSUPPORTED');
    const url=`cvforge-render://snapshot/${snapshot.id}`,html=lateral?lateralHtml(snapshot):simpleHtml(snapshot);this.jobs.set(url,html);
    const win=new BrowserWindow({show:false,width:900,height:1000,webPreferences:{session:this.isolated,sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,backgroundThrottling:false}});
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
    const stop=()=>{if(!win.isDestroyed())win.destroy();};signal.addEventListener('abort',stop,{once:true});
    const timeout=setTimeout(stop,60_000);
    try {
      await win.loadURL(url);throwIfAborted(signal);
      const layout=await win.webContents.executeJavaScript(`(async()=>{
        await Promise.all(['normal 400','normal 700','italic 400','italic 700'].map(face=>document.fonts.load(face+' 10pt CVForgeSans','áñăâîșț')));
        await document.fonts.ready;
        await Promise.all([...document.images].map(i=>i.decode()));
        if(!document.fonts.check('10pt CVForgeSans'))throw Error('FONT');
        const pageHeight=261/25.4*96;
        for(const el of document.querySelectorAll('.entry'))if(el.getBoundingClientRect().height<pageHeight*0.45)el.classList.add('compact');
        const bounds=document.querySelector('main').getBoundingClientRect();
        const overflow=[...document.querySelectorAll('main *')].some(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left<bounds.left-1||r.right>bounds.right+1)});
        return {overflow,fonts:document.fonts.size};
      })()` ) as {overflow:boolean;fonts:number};
      if(layout.overflow)renderFail('RENDER_HORIZONTAL_OVERFLOW');if(layout.fonts!==4)renderFail('RENDER_FONTS_FAILED');
      if(lateral){const result=await win.webContents.executeJavaScript(`(${paginateLateral.toString()})()`);if(result.overflow)renderFail('RENDER_LAYOUT_OVERFLOW');}
      throwIfAborted(signal);
      const raw=await win.webContents.printToPDF({pageSize:'A4',preferCSSPageSize:true,printBackground:true,generateTaggedPDF:true,generateDocumentOutline:true,
        displayHeaderFooter:false});
      throwIfAborted(signal);
      return await finalize(raw,snapshot,signal);
    }catch(error){throwIfAborted(signal);if(error instanceof Error&&'code'in error)throw error;return renderFail('RENDER_CHROMIUM_FAILED');}
    finally{clearTimeout(timeout);signal.removeEventListener('abort',stop);stop();this.jobs.delete(url);}
  }
}
function finalize(bytes:Uint8Array,snapshot:RenderSnapshot,signal:AbortSignal):Promise<PdfArtifact>{
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./finalize-worker.js',import.meta.url),{workerData:{bytes,projection:snapshot.projection}});
    const fail=()=>reject(Object.assign(new Error('RENDER_CANCELLED'),{code:'RENDER_CANCELLED'}));
    const cancel=()=>{void worker.terminate();fail();};signal.addEventListener('abort',cancel,{once:true});
    const timeout=setTimeout(()=>{void worker.terminate();reject(Object.assign(new Error('RENDER_FINALIZATION_TIMEOUT'),{code:'RENDER_FINALIZATION_TIMEOUT'}));},30_000);
    const done=()=>{clearTimeout(timeout);signal.removeEventListener('abort',cancel);};
    worker.once('message',(result:PdfArtifact&{error?:string})=>{done();if(result.error)reject(Object.assign(new Error(result.error),{code:result.error}));else resolve(result);});
    worker.once('error',()=>{done();reject(Object.assign(new Error('RENDER_FINALIZATION_FAILED'),{code:'RENDER_FINALIZATION_FAILED'}));});
    worker.once('exit',code=>{done();if(code!==0)reject(Object.assign(new Error('RENDER_WORKER_EXIT'),{code:'RENDER_WORKER_EXIT'}));});
    if(signal.aborted)cancel();
  });
}
