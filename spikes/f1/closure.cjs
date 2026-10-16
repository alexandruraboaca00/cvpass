const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRawStream,decodePDFRawStream} = require('pdf-lib');
const fixture = require('./closure-fixture.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function removePayload(pdf) {
  const names = pdf.catalog.lookup(PDFName.of('Names'),PDFDict);
  const embedded = names.lookup(PDFName.of('EmbeddedFiles'),PDFDict);
  const list = embedded.lookup(PDFName.of('Names'),PDFArray);
  for(let i=1;i<list.size();i+=2) {
    const ref = list.get(i); const spec = pdf.context.lookup(ref,PDFDict);
    const ef = spec.lookup(PDFName.of('EF'),PDFDict);
    for(const [,streamRef] of ef.entries()) pdf.context.delete(streamRef);
    pdf.context.delete(ref);
  }
  // Fixtures have a single flat attachment name tree; preserve every page/tag.
  const embeddedRef = names.get(PDFName.of('EmbeddedFiles'));
  names.delete(PDFName.of('EmbeddedFiles')); pdf.context.delete(embeddedRef);
  pdf.catalog.delete(PDFName.of('AF'));
}
function auditObjects(pdf, banned) {
  let streams = 0, images = [];
  for(const [,object] of pdf.context.enumerateIndirectObjects()) {
    let representation = object.toString();
    if(object instanceof PDFRawStream) {
      streams++;
      const bytes = Buffer.from(decodePDFRawStream(object).decode());
      representation += bytes.toString('utf8') + bytes.toString('latin1');
      if(object.dict.get(PDFName.of('Subtype'))?.toString()==='/Image') {
        assert.deepEqual([...bytes],[0,0,255,0,0,255,0,0,255,0,0,255],'Unexpected excluded pixels or image metadata');
        images.push({width:object.dict.get(PDFName.of('Width'))?.asNumber(),height:object.dict.get(PDFName.of('Height'))?.asNumber(),decodedBytes:bytes.length});
      }
    }
    for(const value of banned) {
      assert(!representation.includes(value),`Private value found in decompressed object: ${value}`);
      assert(!representation.toLowerCase().includes(Buffer.from(value).toString('hex')),`Private hex value found: ${value}`);
      assert(!representation.toLowerCase().includes(Buffer.from(value,'utf16le').swap16().toString('hex')),`Private UTF16 value found: ${value}`);
    }
  }
  assert(images.some(i=>i.width===2&&i.height===2),'Cropped image absent');
  assert(images.every(i=>i.width<=2&&i.height<=2),'Original pixels exported');
  return {streams,images};
}
function validatePages(facts, payload) {
  const all = facts.pages.flatMap(p=>p.items).map(i=>i.str).join(' ').replace(/\s+/g,' ');
  for(const text of [payload.title,payload.glyphs,payload.sensitiveVisible,...payload.paragraphs,...payload.list,payload.breakHeading,payload.end]) {
    assert(all.includes(text),`Visible content missing: ${text.slice(0,90)}`);
  }
  for(let n=1;n<=150;n++) assert(all.includes(`L${String(n).padStart(3,'0')} Descripción extensa`));
  const normalized = payload.longText.replace(/\s+/g,' ');
  assert(all.includes(normalized),'Long paragraph truncated or reordered');
  assert(facts.pages.length>2);
  const longPages = facts.pages.filter(p=>p.items.some(i=>/L\d{3}/.test(i.str)));
  assert(longPages.length>1,'Fixture must cross a page boundary');
  const clicked = facts.pages.flatMap(p=>p.clicked);
  assert(clicked.includes(payload.link.url),'Real PDF.js annotation did not respond to click');
  for(const [index,page] of facts.pages.entries()) {
    assert(page.structure,`No tag tree on page ${index+1}`);
    const items = page.items.filter(i=>i.str.trim());
    for(const item of items) {
      assert(item.x>=44 && item.x+item.width<=page.width-44,`Horizontal clipping page ${index+1}: ${item.str}`);
      assert(item.y>=44 && item.y+item.height<=page.height-44,`Vertical clipping page ${index+1}: ${item.str}`);
    }
    for(let i=0;i<items.length;i++) if(/^P\d{2}$/.test(items[i].str)) {
      assert(items[i+1]?.str.startsWith(items[i].str+' Desarrollo'),`Orphan heading: ${items[i].str}`);
    }
  }
  const last = facts.pages.at(-1).items.filter(i=>i.str.trim());
  assert.equal(last[0].str,payload.breakHeading,'Explicit page break not respected');
  return {pages:facts.pages.length,longParagraphPages:longPages.length,clickedLinks:clicked.length,allVisibleContent:true,marginBounds:true,headingsWithContent:true};
}
async function run({app,BrowserWindow,session,nativeImage,root,sqlite}) {
  const started = performance.now();
  await fs.mkdir(root,{recursive:true});
  let networkAttempts=0;
  session.defaultSession.webRequest.onBeforeRequest((d,cb)=>{if(/^(https?|wss?|ftp):/.test(d.url)){networkAttempts++;cb({cancel:true});}else cb({});});
  const viewer = new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  await viewer.loadFile(path.join(__dirname,'dist/index.html'));
  const inspect = bytes => viewer.webContents.executeJavaScript(`window.inspectClosurePdf(${JSON.stringify(bytes.toString('base64'))})`);
  const original = nativeImage.createFromBitmap(Buffer.from([0,0,255,255,0,0,255,255,255,0,0,255,255,0,0,255,0,0,255,255,0,0,255,255,255,0,0,255,255,0,0,255]),{width:4,height:2});
  const photo = original.crop({x:2,y:0,width:2,height:2}).toPNG();
  const create = process.argv.includes('--create');
  const stored = await sqlite(create,original.toPNG());
  assert.equal(stored.integrity,'ok');assert.equal(stored.imageHash,hash(original.toPNG()));
  const report={packaged:app.isPackaged,mode:create?'create':'reopen',sqlite:stored,layouts:[],networkAttempts:0,translationExecuted:false};
  const [regular,bold] = await Promise.all(['Regular','Bold'].map(weight=>fs.readFile(path.join(__dirname,`assets/LiberationSans-${weight}.ttf`),'base64')));
  for(const layout of ['simple','lateral']) {
    const payload=fixture.projection(layout,photo.toString('base64'));
    const privateState={...fixture.forbidden,date:'2020-05-17',profile:fixture.forbidden.otherDocument,sourceImage:original.toPNG()};
    const banned=[...Object.values(fixture.forbidden),privateState.date,root,'/home/','file:///','C:\\Users\\'];
    const variants={};
    if(create) {
      const print = new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
      await print.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(fixture.html(payload,regular,bold)));
      await print.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
      variants.plain=await print.webContents.printToPDF({printBackground:true,generateTaggedPDF:true,pageSize:'A4',preferCSSPageSize:true});print.destroy();
      const pdf=await PDFDocument.load(variants.plain);
      await pdf.attach(Buffer.from(JSON.stringify(payload)),'cvforge-export.json',{mimeType:'application/json',description:'Visible synthetic CV only'});
      variants.exported=Buffer.from(await pdf.save());
      const stripped=await PDFDocument.load(variants.exported);removePayload(stripped);
      variants.stripped=Buffer.from(await stripped.save());
      for(const [name,bytes] of Object.entries(variants)) await fs.writeFile(path.join(root,`${layout}-${name}.pdf`),bytes);
    } else for(const name of ['plain','exported','stripped']) variants[name]=await fs.readFile(path.join(root,`${layout}-${name}.pdf`));
    const facts={};const audits={};
    for(const [name,bytes] of Object.entries(variants)) {
      facts[name]=await inspect(bytes);
      assert.equal(facts[name].inputHash,hash(bytes),'Viewer input differs from exported bytes');
      audits[name]=auditObjects(await PDFDocument.load(bytes),banned);
      for(const [i,page] of facts[name].pages.entries()) await fs.writeFile(path.join(root,`${layout}-${name}-page-${i+1}.png`),Buffer.from(page.png,'base64'));
      for(const page of facts[name].pages) delete page.png;
      const attachment=facts[name].attachments;
      if(name==='exported') {
        assert.equal(attachment.length,1);assert.equal(attachment[0].filename,'cvforge-export.json');
        assert.deepEqual(JSON.parse(attachment[0].text),payload);
        await fs.writeFile(path.join(root,`${layout}-extracted-payload.json`),attachment[0].text+'\n');
      } else assert.equal(attachment.length,0,'Plain/stripped PDF still has payload');
    }
    assert.deepEqual(facts.exported.pages,facts.plain.pages,'Attaching payload changed pixels, text, links or tags');
    assert.deepEqual(facts.stripped.pages,facts.plain.pages,'Removing payload changed pixels, text, links or tags');
    const checks=validatePages(facts.exported,payload);
    const extracted=JSON.stringify(payload);
    for(const secret of banned) assert(!extracted.includes(secret),'Payload leaks private data');
    // PNG ancillary chunks may not carry EXIF/text; generated crop contains pixels only.
    for(let offset=8;offset<photo.length;) {const len=photo.readUInt32BE(offset);const type=photo.subarray(offset+4,offset+8).toString();assert(!['eXIf','tEXt','iTXt','zTXt'].includes(type));offset+=12+len;}
    const doc=await PDFDocument.load(variants.stripped);
    for(const [,object] of doc.context.enumerateIndirectObjects()) if(object instanceof PDFRawStream) assert(!Buffer.from(decodePDFRawStream(object).decode()).includes(Buffer.from('cvforge-export-probe')),'Payload bytes retained after removal');
    report.layouts.push({layout,...checks,variants:Object.fromEntries(Object.entries(variants).map(([name,b])=>[name,{bytes:b.length,sha256:hash(b),pixelHashes:facts[name].pages.map(p=>p.pixelHash)}])),audits,payloadKeys:Object.keys(payload),allPagesPixelIdentical:true});
    await fs.writeFile(path.join(root,`${layout}-facts.json`),JSON.stringify(facts,null,2));
  }
  assert.equal(networkAttempts,0);report.networkAttempts=networkAttempts;report.elapsedMs=Math.round(performance.now()-started);
  await fs.writeFile(path.join(root,`closure-${report.mode}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));viewer.destroy();
}
module.exports={run,removePayload,auditObjects,validatePages};
