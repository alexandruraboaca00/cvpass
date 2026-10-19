import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {readPdfPayload} from '../dist/src/adapters/import/pdf-payload.js';
import {analyzeImport} from '../dist/src/adapters/import/analyze.js';
import {PDFDocument,PDFDict,PDFName} from 'pdf-lib';
import {createHash} from 'node:crypto';
const output=process.env.CVFORGE_F8_OUTPUT??'/tmp/cvforge-f8/render',metrics=JSON.parse(await readFile(join(output,'metrics.json'),'utf8')),results=[];
const compact=s=>s.replace(/\s/g,'');
for(const {name,pageCount,template} of metrics.results){
 const path=join(output,name+'.pdf'),bytes=new Uint8Array(await readFile(path)),task=getDocument({data:new Uint8Array(bytes),useSystemFonts:false}),pdf=await task.promise;
 try{
  const pages=[],links=[];let text='';
  for(let n=1;n<=pdf.numPages;n++){
   const p=await pdf.getPage(n),items=(await p.getTextContent()).items.filter(i=>'str'in i&&i.str.trim()),body=items.filter(i=>i.transform[5]>40);
   assert(body.length,name+' blank page');assert(await p.getStructTree(),name+' untagged');
   for(const i of body){const x=i.transform[4],y=i.transform[5];assert(x>=50&&x+i.width<=546,`${name} overflow x=${x} width=${i.width}`);assert(y>=50&&y+i.height<=797,`${name} vertical ${y}`);if(template==='lateral'&&!name.startsWith('minimal-')&&y<700)assert(x+i.width<=199||x>=220,`${name} crosses column gutter: ${i.str}`);}
   const t=body.map(i=>i.str).join(' ');text+=t+'\n';links.push(...(await p.getAnnotations()).filter(a=>a.subtype==='Link'));
   const lanes=template==='lateral'?[body.filter(i=>i.transform[4]<210),body.filter(i=>i.transform[4]>=210)]:[body];
   for(const lane of lanes)for(const h of ['Habilidades','Idiomas','Educación','Experiencia laboral','Proyectos','Certificaciones','Sobre mí']){const at=lane.findIndex(i=>i.str===h);if(at>=0){assert(at<lane.length-1,`${name} orphan ${h}`);assert(lane[at].transform[5]-lane[at+1].transform[5]<70,`${name} detached ${h}`);}}
   pages.push({page:n,items:body.length,text:t});
  }
  assert.equal(pdf.numPages,pageCount);if(name.startsWith('english-')){assert(text.includes('Work experience'));assert(text.includes('Ongoing'));assert(text.includes('Native language'));assert(text.includes('Not assessed'));}const attachments=await pdf.getAttachments();assert.equal(attachments.size,1);const payload=readPdfPayload(await pdf.getAttachmentContent([...attachments.keys()][0]));assert(payload);
  const expected=JSON.parse(await readFile(join(output,name+'-projection.json'),'utf8'));assert.deepEqual(payload.projection,expected);
  const visit=v=>{if(v?.type==='text'){const strings=typeof v.value==='string'?[v.value]:paragraphs(v.value);for(const plain of strings)assert(compact(text).includes(compact(plain)),`${name} missing ${plain.slice(0,90)}`);}else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
  function paragraphs(doc){return doc.content.flatMap(b=>b.kind==='paragraph'?[b.content.map(t=>t.text??'').join('')]:b.items.flatMap(i=>paragraphs({content:i.content})));}
  visit(expected);for(const value of ['PRIVATE_','EMPTY_SECTION_SENTINEL']){assert(!JSON.stringify(payload).includes(value));assert(!text.includes(value));}
  const poppler=execFileSync('pdftotext',['-raw',path,'-'],{encoding:'utf8'}),layout=execFileSync('pdftotext',['-layout',path,'-'],{encoding:'utf8'});
  if(name.startsWith('large-'))for(let i=1;i<=48;i++){for(const source of [text,poppler,layout])assert.equal(source.split('F8_END_'+String(i).padStart(2,'0')).length-1,1,`${name} paragraph ${i}`);}
  if(!name.startsWith('minimal-'))for(const glyph of ['á','é','í','ó','ú','ñ','¿','¡','ă','â','î','ș','ț'])assert(text.includes(glyph),name+' glyph '+glyph);
  if(!name.startsWith('minimal-'))assert(links.some(l=>l.url==='mailto:synthetic@example.org'));for(const link of links)assert(link.rect[0]>=50&&link.rect[2]<=546,name+' link bounds');
  if(name.startsWith('urls-'))assert(links.some(l=>l.url.includes('long-url-segment-')));
  if(template==='lateral'&&!name.startsWith('minimal-'))for(let n=0;n<pages.length;n++){
    // The geometric text report is retained separately; logical column order comes from items.
    const page=await pdf.getPage(n+1),items=(await page.getTextContent()).items.filter(i=>'str'in i&&i.str.trim()&&i.transform[5]>50&&(n>0||i.transform[5]<700));
    let inBody=false;for(const i of items){if(i.transform[4]>=220)inBody=true;else assert(!inBody,name+' interleaves logical columns');}
  }
  let stripped=false;
  if(name.startsWith('small-')){
    const plain=await PDFDocument.load(bytes),names=plain.catalog.lookupMaybe(PDFName.of('Names'),PDFDict);names?.delete(PDFName.of('EmbeddedFiles'));plain.catalog.delete(PDFName.of('AF'));
    const without=new Uint8Array(await plain.save({useObjectStreams:false})),cleanPath=join(output,name+'-without-payload.pdf');await writeFile(cleanPath,without);
    const cleanTask=getDocument({data:new Uint8Array(without),useSystemFonts:false});try{const clean=await cleanTask.promise;assert.equal(clean.numPages,pdf.numPages);assert.equal(await clean.getAttachments(),null);const geometry=async page=>(await page.getTextContent()).items.filter(i=>'str'in i).map(({str,transform,width,height})=>({str,transform,width,height}));assert.deepEqual(await geometry(await clean.getPage(1)),await geometry(await pdf.getPage(1)));const annotations=async page=>(await page.getAnnotations()).filter(a=>a.subtype==='Link').map(({url,rect})=>({url,rect}));assert.deepEqual(await annotations(await clean.getPage(1)),await annotations(await pdf.getPage(1)));}finally{await cleanTask.destroy();}
    const digest=p=>createHash('sha256').update(execFileSync('pdftoppm',['-f','1','-l','1','-singlefile','-scale-to','1000','-png',p])).digest('hex');assert.equal(digest(cleanPath),digest(path));
    assert.equal((await analyzeImport(without,'plain.pdf')).code,'PDF_NO_COMPATIBLE_STRUCTURE');stripped=true;
  }
  await writeFile(join(output,name+'-text.txt'),text);await writeFile(join(output,name+'-poppler-raw.txt'),poppler);await writeFile(join(output,name+'-poppler-layout.txt'),layout);
  results.push({name,pages:pdf.numPages,links:links.length,tagged:true,allVisibleText:true,noPrivateSentinels:true,columnsWithinBounds:true,payloadMatches:true,strippedVisualIdentity:stripped||undefined});
 }finally{await task.destroy();}
}
await writeFile(join(output,'inspection.json'),JSON.stringify({results},null,2));console.log(JSON.stringify(results));
