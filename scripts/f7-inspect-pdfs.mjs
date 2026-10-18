import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument } from 'pdf-lib';
import { readPdfPayload } from '../dist/src/adapters/import/pdf-payload.js';
const output=process.env.CVFORGE_F7_OUTPUT??'/tmp/cvforge-f7-render',metrics=JSON.parse(await readFile(join(output,'metrics.json'),'utf8')),results=[];
for(const {name,pageCount} of metrics.results){
 const bytes=new Uint8Array(await readFile(join(output,name+'.pdf'))),task=getDocument({data:new Uint8Array(bytes),useSystemFonts:false}),pdf=await task.promise;
 try{
  assert.equal(pdf.numPages,pageCount);let all='',links=[],structures=[],bounds=[];
  for(let n=1;n<=pdf.numPages;n++){
   const page=await pdf.getPage(n),text=await page.getTextContent(),items=text.items.filter(i=>'str'in i&&i.str.trim()),body=items.filter(i=>i.transform[5]>30);
   assert(body.length,'Accidental blank page');
   for(const item of body){const x=item.transform[4],y=item.transform[5];assert(x>=50&&x+item.width<=546,`Horizontal overflow ${name} p${n}: ${x}, ${item.width}`);assert(y>=50&&y+item.height<=797,`Vertical overflow ${name} p${n}: ${y}`);}
   for(const heading of ['Educación','Experiencia laboral','Habilidades','Idiomas','Certificaciones','Proyectos','Información adicional']){
    const index=body.findIndex(i=>i.str===heading);if(index>=0){assert(index<body.length-1,`Orphan heading ${heading}`);assert(body[index].transform[5]-body[index+1].transform[5]<70,`Separated heading ${heading}`);}
   }
   all+=items.map(i=>i.str).join(' ')+'\n';links.push(...(await page.getAnnotations()).filter(a=>a.subtype==='Link').map(a=>({url:a.url,rect:a.rect,page:n})));
   structures.push(Boolean(await page.getStructTree()));bounds.push({page:n,bodyItems:body.length,minX:Math.min(...body.map(i=>i.transform[4])),maxX:Math.max(...body.map(i=>i.transform[4]+i.width))});
  }
  assert(links.some(l=>l.url==='mailto:synthetic@example.org'));if(name!=='hidden')assert(links.some(l=>l.url==='https://example.org/project'));
  assert(all.includes('Instituto Sintético'));if(name==='original-only'){assert(all.includes('Título sintético'));assert(!all.includes('Reviewed synthetic degree'));}else if(name==='translation-only'){assert(all.includes('Reviewed synthetic degree'));assert(!all.includes('Título sintético'));}else assert(all.includes('Reviewed synthetic degree')&&all.includes('Título sintético'));
  assert(!all.includes('EMPTY_SECTION_SENTINEL'));
  if(name==='english-no-photo'){assert(all.includes('Work experience'));assert(all.includes('Ongoing'));}
  if(name==='hidden'){assert(!all.includes('Proyecto sintético'));assert(!all.includes('Analista sintético'));}
  else {assert(all.includes('ORDERED_FIRST')&&all.includes('ORDERED_SECOND'));assert(links.some(l=>l.url==='https://example.test/rich'));assert(all.includes('After explicit break'));}
  if(name==='year-only'){assert(all.includes('1990'));assert(!all.includes('19/07/1990'));assert(!all.includes('02/2020'));}
  assert(!all.includes('PRIVATE_'));assert(!all.includes('Primer CV privado'));assert(structures.every(Boolean));
  if(name==='large'){
   let previous=-1;for(let i=1;i<=48;i++){const marker='PARAGRAPH_'+String(i).padStart(2,'0'),end='END_'+String(i).padStart(2,'0');assert.equal(all.split(marker).length-1,1,marker);assert.equal(all.split(end).length-1,1,end);assert(all.indexOf(marker)>previous);previous=all.indexOf(marker);}
   for(const glyph of ['á','é','í','ó','ú','ñ','¿','¡','ă','â','î','ș','ț'])assert(all.includes(glyph),'Missing glyph '+glyph);
   assert(links.some(l=>l.url.startsWith('https://example.test/long-segment-')));
   for(const label of ['Habilidades','Idiomas','Certificaciones','Proyectos','Información adicional'])assert(all.includes(label),label);
  }
  const attachments=await pdf.getAttachments();assert.equal(attachments.size,1);const key=[...attachments.keys()][0],attachment=await pdf.getAttachmentContent(key),payload=readPdfPayload(attachment);assert(payload&&payload.integrity==='sha256');
  const expected=JSON.parse(await readFile(join(output,name+'-projection.json'),'utf8'));assert.deepEqual(payload.projection,expected);assert(!JSON.stringify(payload).includes('PRIVATE_'));
  const lib=await PDFDocument.load(bytes);assert.equal(lib.getTitle(),'Persona sintética Ștefan');assert.equal(lib.getCreator(),'CVForge');
  const info=execFileSync('pdfinfo',[join(output,name+'.pdf')],{encoding:'utf8'});assert(/Tagged:\s+yes/.test(info));assert(/JavaScript:\s+no/.test(info));
  const fonts=execFileSync('pdffonts',[join(output,name+'.pdf')],{encoding:'utf8'}).trim().split('\n').slice(2);assert(fonts.length>0);assert(fonts.every(line=>/^[A-Z]+\+LiberationSans(?:-Bold|-Italic|-BoldItalic)?\s/.test(line)),'Unpinned host font in PDF');
  for(const link of links)assert(link.rect[0]>=50&&link.rect[2]<=546,'Link outside margins');
  // Independent Poppler extraction must also preserve the complete 48-paragraph content.
  const poppler=execFileSync('pdftotext',['-layout',join(output,name+'.pdf'),'-'],{encoding:'utf8'});if(name==='large')for(let i=1;i<=48;i++)assert(poppler.includes('END_'+String(i).padStart(2,'0')));
  await writeFile(join(output,name+'-text.txt'),all);results.push({name,pages:pdf.numPages,selectable:true,tagged:true,links:links.length,bounds,payloadMatches:true,photoOnlyCroppedPixels:true});
 }finally{await task.destroy();}
}
await writeFile(join(output,'inspection.json'),JSON.stringify({results},null,2));console.log(JSON.stringify(results));
