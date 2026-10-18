import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadSimpleResources } from '../src/adapters/pdf/resources.js';
import { sha256 } from '../src/adapters/asset-bytes.js';
import { RenderSnapshotFactory } from '../src/application/render-snapshot.js';
import { PresentationService } from '../src/application/presentation.js';
import type { ImageNormalizer, PresentationInput } from '../src/application/render-contract.js';
import { libraryFixture, runtimeContext as ctx } from './library-helpers.js';
import { syntheticPng } from './fixtures.js';
import { canonical } from '../src/domain/index.js';
import { decodeCvproj } from '../src/adapters/cvproj.js';
const resources=()=>loadSimpleResources(resolve('resources/fonts'));
const normalized=syntheticPng(2,2),photo={sha256:sha256(normalized),mediaType:'image/png' as const,width:2,height:2,dataBase64:Buffer.from(normalized).toString('base64')};
const images:ImageNormalizer={normalize:async()=>structuredClone(photo)};
const settings=(cv:{presentation:PresentationInput}):PresentationInput=>{const {density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=cv.presentation;return {density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide};};
async function prepared(t:Parameters<typeof libraryFixture>[0]){
 const f=await libraryFixture(t),service=new PresentationService(f.library,resources),before=await f.library.openCv(f.cvId),cv=await service.confirm(f.cvId,before.revision,settings(before));
 return {...f,service,cv,factory:new RenderSnapshotFactory(f.library,resources,images,sha256,ctx,'synthetic-engine')};
}
test('F7 frozen snapshot resolves visible order, language, sensitive variants and normalized image without private source/history',async t=>{
 const f=await prepared(t),s=await f.factory.capture(f.cvId,f.cv.revision),body=JSON.stringify(s.projection);
 assert.equal(s.rendererVersion,'simple-1');assert.equal(s.projection.presentation.templateRef.id,'simple');assert.equal(s.fonts.length,4);assert(Object.isFrozen(s)&&Object.isFrozen(s.projection)&&Object.isFrozen(s.projection.sections));assert.throws(()=>{s.projection.locale='en';});
 assert(!body.includes('PRIVATE_PROFILE_ONLY'));assert(!body.includes('PRIVATE_OTHER_CV'));assert(!body.includes('PRIVATE_ORIGINAL_METADATA'));assert(!body.includes(f.cvId));assert.equal(s.projection.images[0]!.dataBase64,photo.dataBase64);
 assert(!s.projection.sections.some(section=>section.kind==='projects'));const title=s.projection.sections.find(section=>section.kind==='education')!.entries[0]!.fields.find(field=>field.field==='title')!;assert.deepEqual(title.values.map(v=>v.type==='text'?v.role:null),['translation','original']);
 const old=canonical(s);await f.library.renameCv(f.cvId,'New private name',f.cv.revision);assert.equal(canonical(s),old);
});
test('F7 in-flight snapshot captures content and bytes before awaited image preparation',async t=>{
 const f=await prepared(t),record=await f.library.snapshot();let release!:(value:typeof photo)=>void;
 const deferred:ImageNormalizer={normalize:async()=>new Promise(resolve=>{release=resolve;})};const factory=new RenderSnapshotFactory({snapshot:async()=>record},resources,deferred,sha256,ctx,'synthetic-engine');
 const result=factory.capture(f.cvId,f.cv.revision);while(!release)await new Promise(resolve=>setTimeout(resolve,1));record.content.workspace.cvsById[f.cvId]!.personalInformation.displayName='Changed after capture';for(const b of record.content.blobs.values())b.fill(0);release(structuredClone(photo));
 const s=await result;assert(!JSON.stringify(s.projection).includes('Changed after capture'));assert.equal(s.projection.images[0]!.sha256,photo.sha256);
});
test('F7 presentation confirmation changes no CV content, persists resources/configuration on a new connection and cvproj',async t=>{
 const f=await prepared(t),before=structuredClone(f.cv),input={...settings(before),density:'spacious' as const,accentColor:'#123456',numbering:true,datePrecision:'year' as const,showCefrGuide:true},cv=await f.service.confirm(f.cvId,before.revision,input);
 const content=(cv:typeof before)=>{const {presentation,revision,updatedAt,...rest}=cv;return rest;};assert.deepEqual(content(cv),content(before));assert.equal(cv.personalInformation.birthDate!.precision,'day');
 const s=await f.factory.capture(f.cvId,cv.revision);assert.equal(s.projection.presentation.numbering,true);const payload=decodeCvproj(await f.library.exportCvproj(f.cvId));assert.equal(payload.snapshot.scope,'cv');assert(payload.snapshot.templates.some(t=>t.id==='simple'));assert.equal(Object.values(payload.snapshot.assetsById).filter(a=>a.role==='templateResource').length,5);
 await f.repository.close();const reopened=await f.open();assert.deepEqual(await reopened.library.openCv(f.cvId),cv);assert.deepEqual((await reopened.repository.health()).integrity,['ok']);
});
test('F7 hidden entry/section/photo and empty sections have no exported block or private image',async t=>{
 const f=await prepared(t),cv=structuredClone(f.cv);cv.personalInformation.photo!.visible=false;for(const s of Object.values(cv.sectionsById))for(const e of Object.values(s.entriesById))e.included=false;
 const current=await f.library.confirmEntity(cv,cv.revision);const factory=new RenderSnapshotFactory(f.library,resources,{normalize:async()=>{throw new Error('Must not read hidden image');}},sha256,ctx,'synthetic-engine');const snap=await factory.capture(f.cvId,current.revision);assert.deepEqual(snap.projection.sections,[]);assert.deepEqual(snap.projection.images,[]);
});
test('F7 revision conflicts, unsupported templates/fonts and damaged resources fail without modifying the CV',async t=>{
 const f=await prepared(t),before=await f.library.snapshot();await assert.rejects(f.factory.capture(f.cvId,f.cv.revision-1),/REVISION_CONFLICT/);await assert.rejects(f.service.confirm(f.cvId,f.cv.revision-1,settings(f.cv)),/REVISION_CONFLICT/);await assert.rejects(f.service.confirm(f.cvId,f.cv.revision,{...settings(f.cv),fontFamily:'Remote font'}),/RENDER_FONT_UNSUPPORTED/);
 const bad=structuredClone(before),asset=Object.values(bad.content.assetsById).find(a=>a.role==='templateResource')!;bad.content.blobs.get(asset.sha256)![0]=bad.content.blobs.get(asset.sha256)![0]!^1;const factory=new RenderSnapshotFactory({snapshot:async()=>bad},resources,images,sha256,ctx,'synthetic-engine');await assert.rejects(factory.capture(f.cvId,f.cv.revision),/RENDER_TEMPLATE_RESOURCE_MISMATCH/);assert.deepEqual(await f.library.snapshot(),before);
});
test('F7 builtin resources include regular/bold/italic/bold-italic and the redistributable OFL license',async()=>{
 const catalog=await resources();assert.equal(catalog.resourceVersion,'liberation-sans-2.1.5-ofl-1.1');assert.deepEqual(catalog.fonts.map(f=>[f.weight,f.style]),[[400,'normal'],[700,'normal'],[400,'italic'],[700,'italic']]);
 const license=Object.values(catalog.resources.assetsById).find(a=>a.mediaType==='application/octet-stream')!;assert(Buffer.from(catalog.resources.blobs.get(license.sha256)!).toString('utf8').includes('SIL OPEN FONT LICENSE Version 1.1'));
});
