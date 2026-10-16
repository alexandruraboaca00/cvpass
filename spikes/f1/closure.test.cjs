const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {PDFDocument}=require('pdf-lib');
const fixture=require('./closure-fixture.cjs');
const {auditObjects}=require('./closure.cjs');
const output=process.env.CVFORGE_F1_OUTPUT;
test('Privacy audit rejects a leaked private value in a compressed PDF stream',async()=>{
 const pdf=await PDFDocument.create();pdf.addPage();const stream=pdf.context.flateStream(Buffer.from(fixture.forbidden.history));pdf.context.register(stream);
 await assert.rejects(async()=>auditObjects(await PDFDocument.load(await pdf.save()),[fixture.forbidden.history]),/Private value/);
});
test('Packaged offline closure evidence is complete and independently readable',()=>{
 assert(output,'Set CVFORGE_F1_OUTPUT to the completed offline run');
 const reports=['create','reopen'].map(mode=>JSON.parse(fs.readFileSync(path.join(output,`closure-${mode}.json`))));
 for(const r of reports){assert(r.packaged);assert.equal(r.networkAttempts,0);assert.equal(r.translationExecuted,false);assert.equal(r.sqlite.integrity,'ok');assert.equal(r.layouts.length,2);for(const l of r.layouts){assert(l.allPagesPixelIdentical);assert(l.longParagraphPages>1);}}
 assert.deepEqual(reports[0].sqlite,reports[1].sqlite);
 for(const layout of ['simple','lateral']){
  for(const variant of ['plain','exported','stripped']){
   const pdf=path.join(output,`${layout}-${variant}.pdf`);
   const info=spawnSync('pdfinfo',[pdf],{encoding:'utf8'});assert.equal(info.status,0,info.stderr);assert(info.stdout.includes('Tagged:          yes'));
   const fonts=spawnSync('pdffonts',[pdf],{encoding:'utf8'});assert.equal(fonts.status,0);const rows=fonts.stdout.trim().split('\n').slice(2);assert(rows.length>=2);assert(rows.every(row=>row.includes('LiberationSans')&&/yes\s+yes\s+yes/.test(row)),'Font missing or not embedded/subset/Unicode');
   const text=spawnSync('pdftotext',['-raw',pdf,'-'],{encoding:'utf8'});assert.equal(text.status,0,text.stderr);const normalized=text.stdout.replace(/\s+/g,' ');
   for(let n=1;n<=48;n++)assert(normalized.includes(`P${String(n).padStart(2,'0')} Desarrollo`));
   const order=Array.from({length:48},(_,i)=>normalized.indexOf(`P${String(i+1).padStart(2,'0')} Desarrollo`));assert.deepEqual(order,[...order].sort((a,b)=>a-b));
   const dir=path.join(output,`${layout}-${variant}-attachments`);fs.mkdirSync(dir,{recursive:true});
   const list=spawnSync('pdfdetach',['-list',pdf],{encoding:'utf8'});assert.equal(list.status,0);
   assert(list.stdout.startsWith(variant==='exported'?'1 embedded files':'0 embedded files'));
   if(variant==='exported'){
    const extract=spawnSync('pdfdetach',['-saveall','-o',dir,pdf],{encoding:'utf8'});assert.equal(extract.status,0,extract.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'cvforge-export.json'))),JSON.parse(fs.readFileSync(path.join(output,`${layout}-extracted-payload.json`))));
   }
  }
 }
});
test('Poppler renders every plain/exported/stripped page identically',()=>{
 const {createHash}=require('node:crypto');
 for(const layout of ['simple','lateral']) {
  const count=JSON.parse(fs.readFileSync(path.join(output,'closure-create.json'))).layouts.find(l=>l.layout===layout).pages;
  const hashes={};
  for(const variant of ['plain','exported','stripped']) {
   const prefix=path.join(output,`poppler-${layout}-${variant}`);
   const rendered=spawnSync('pdftoppm',['-r','72','-png',path.join(output,`${layout}-${variant}.pdf`),prefix],{encoding:'utf8',timeout:60000});assert.equal(rendered.status,0,rendered.stderr);
   const files=fs.readdirSync(output).filter(f=>f.startsWith(`poppler-${layout}-${variant}-`)&&f.endsWith('.png')).sort();assert.equal(files.length,count);
   hashes[variant]=files.map(f=>createHash('sha256').update(fs.readFileSync(path.join(output,f))).digest('hex'));
  }
  assert.deepEqual(hashes.exported,hashes.plain);assert.deepEqual(hashes.stripped,hashes.plain);
 }
});
