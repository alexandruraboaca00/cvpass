import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {libraryFixture,runtimeContext as ctx} from './library-helpers.js';
import {f8Corpus} from './f8-fixtures.js';
import {syntheticPng} from './fixtures.js';
import {loadSimpleResources} from '../src/adapters/pdf/resources.js';
import {PresentationService} from '../src/application/presentation.js';
import {RenderSnapshotFactory} from '../src/application/render-snapshot.js';
import {StructuredImportService} from '../src/application/structured-import.js';
import {analyzeImport} from '../src/adapters/import/analyze.js';
import {readPdfPayload,encodePdfAttachment} from '../src/adapters/import/pdf-payload.js';
import {sha256,makeAsset} from '../src/adapters/asset-bytes.js';
import {createExportProjection,canonical} from '../src/domain/index.js';
import type {CvDocument} from '../src/domain/index.js';
const resources=()=>loadSimpleResources('resources/fonts');
const imageBytes=syntheticPng(2,2),image={sha256:sha256(imageBytes),mediaType:'image/png' as const,width:2,height:2,dataBase64:Buffer.from(imageBytes).toString('base64')};
async function pdf(projection:Parameters<typeof encodePdfAttachment>[0]){const doc=await PDFDocument.create();doc.addPage();await doc.attach(encodePdfAttachment(projection),'arbitrary-name.bin');return doc.save();}
for(const template of ['simple','lateral'])test(`F8 ${template} visible PDF proposal/cancel/confirm/reopen preserves exact distribution, photo and settings`,async t=>{
 const source=await libraryFixture(t),target=await libraryFixture(t,false),fixture=f8Corpus(),sensitive=fixture.find(c=>c.name==='sensitive')!.cv,hidden=fixture.find(c=>c.name==='hidden')!.cv;
 const education=Object.values(hidden.sectionsById).find(s=>s.kind==='education')!;hidden.sectionsById[education.id]=Object.values(sensitive.sectionsById).find(s=>s.kind==='education')!;hidden.sensitiveTranslationMemory=sensitive.sensitiveTranslationMemory;
 const skills=fixture.find(c=>c.name==='skills')!.cv,skillSection=Object.values(skills.sectionsById).find(s=>s.kind==='skills')!;hidden.sectionsById[skillSection.id]=skillSection;
 const customs=fixture.find(c=>c.name==='custom')!.cv;for(const id of customs.sectionOrder)if(customs.sectionsById[id]!.kind==='custom'&&!hidden.sectionsById[id]){hidden.sectionsById[id]=customs.sectionsById[id]!;hidden.sectionOrder.push(id);}
 const sourceLanguages=Object.values(fixture.find(c=>c.name==='languages')!.cv.sectionsById).find(s=>s.kind==='languages')!,languages=Object.values(hidden.sectionsById).find(s=>s.kind==='languages')!,listening=Object.values(sourceLanguages.entriesById).find(e=>e.kind==='foreignLanguage'&&!languages.entriesById[e.id])!;languages.entriesById[listening.id]=listening;languages.entryOrder!.push(listening.id);

 if(template==='lateral')hidden.documentLocale='en';
 hidden.presentation.templateRef=(await source.library.openCv(source.cvId)).presentation.templateRef;
 hidden.personalInformation.otherNames=['PRIVATE_HIDDEN_PERSONAL'];hidden.presentation.personalFieldVisibility.otherNames=false;
 const privatePdf=await PDFDocument.create();privatePdf.addPage();privatePdf.setSubject('PRIVATE_SOURCE_PDF_ASSET');const privateBytes=new Uint8Array(await privatePdf.save()),privateAsset=makeAsset(ctx.newId(),privateBytes,'source','application/pdf');
 hidden.importRecords=[{recordVersion:1,id:ctx.newId(),format:'europassPdf',adapterVersion:'synthetic',importedAt:ctx.now(),source:{fileName:'PRIVATE_SOURCE.pdf',sha256:privateAsset.sha256,byteLength:privateBytes.length,assetId:privateAsset.id},candidate:{key:'PRIVATE_CANDIDATE',attachmentName:null,sha256:'a'.repeat(64),selectionReason:'directFile'},localeEvidence:'PRIVATE_PROVENANCE',mappings:[],issues:[{kind:'unsupported',code:'PRIVATE_UNMAPPED',sourcePath:'/private',targetPath:[],valuePreview:'PRIVATE_UNMAPPED_VALUE',resolution:'excluded'}]}];
 let cv=await source.library.confirmEntity(hidden,hidden.revision,{assetsById:{[privateAsset.id]:privateAsset},blobs:new Map([[privateAsset.sha256,privateBytes]])}) as CvDocument;cv=await source.library.renameCv(cv.id,'PRIVATE_HISTORY_NAME',cv.revision);await source.library.createCheckpoint(cv.id,cv.revision);cv=await source.library.renameCv(cv.id,'PRIVATE_LIBRARY_NAME',cv.revision);
 const {density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=cv.presentation;
 cv=await new PresentationService(source.library,resources).confirm(cv.id,cv.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:template,version:1}});
 const draft=await source.library.beginDraft(cv.id,cv.revision);await source.library.updateDraft(draft.id,draft.version,{values:{text:'PRIVATE_DRAFT'},rawDateInputs:{},assetIds:[],templateRefs:[]});
 const factory=new RenderSnapshotFactory(source.library,resources,{normalize:async()=>image},sha256,ctx,'synthetic-engine'),snapshot=await factory.capture(cv.id,cv.revision),body=JSON.stringify(snapshot.projection);
 for(const sentinel of ['PRIVATE_HIDDEN_SECTION','PRIVATE_HIDDEN_ENTRY','PRIVATE_HIDDEN_PERSONAL','PRIVATE_SENSITIVE_ORIGINAL','PRIVATE_ALTERNATIVE_TRANSLATION','PRIVATE_PROFILE_ONLY','PRIVATE_OTHER_CV','PRIVATE_DRAFT','PRIVATE_HISTORY_NAME','PRIVATE_LIBRARY_NAME','PRIVATE_PROVENANCE','PRIVATE_UNMAPPED_VALUE','PRIVATE_SOURCE.pdf','PRIVATE_ORIGINAL_METADATA','PRIVATE_SOURCE_PDF_ASSET',privateAsset.sha256])assert(!body.includes(sentinel),sentinel);
 const attachment=encodePdfAttachment(snapshot.projection),extracted=readPdfPayload(attachment);assert.deepEqual(extracted?.projection,snapshot.projection);
 const bytes=await pdf(snapshot.projection),service=new StructuredImportService(target.library,{analyze:async(b,n)=>analyzeImport(b,n,ctx)},ctx),before=await target.library.snapshot();
 let proposal=await service.begin(ctx.newId(),bytes,'distribution.pdf');assert.equal(proposal.draft?.cv.presentation.templateRef.id,template);assert(!proposal.draft?.issues.some(i=>i.code==='PDF_TEMPLATE_NOT_AVAILABLE'));assert.deepEqual(await target.library.snapshot(),before);service.cancel(proposal.id);assert.deepEqual(await target.library.snapshot(),before);
 proposal=await service.begin(ctx.newId(),bytes,'distribution.pdf');const d=proposal.draft!;const result=await service.confirm(proposal.id,{cv:d.cv,rawDates:d.rawDates,rawNumbers:d.rawNumbers,documentLocale:d.documentLocale,acknowledgeIssues:true});
 await target.repository.close();const reopened=await target.open(),restored=await reopened.library.openCv(result.cvId);assert.notEqual(restored.id,cv.id);const projection=createExportProjection(restored,()=>image);assert.deepEqual(projection,snapshot.projection);
 assert.equal(Object.keys(restored.sensitiveTranslationMemory).length,0);assert.equal((await reopened.library.snapshot()).content.workspace.profile,null);assert.equal((await reopened.library.listCvs()).length,1);const photoAsset=(await reopened.library.snapshot()).content.assetsById[restored.personalInformation.photo!.assetId]!;assert.equal(photoAsset.sha256,image.sha256);assert.deepEqual((await reopened.library.snapshot()).content.blobs.get(photoAsset.sha256),imageBytes);
 // Native project retains private data and checkpoints; PDF does not promise those.
 const project=await source.library.exportCvproj(cv.id,true),fullTarget=await libraryFixture(t,false),copy=await fullTarget.library.importCvproj(project,{mode:'copyCv'});await fullTarget.repository.close();const full=await fullTarget.open(),imported=await full.library.openCv(copy.cvId!);
 assert.equal(imported.name,cv.name);assert.deepEqual(imported.presentation.templateRef,cv.presentation.templateRef);assert.equal(imported.presentation.density,cv.presentation.density);assert.equal(imported.personalInformation.otherNames[0],'PRIVATE_HIDDEN_PERSONAL');assert.equal(Object.keys(imported.sensitiveTranslationMemory).length,Object.keys(cv.sensitiveTranslationMemory).length);assert((await full.library.listRevisions(imported.id)).some(r=>r.snapshot.kind==='cv'&&r.snapshot.name==='PRIVATE_HISTORY_NAME'));
 assert.equal(canonical(createExportProjection(imported,()=>image)),canonical(snapshot.projection));
});
test('F8 own future template/version and corrupt transport produce controlled errors, never fallback to a false compatible template',async()=>{
 const cv=f8Corpus()[0]!.cv;cv.presentation.templateRef={id:'lateral',version:99};const projection=createExportProjection(cv,()=>image),analysis=await analyzeImport(await pdf(projection),'future.pdf');assert.equal(analysis.selectedKey,null);assert.equal(analysis.candidates[0]?.code,'PDF_TEMPLATE_VERSION_UNSUPPORTED');
 const bytes=encodePdfAttachment(projection),envelope=JSON.parse(Buffer.from(bytes).toString());envelope.sha256='0'.repeat(64);assert.throws(()=>readPdfPayload(new TextEncoder().encode(JSON.stringify(envelope))),/CVFORGE_PAYLOAD_INTEGRITY/);
});
