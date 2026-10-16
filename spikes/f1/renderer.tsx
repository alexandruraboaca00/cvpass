import React from 'react';
import {createRoot} from 'react-dom/client';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
createRoot(document.getElementById('root')!).render(<main><h1>CVForge · Prueba F1</h1><p>Datos sintéticos. Validación técnica en curso.</p><canvas id="pdf" /></main>);
// Only synthetic bytes passed by the test process; no filesystem bridge.
(window as any).inspectPdf = async (base64: string, draw = false) => {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const task = pdfjs.getDocument({data: bytes});
  const doc = await task.promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const text = await page.getTextContent();
    pages.push({text: text.items.map((x: any) => x.str ?? '').join(' '),
      fonts: Object.values(text.styles).map((s: any) => ({fontFamily:s.fontFamily, ascent:s.ascent, descent:s.descent})),
      links: (await page.getAnnotations()).filter((a: any) => a.subtype === 'Link').map((a: any) => a.url),
      structure: await page.getStructTree()});
    if (draw && n === 1) {
      const canvas = document.getElementById('pdf') as HTMLCanvasElement;
      const viewport = page.getViewport({scale: 1});
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({canvas, viewport}).promise;
    }
  }
  const attachments = await doc.getAttachments();
  const attachment = [...(attachments?.entries() ?? [])].find(([, value]) => value.filename === 'cvforge-export.json');
  const payload = attachment ? await doc.getAttachmentContent(attachment[0]) : null;
  const result = {pages, payload: payload ? new TextDecoder().decode(payload) : null};
  await task.destroy();
  return result;
};

// Closure harness: render EVERY page and exercise PDF.js's real link layer.
(window as any).inspectClosurePdf = async (base64: string) => {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const inputHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const task = pdfjs.getDocument({data:bytes});
  const doc = await task.promise;
  const pages = [];
  for(let n=1;n<=doc.numPages;n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({scale:1});
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    await page.render({canvas,viewport}).promise;
    const pixels = canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    const pixelHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const text = await page.getTextContent();
    const annotations = await page.getAnnotations();
    const div = document.createElement('div'); div.className = 'annotationLayer'; document.body.append(div);
    const clicked: string[] = [];
    const linkService = {externalLinkEnabled:true,addLinkAttributes:(anchor: HTMLAnchorElement,url: string)=>{anchor.href=url;anchor.addEventListener('click',ev=>{ev.preventDefault();clicked.push(anchor.href);});}};
    const annotationViewport = viewport.clone({dontFlip:true});
    const layer = new pdfjs.AnnotationLayer({div,page,viewport:annotationViewport,linkService} as any);
    await layer.render({annotations,viewport:annotationViewport,div,page,linkService,renderForms:false} as any);
    for(const a of div.querySelectorAll('a[href]')) (a as HTMLAnchorElement).click();
    pages.push({width:viewport.width,height:viewport.height,pixelHash,png:canvas.toDataURL('image/png').split(',')[1],
      items:text.items.filter((x:any)=>typeof x.str === 'string').map((x:any)=>({str:x.str,x:x.transform[4],y:x.transform[5],width:x.width,height:x.height})),
      fonts:Object.values(text.styles).map((s:any)=>({fontFamily:s.fontFamily,ascent:s.ascent,descent:s.descent})),
      links:annotations.filter((a:any)=>a.subtype==='Link').map((a:any)=>({url:a.url,rect:a.rect})),clicked,
      structure:await page.getStructTree()});
    layer.destroy(); div.remove(); canvas.remove();
  }
  const attachments = await doc.getAttachments();
  const extracted = [];
  for(const [id,entry] of attachments?.entries() ?? []) {
    const content = await doc.getAttachmentContent(id);
    extracted.push({filename:entry.filename,text:new TextDecoder().decode(content!)});
  }
  const metadata = await doc.getMetadata();
  await task.destroy();
  return {inputHash,pages,attachments:extracted,metadata:metadata.info};
};
