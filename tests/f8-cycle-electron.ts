import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {openLocalLibrary} from '../src/host/local-library.js';
import {RenderSnapshotFactory} from '../src/application/render-snapshot.js';
import {PdfPreviewService} from '../src/application/pdf-preview.js';
import {PresentationService} from '../src/application/presentation.js';
import {StructuredImportService} from '../src/application/structured-import.js';
import {analyzeImport} from '../src/adapters/import/analyze.js';
import {encodeCvproj,decodeCvproj} from '../src/adapters/cvproj.js';
import {readPdfPayload} from '../src/adapters/import/pdf-payload.js';
import {writeProjectFile} from '../src/adapters/project-files.js';
import {nativeImageNormalizer} from '../src/adapters/pdf/normalize-image.js';
import {loadSimpleResources} from '../src/adapters/pdf/resources.js';
import {sha256,makeAsset} from '../src/adapters/asset-bytes.js';
import {createExportProjection,canonical,entryIds} from '../src/domain/index.js';
import type {CvDocument} from '../src/domain/index.js';
import type {PdfRenderPort} from '../src/application/render-contract.js';
import {completeProjectFixture} from './fixtures.js';
import {f8Context as ctx,f8Corpus} from './f8-fixtures.js';
function normalizedIds(cv:CvDocument):unknown {
 // Canonicalize ID-keyed maps by their explicit domain order before assigning symbols.
 // Every field, reference, hidden value and approval remains in the comparison.
 const value={...cv,sectionsById:cv.sectionOrder.map(id=>{const s=cv.sectionsById[id]!;return {...s,entriesById:entryIds(s).map(id=>s.entriesById[id]),groupsById:s.groupOrder.map(id=>s.groupsById[id])};}),sensitiveTranslationMemory:Object.values(cv.sensitiveTranslationMemory).sort((a,b)=>{const {id:ai,...x}=a,{id:bi,...y}=b;return canonical(x).localeCompare(canonical(y));})};
 const ids=new Map<string,string>();const id=(s:string)=>{if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(s))return s;if(!ids.has(s))ids.set(s,'ID_'+ids.size);return ids.get(s)!;};
 const visit=(v:unknown):unknown=>typeof v==='string'?id(v):Array.isArray(v)?v.map(visit):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[id(k),visit(x)])):v;return visit(JSON.parse(canonical(value)));
}
export async function portableCycles(output:string,renderer:PdfRenderPort):Promise<void>{
 const results=[];
 for(const template of ['simple','lateral']){
  const directory=join(output,'cycle-'+template+'-'+randomUUID());await mkdir(directory,{recursive:true});
  const open=async(name:string)=>{const host=await openLocalLibrary({getPath:()=>join(directory,name)},ctx);try{await host.library.snapshot();}catch(error){if((error as {code?:string}).code!=='LIBRARY_NOT_INITIALIZED')throw error;await host.library.initialize();}return host;};
  let source=await open('A'),target=await open('B'),full=await open('C');
  try{
   const fixture=completeProjectFixture();await source.library.importCvproj(encodeCvproj(fixture,ctx.now()),{mode:'emptyWorkspace'});
   const cases=f8Corpus(),sensitive=cases.find(c=>c.name==='sensitive')!.cv,hidden=cases.find(c=>c.name==='hidden')!.cv,education=Object.values(hidden.sectionsById).find(s=>s.kind==='education')!;
   hidden.sectionsById[education.id]=Object.values(sensitive.sectionsById).find(s=>s.kind==='education')!;hidden.sensitiveTranslationMemory=sensitive.sensitiveTranslationMemory;
 const skills=cases.find(c=>c.name==='skills')!.cv,skillSection=Object.values(skills.sectionsById).find(s=>s.kind==='skills')!;hidden.sectionsById[skillSection.id]=skillSection;
 const customs=cases.find(c=>c.name==='custom')!.cv;for(const id of customs.sectionOrder)if(customs.sectionsById[id]!.kind==='custom'&&!hidden.sectionsById[id]){hidden.sectionsById[id]=customs.sectionsById[id]!;hidden.sectionOrder.push(id);}
 const sourceLanguages=Object.values(cases.find(c=>c.name==='languages')!.cv.sectionsById).find(s=>s.kind==='languages')!,languages=Object.values(hidden.sectionsById).find(s=>s.kind==='languages')!,listening=Object.values(sourceLanguages.entriesById).find(e=>e.kind==='foreignLanguage'&&!languages.entriesById[e.id])!;languages.entriesById[listening.id]=listening;languages.entryOrder!.push(listening.id);

   if(template==='lateral')hidden.documentLocale='en';
 hidden.presentation.templateRef=(await source.library.openCv(hidden.id)).presentation.templateRef;hidden.personalInformation.otherNames=['PRIVATE_HIDDEN_PERSONAL'];hidden.presentation.personalFieldVisibility.otherNames=false;
   const privatePdf=await PDFDocument.create();privatePdf.addPage();privatePdf.setSubject('PRIVATE_SOURCE_PDF_ASSET');const privateBytes=new Uint8Array(await privatePdf.save()),privateAsset=makeAsset(ctx.newId(),privateBytes,'source','application/pdf');
 hidden.importRecords=[{recordVersion:1,id:ctx.newId(),format:'europassPdf',adapterVersion:'synthetic',importedAt:ctx.now(),source:{fileName:'PRIVATE_SOURCE.pdf',sha256:privateAsset.sha256,byteLength:privateBytes.length,assetId:privateAsset.id},candidate:{key:'PRIVATE_CANDIDATE',attachmentName:null,sha256:'a'.repeat(64),selectionReason:'directFile'},localeEvidence:'PRIVATE_PROVENANCE',mappings:[],issues:[{kind:'unsupported',code:'PRIVATE_UNMAPPED',sourcePath:'/private',targetPath:[],valuePreview:'PRIVATE_UNMAPPED_VALUE',resolution:'excluded'}]}];
   let cv=await source.library.confirmEntity(hidden,hidden.revision,{assetsById:{[privateAsset.id]:privateAsset},blobs:new Map([[privateAsset.sha256,privateBytes]])}) as CvDocument;cv=await source.library.renameCv(cv.id,'PRIVATE_HISTORY_NAME',cv.revision);await source.library.createCheckpoint(cv.id,cv.revision);cv=await source.library.renameCv(cv.id,'PRIVATE_LIBRARY_NAME',cv.revision);
   const {density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=cv.presentation,resources=()=>loadSimpleResources('resources/fonts');
   cv=await new PresentationService(source.library,resources).confirm(cv.id,cv.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:template,version:1}});
   const draft=await source.library.beginDraft(cv.id,cv.revision);await source.library.updateDraft(draft.id,draft.version,{values:{text:'PRIVATE_DRAFT'},rawDateInputs:{},assetIds:[],templateRefs:[]});
   const factory=new RenderSnapshotFactory(source.library,resources,nativeImageNormalizer,sha256,ctx,process.versions.chrome!),snapshot=await factory.capture(cv.id,cv.revision),path=join(output,'privacy-'+template+'.pdf');
   const preview=new PdfPreviewService(factory,source.library,renderer,{choose:async()=>path,write:async(p,b)=>writeProjectFile(p,b,true)},sha256,ctx,source.exports),generation=await preview.generate(cv.id,cv.revision),receipt=await preview.export(generation.id,generation.sha256);
   assert.equal(receipt.sha256,generation.sha256);
   const task=getDocument({data:new Uint8Array(generation.bytes),useSystemFonts:false}),pdf=await task.promise,attachments=await pdf.getAttachments();assert.equal(attachments!.size,1);
   const attachment=await pdf.getAttachmentContent([...attachments!.keys()][0]!),payload=readPdfPayload(attachment!);assert(payload);assert.deepEqual(payload.projection,snapshot.projection);
   const sentinels=['PRIVATE_HIDDEN_SECTION','PRIVATE_HIDDEN_ENTRY','PRIVATE_HIDDEN_PERSONAL','PRIVATE_SENSITIVE_ORIGINAL','PRIVATE_ALTERNATIVE_TRANSLATION','PRIVATE_PROFILE_ONLY','PRIVATE_OTHER_CV','PRIVATE_DRAFT','PRIVATE_HISTORY_NAME','PRIVATE_LIBRARY_NAME','PRIVATE_PROVENANCE','PRIVATE_UNMAPPED_VALUE','PRIVATE_SOURCE.pdf','PRIVATE_ORIGINAL_METADATA','PRIVATE_SOURCE_PDF_ASSET',privateAsset.sha256];
   for(const marker of sentinels){assert(!JSON.stringify(payload).includes(marker),marker);for(const image of payload.projection.images)assert(!Buffer.from(image.dataBase64,'base64').includes(Buffer.from(marker)),marker);}
   await writeFile(join(output,'privacy-'+template+'-payload.json'),JSON.stringify(payload,null,2));await task.destroy();
   const before=await target.library.snapshot(),importer=new StructuredImportService(target.library,{analyze:async(b,n)=>analyzeImport(b,n,ctx)},ctx);let view=await importer.begin(ctx.newId(),generation.bytes,'exported.pdf');assert.deepEqual(await target.library.snapshot(),before);importer.cancel(view.id);assert.deepEqual(await target.library.snapshot(),before);
   view=await importer.begin(ctx.newId(),generation.bytes,'exported.pdf');assert.equal(view.code,null);assert(!view.draft!.issues.some(i=>i.code==='PDF_TEMPLATE_NOT_AVAILABLE'));const d=view.draft!,accepted=await importer.confirm(view.id,{cv:d.cv,rawDates:d.rawDates,rawNumbers:d.rawNumbers,documentLocale:d.documentLocale,acknowledgeIssues:true});
   await target.close('preserveForRecovery');target=await open('B');const restored=await target.library.openCv(accepted.cvId),s=await new RenderSnapshotFactory(target.library,resources,nativeImageNormalizer,sha256,ctx,process.versions.chrome!).capture(restored.id,restored.revision);assert.deepEqual(s.projection,snapshot.projection);
   assert.equal((await target.library.snapshot()).content.workspace.profile,null);assert.equal((await target.library.listCvs()).length,1);assert.notEqual(restored.id,cv.id);
   const project=await source.library.exportCvproj(cv.id,true);await writeFile(join(output,'private-'+template+'.cvproj'),project);const result=await full.library.importCvproj(project,{mode:'copyCv'});await full.close('preserveForRecovery');full=await open('C');
   const copy=await full.library.openCv(result.cvId!);assert.deepEqual(normalizedIds(copy),normalizedIds(cv));assert((await full.library.listRevisions(copy.id)).some(r=>r.snapshot.kind==='cv'&&r.snapshot.name==='PRIVATE_HISTORY_NAME'));
   const encoded=decodeCvproj(project);for(const a of Object.values(encoded.snapshot.assetsById)){const current=(await full.library.snapshot()).content;assert.equal(sha256(current.blobs.get(a.sha256)!),a.sha256);assert.deepEqual(current.blobs.get(a.sha256),fixture.blobs.get(a.sha256)??encoded.blobs.get(a.sha256));}
   await source.close('preserveForRecovery');source=await open('A');const records=await source.exports.listExports(cv.id);assert.equal(records.length,1);assert.equal(records[0]!.sha256,generation.sha256);assert.equal(records[0]!.templateRef.id,template);assert.equal((await source.library.recoverableDrafts()).length,1);
   for(const host of [source,target,full]){const health=await host.library.health();assert.deepEqual(health.integrity,['ok']);assert.equal(health.foreignKeyViolations,0);}
   results.push({template,pdfSha256:generation.sha256,pdfCycle:true,cvprojCycle:true,photoHash:s.projection.images[0]!.sha256,privateSentinelsAbsent:sentinels,exportRecordDurable:true,privateSourceAssetExcluded:true,documentLocale:cv.documentLocale,databasesReopened:3,skillGroups:s.projection.sections.find(s=>s.kind==='skills')!.groups.length,customSections:s.projection.sections.filter(s=>s.kind==='custom').length,listeningOnlyB1:true});
  }finally{for(const host of [source,target,full])try{await host.close('preserveForRecovery');}catch(error){if((error as {code?:string}).code!=='STORAGE_CLOSED')throw error;}}
 }
 await writeFile(join(output,'portable-cycles.json'),JSON.stringify({results},null,2));console.log('F8 real portable/privacy cycles PASS');
}
