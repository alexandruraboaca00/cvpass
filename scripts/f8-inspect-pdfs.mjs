import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {readPdfPayload} from '../dist/src/adapters/import/pdf-payload.js';
const output=process.env.CVFORGE_F8_OUTPUT??'/tmp/cvforge-f8/render',metrics=JSON.parse(await readFile(join(output,'metrics.json'),'utf8')),results=[];
const compact=s=>s.replace(/\s/g,'');
for(const {name,pageCount,template} of metrics.results){
 const path=join(output,name+'.pdf'),bytes=new Uint8Array(await readFile(path)),task=getDocument({data:new Uint8Array(bytes),useSystemFonts:false}),pdf=await task.promise;
 try{
  const pages=[],links=[];let text='';
  for(let n=1;n<=pdf.numPages;n++){
   const p=await pdf.getPage(n),items=(await p.getTextContent()).items.filter(i=>'str'in i&&i.str.trim()),body=items.filter(i=>i.transform[5]>40);
   assert(body.length,name+' blank page');assert(await p.getStructTree(),name+' untagged');
   for(const i of body){const x=i.transform[4],y=i.transform[5];assert(x>=50&&x+i.width<=546,`${name} overflow x=${x} width=${i.width}`);assert(y>=50&&y+i.height<=797,`${name} vertical ${y}`);if(template==='lateral'&&y<700)assert(x+i.width<=199||x>=220,`${name} crosses column gutter: ${i.str}`);}
   const t=body.map(i=>i.str).join(' ');text+=t+'\n';links.push(...(await p.getAnnotations()).filter(a=>a.subtype==='Link'));
   const lanes=template==='lateral'?[body.filter(i=>i.transform[4]<210),body.filter(i=>i.transform[4]>=210)]:[body];
   for(const lane of lanes)for(const h of ['Habilidades','Idiomas','Educación','Experiencia laboral','Proyectos','Certificaciones','Sobre mí']){const at=lane.findIndex(i=>i.str===h);if(at>=0){assert(at<lane.length-1,`${name} orphan ${h}`);assert(lane[at].transform[5]-lane[at+1].transform[5]<70,`${name} detached ${h}`);}}
   pages.push({page:n,items:body.length,text:t});
  }
  assert.equal(pdf.numPages,pageCount);const attachments=await pdf.getAttachments();assert.equal(attachments.size,1);const payload=readPdfPayload(await pdf.getAttachmentContent([...attachments.keys()][0]));assert(payload);
  const expected=JSON.parse(await readFile(join(output,name+'-projection.json'),'utf8'));assert.deepEqual(payload.projection,expected);
  const visit=v=>{if(v?.type==='text'){const strings=typeof v.value==='string'?[v.value]:paragraphs(v.value);for(const plain of strings)assert(compact(text).includes(compact(plain)),`${name} missing ${plain.slice(0,90)}`);}else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
  function paragraphs(doc){return doc.content.flatMap(b=>b.kind==='paragraph'?[b.content.map(t=>t.text??'').join('')]:b.items.flatMap(i=>paragraphs({content:i.content})));}
  visit(expected);for(const value of ['PRIVATE_','EMPTY_SECTION_SENTINEL']){assert(!JSON.stringify(payload).includes(value));assert(!text.includes(value));}
  const poppler=execFileSync('pdftotext',['-raw',path,'-'],{encoding:'utf8'}),layout=execFileSync('pdftotext',['-layout',path,'-'],{encoding:'utf8'});
  if(name.startsWith('large-'))for(let i=1;i<=48;i++){for(const source of [text,poppler,layout])assert.equal(source.split('F8_END_'+String(i).padStart(2,'0')).length-1,1,`${name} paragraph ${i}`);}
  for(const glyph of ['á','é','í','ó','ú','ñ','¿','¡','ă','â','î','ș','ț'])assert(text.includes(glyph),name+' glyph '+glyph);
  assert(links.some(l=>l.url==='mailto:synthetic@example.org'));for(const link of links)assert(link.rect[0]>=50&&link.rect[2]<=546,name+' link bounds');
  if(name.startsWith('urls-'))assert(links.some(l=>l.url.includes('long-url-segment-')));
  await writeFile(join(output,name+'-text.txt'),text);await writeFile(join(output,name+'-poppler-raw.txt'),poppler);await writeFile(join(output,name+'-poppler-layout.txt'),layout);
  results.push({name,pages:pdf.numPages,links:links.length,tagged:true,allVisibleText:true,noPrivateSentinels:true,columnsWithinBounds:true,payloadMatches:true});
 }finally{await task.destroy();}
}
await writeFile(join(output,'inspection.json'),JSON.stringify({results},null,2));console.log(JSON.stringify(results));
