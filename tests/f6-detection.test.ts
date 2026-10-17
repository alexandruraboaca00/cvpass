import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImport, detectSignature } from '../src/adapters/import/analyze.js';
import { LocalStructuredImport } from '../src/adapters/import/worker-port.js';
import { encodePdfAttachment, readPdfPayload } from '../src/adapters/import/pdf-payload.js';
import { encodeCvproj, encodeExportPayload } from '../src/adapters/cvproj.js';
import { decodeJson, encodeJson } from '../src/adapters/json.js';
import { createExportProjection, createCvFromProfile } from '../src/domain/index.js';
import { profileFixture, template } from './fixtures.js';
import { syntheticPdf, xmlBytes, utf16Xml } from './f6/fixtures.js';

function projection(){const {profile,ctx}=profileFixture(),cv=createCvFromProfile(profile,{name:'Synthetic',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);return createExportProjection(cv);}
test('F6 detection follows bytes rather than filenames or extensions',async()=>{
  const worker=new LocalStructuredImport();
  const xml=await worker.analyze(xmlBytes(),'renamed.bin');assert.equal(xml.detected,'xml');assert.equal(xml.candidates[0]!.format,'europassXml');
  const pdf=await worker.analyze(await syntheticPdf([{name:'totally-renamed.data',bytes:utf16Xml()}]),'looks-like-project.cvproj');assert.equal(pdf.detected,'pdf');assert.equal(pdf.candidates[0]!.format,'europassPdf');assert.equal(pdf.selectionReason,'soleCompatible');
  assert.equal(detectSignature(new TextEncoder().encode('not a pdf')),'unsupported');assert.equal((await worker.analyze(new TextEncoder().encode('text only'),'fake.pdf')).code,'FILE_UNSUPPORTED');
});
test('F6 PDFs without structured data and corrupt PDFs are controlled, without text reconstruction',async()=>{
  const generic=await analyzeImport(await syntheticPdf(),'generic.pdf');assert.equal(generic.code,'PDF_NO_COMPATIBLE_STRUCTURE');assert.equal(generic.candidates.length,0);
  const corrupt=await analyzeImport(new TextEncoder().encode('%PDF-1.7\nnot a document'),'broken.pdf');assert.equal(corrupt.code,'PDF_INVALID');assert.equal(corrupt.detected,'corrupt');
});
test('F6 enumerates irrelevant, renamed, invalid and multiple XML attachments without arbitrary selection',async()=>{
  const one=await analyzeImport(await syntheticPdf([{name:'readme.xml',bytes:new TextEncoder().encode('unrelated')},{name:'renamed.bin',bytes:xmlBytes()},{name:'truncated.xml',bytes:new TextEncoder().encode('<Candidate>')}]),'synthetic.pdf');
  assert.equal(one.candidates.length,3);assert.equal(one.selectionReason,'soleCompatible');assert.equal(one.candidates.find(c=>c.key===one.selectedKey)!.attachmentName,'renamed.bin');assert(one.candidates.some(c=>c.code==='XML_INVALID'));
  const two=await analyzeImport(await syntheticPdf([{name:'one.data',bytes:xmlBytes()},{name:'two.data',bytes:xmlBytes({locale:'en'})}]),'synthetic.pdf');assert.equal(two.selectedKey,null);assert.equal(two.selectionReason,null);assert.equal(two.candidates.filter(c=>c.project).length,2);
  const identical=await analyzeImport(await syntheticPdf([{name:'copy-a',bytes:xmlBytes()},{name:'copy-b',bytes:xmlBytes()}]),'synthetic.pdf');assert.equal(identical.selectionReason,'identicalCandidates');assert(identical.selectedKey);
});
test('F6 CVForge payload transport checks exact byte digest, versions and semantic image integrity',async()=>{
  const value=projection(),attachment=encodePdfAttachment(value),decoded=readPdfPayload(attachment)!;assert.deepEqual(decoded.projection,value);assert.equal(decoded.integrity,'sha256');
  const direct=readPdfPayload(encodeExportPayload(value))!;assert.equal(direct.integrity,'structural');
  const bad=decodeJson(attachment) as Record<string,unknown>;bad.sha256='0'.repeat(64);assert.throws(()=>readPdfPayload(encodeJson(bad)),/CVFORGE_PAYLOAD_INTEGRITY/);
  bad.containerFormatVersion=99;assert.throws(()=>readPdfPayload(encodeJson(bad)),/CVFORGE_CONTAINER_VERSION_UNSUPPORTED/);
  const future=decodeJson(encodeExportPayload(value)) as Record<string,unknown>;future.pdfPayloadFormatVersion=99;assert.throws(()=>readPdfPayload(encodeJson(future)),/CVFORGE_PAYLOAD_VERSION_UNSUPPORTED/);
  const analysis=await analyzeImport(await syntheticPdf([{name:'not-json.bin',bytes:attachment}]),'synthetic.pdf');assert.equal(analysis.candidates[0]!.format,'cvforgePdf');assert(analysis.candidates[0]!.draft);assert.equal(analysis.candidates[0]!.draft!.cv.documentLocale,'es');
  const rejected=await analyzeImport(await syntheticPdf([{name:'attachment.xml',bytes:encodeJson(future)}]),'future.pdf');assert.equal(rejected.selectedKey,null);assert.equal(rejected.candidates[0]!.code,'CVFORGE_PAYLOAD_VERSION_UNSUPPORTED');
});
test('F6 cvproj uses the existing codec, handles future/corrupt archives and distinguishes workspace scope',async()=>{
  const {profile,ctx}=profileFixture(),cv=createCvFromProfile(profile,{name:'Synthetic',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx),bytes=encodeCvproj({snapshot:{scope:'cv',cv,revisions:[],assetsById:{},templates:[template]},blobs:new Map()},ctx.now());
  const own=await analyzeImport(bytes,'renamed.pdf');assert.equal(own.detected,'cvproj');assert.equal(own.candidates[0]!.project!.snapshot.scope,'cv');assert.deepEqual(own.candidates[0]!.draft!.cv,cv);
  const broken=new Uint8Array(bytes);broken[90]=broken[90]!^1;const rejected=await analyzeImport(broken,'broken.cvproj');assert.equal(rejected.code,'CVPROJ_INVALID');assert.equal(rejected.candidates.length,0);
});
