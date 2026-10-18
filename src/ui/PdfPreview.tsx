import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import type { CvDocument } from '../domain/index.js';
import type { PdfGeneration, PresentationInput } from '../application/render-contract.js';
import type { EditorDocumentView } from '../application/editor.js';
import { useMessages } from './i18n.js';
import { Modal } from './Modal.js';
GlobalWorkerOptions.workerSrc=workerUrl;
const api=window.cvforge;
export function PresentationDialog({cv,onSaved,onCancel}:{cv:CvDocument;onSaved:(v:EditorDocumentView)=>void;onCancel:()=>void}){
  const {t}=useMessages(),[input,setInput]=useState<PresentationInput>(()=>{const {density,accentColor,numbering,datePrecision,showCefrGuide}=cv.presentation;return {density,accentColor,numbering,datePrecision,showCefrGuide,fontFamily:'Liberation Sans'};}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return <Modal title={t('Presentación Simple')} onCancel={()=>{if(!busy)onCancel();}}><form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void api.presentation(cv.id,cv.revision,input).then(result=>{if(result.ok)onSaved(result.value);else setError(result.error.code);}).finally(()=>setBusy(false));}}>
    <p>{t('Simple v1 · Una columna · Liberation Sans local')}</p><fieldset disabled={busy}>
      <label>{t('Densidad')}<select aria-label={t('Densidad')} value={input.density} onChange={e=>setInput({...input,density:e.target.value as PresentationInput['density']})}><option value="compact">{t('Compacta')}</option><option value="normal">{t('Normal')}</option><option value="spacious">{t('Espaciosa')}</option></select></label>
      <label>{t('Color de acento')}<input type="color" value={input.accentColor} onChange={e=>setInput({...input,accentColor:e.target.value})}/></label>
      <label>{t('Precisión máxima de fechas')}<select aria-label={t('Precisión máxima de fechas')} value={input.datePrecision} onChange={e=>setInput({...input,datePrecision:e.target.value as PresentationInput['datePrecision']})}><option value="year">{t('Solo año')}</option><option value="month">{t('Mes y año')}</option><option value="day">{t('Fecha completa si existe')}</option></select></label>
      <label><input type="checkbox" checked={input.numbering} onChange={e=>setInput({...input,numbering:e.target.checked})}/>{t('Numerar páginas')}</label>
      <label><input type="checkbox" checked={input.showCefrGuide} onChange={e=>setInput({...input,showCefrGuide:e.target.checked})}/>{t('Mostrar guía CEFR')}</label>
    </fieldset>{error&&<p role="alert">{t('No se pudo generar o guardar ({code}). El CV confirmado se conserva.',{code:error})}</p>}
    <footer className="form-actions"><button type="button" disabled={busy} onClick={onCancel}>{t('Cancelar')}</button><button type="submit" disabled={busy}>{t('Confirmar')}</button></footer>
  </form></Modal>;
}
export function PdfPreview({cv}:{cv:CvDocument}){
  const {t}=useMessages(),[generation,setGeneration]=useState<PdfGeneration|null>(null),[state,setState]=useState<'empty'|'generating'|'ready'|'stale'|'error'>('empty'),[error,setError]=useState(''),[retry,setRetry]=useState(0),[receipt,setReceipt]=useState(''),[exporting,setExporting]=useState(false),[viewMs,setViewMs]=useState<number|null>(null);
  const token=useRef(0),started=useRef(0);
  useEffect(()=>{
    const request=++token.current;started.current=performance.now();setState(previous=>previous==='empty'?'empty':'stale');setError('');setReceipt('');setViewMs(null);
    const timer=setTimeout(()=>{setState('generating');void api.pdfGenerate(cv.id,cv.revision).then(result=>{
      if(request!==token.current)return;
      if(result.ok){setGeneration(result.value);}else if(!['RENDER_CANCELLED','RENDER_OBSOLETE'].includes(result.error.code)){setError(result.error.code);setState('error');}
    }).catch(()=>{if(request===token.current){setError('PREVIEW_CONNECTION_FAILED');setState('error');}});},400);
    return()=>{clearTimeout(timer);token.current++;void api.pdfCancel();};
  },[cv.id,cv.revision,retry]);
  const current=generation?.cvId===cv.id?generation:null,ready=state==='ready'&&current?.revision===cv.revision;
  return <section className="pdf-preview section-card" aria-label={t('Vista previa PDF')} data-state={state} data-sha256={current?.sha256} data-generation-id={current?.id} data-revision={current?.revision} data-preview-ms={viewMs===null?undefined:Math.round(viewMs)} data-pdf-bytes={current?.metrics.pdfBytes} data-pdf-ms={current?.metrics.snapshotToPdfMs} data-page-count={current?.metrics.pageCount}>
    <h2>{t('Vista previa PDF')}</h2><p role="status">{t(({empty:'Sin preview todavía',generating:'Generando PDF…',ready:'Preview lista',stale:'Preview desactualizada',error:'Error de preview'})[state])}</p>
    {error&&<p role="alert">{t('No se pudo generar o guardar ({code}). El CV confirmado se conserva.',{code:error})}</p>}
    {cv.presentation.templateRef.id!=='simple'&&<p>{t('Selecciona Simple en Presentación para generar este CV.')}</p>}
    <div className="actions"><button onClick={()=>setRetry(v=>v+1)}>{t(state==='error'?'Reintentar preview':'Actualizar preview')}</button><button className="primary" disabled={!ready||exporting} onClick={()=>{if(!current)return;setExporting(true);setReceipt('');void api.pdfExport(current.id,current.sha256).then(result=>{
      if(!result.ok){setError(result.error.code);return;}
      if(!result.value.cancelled)setReceipt(result.value.sha256!);
    }).finally(()=>setExporting(false));}}>{t('Exportar PDF')}</button></div>
    {receipt&&<p role="status" data-export-sha256={receipt}>{t('PDF exportado. SHA-256: {hash}',{hash:receipt})}</p>}
    {current&&<><p className="hint">{t('Revisión {n}',{n:current.revision})} · {current.metrics.pdfBytes} bytes · {Math.round(current.metrics.snapshotToPdfMs)} ms{viewMs!==null?` · ${Math.round(viewMs)} ms PDF.js`:''}</p><PdfPages generation={current} onReady={()=>{if(current.revision===cv.revision){setViewMs(previous=>previous??performance.now()-started.current);setState('ready');}}} onError={()=>{setError('PREVIEW_PDFJS_FAILED');setState('error');}}/></>}
  </section>;
}
function PdfPages({generation,onReady,onError}:{generation:PdfGeneration;onReady:()=>void;onError:()=>void}){
  const {t}=useMessages(),[pdf,setPdf]=useState<PDFDocumentProxy|null>(null),[number,setNumber]=useState(1),[zoom,setZoom]=useState<number|'fit'>('fit'),[availableWidth,setAvailableWidth]=useState(0),scroll=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),layer=useRef<HTMLDivElement>(null),annotations=useRef<HTMLDivElement>(null),pageBox=useRef<HTMLDivElement>(null);
  const callbacks=useRef({onReady,onError});callbacks.current={onReady,onError};
  // View-only scale; neither the generation nor its immutable export bytes change.
  useEffect(()=>{
    const element=scroll.current!;
    const measure=()=>{const style=getComputedStyle(element);setAvailableWidth(Math.max(0,element.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)));};
    const observer=new ResizeObserver(measure);observer.observe(element);measure();
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    let active=true;setPdf(null);setNumber(1);
    // PDF.js may transfer its buffer. Keep the generation's immutable export buffer intact.
    const task=getDocument({data:new Uint8Array(generation.bytes),enableXfa:false,useSystemFonts:false});
    void task.promise.then(async doc=>{
      const bytes=await doc.getData(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))).map(b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==generation.sha256)throw Error('PDF_DIGEST');
      if(active)setPdf(doc);
    }).catch(()=>{if(active)callbacks.current.onError();});
    return()=>{active=false;void task.destroy();};
  },[generation.id]);
  useEffect(()=>{
    if(!pdf||(zoom==='fit'&&availableWidth<=0))return;let active=true,render:RenderTask|undefined,text:TextLayer|undefined;
    void (async()=>{
      const page=await pdf.getPage(number);if(!active)return;
      const scale=zoom==='fit'?availableWidth/page.getViewport({scale:1}).width:zoom;
      const viewport=page.getViewport({scale}),element=canvas.current!,box=pageBox.current!,textElement=layer.current!,links=annotations.current!;
      const ratio=window.devicePixelRatio||1;element.width=Math.ceil(viewport.width*ratio);element.height=Math.ceil(viewport.height*ratio);element.style.width=viewport.width+'px';element.style.height=viewport.height+'px';box.style.width=viewport.width+'px';box.style.height=viewport.height+'px';box.style.setProperty('--total-scale-factor',String(scale));box.style.setProperty('--scale-factor',String(scale));
      textElement.replaceChildren();links.replaceChildren();
      render=page.render({canvas:element,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
      await render.promise;if(!active)return;
      text=new TextLayer({textContentSource:await page.getTextContent(),container:textElement,viewport});await text.render();
      const items=await page.getAnnotations();if(!active)return;
      for(const item of items){if(item.subtype?.toLowerCase()!=='link'||typeof item.url!=='string'||!/^https?:|^mailto:|^tel:/i.test(item.url))continue;
        const [a,b,c,d,e,f]=viewport.transform as number[],r=item.rect as number[],rect=[a!*r[0]!+c!*r[1]!+e!,b!*r[0]!+d!*r[1]!+f!,a!*r[2]!+c!*r[3]!+e!,b!*r[2]!+d!*r[3]!+f!],link=document.createElement('a');link.href=item.url;link.textContent=item.url;link.title=item.url;link.style.left=Math.min(rect[0]!,rect[2]!)+'px';link.style.top=Math.min(rect[1]!,rect[3]!)+'px';link.style.width=Math.abs(rect[2]!-rect[0]!)+'px';link.style.height=Math.abs(rect[3]!-rect[1]!)+'px';link.addEventListener('click',event=>{event.preventDefault();void api.pdfOpenLink(item.url as string);});links.append(link);
      }
      callbacks.current.onReady();
    })().catch(error=>{if(active&&(error as Error).name.toLowerCase()!=='renderingcancelledexception')callbacks.current.onError();});
    return()=>{active=false;render?.cancel();text?.cancel();};
  },[pdf,number,zoom,availableWidth]);
  return <><div className="pdf-toolbar" aria-label={t('Navegación PDF')}><button disabled={!pdf||number<=1} onClick={()=>setNumber(n=>n-1)}>{t('Página anterior')}</button><span aria-live="polite">{t('Página {n} de {total}',{n:number,total:pdf?.numPages??generation.metrics.pageCount})}</span><button disabled={!pdf||number>=pdf.numPages} onClick={()=>setNumber(n=>n+1)}>{t('Página siguiente')}</button><label>{t('Zoom')}<select aria-label={t('Zoom')} value={zoom} onChange={e=>setZoom(e.target.value==='fit'?'fit':Number(e.target.value))}><option value="fit">{t('Ajustar al ancho')}</option>{[0.6,0.8,1,1.25,1.5].map(z=><option key={z} value={z}>{Math.round(z*100)}%</option>)}</select></label></div>
    <div className="pdf-scroll" ref={scroll}><div className="pdf-page" ref={pageBox}><canvas ref={canvas} aria-label={t('Página PDF {n}',{n:number})}/><div ref={layer} className="textLayer"/><div ref={annotations} className="pdf-links"/></div></div></>;
}
