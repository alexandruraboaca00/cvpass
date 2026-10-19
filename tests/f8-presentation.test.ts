import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryFixture,runtimeContext as ctx } from './library-helpers.js';
import { loadSimpleResources } from '../src/adapters/pdf/resources.js';
import { PresentationService } from '../src/application/presentation.js';
import { RenderSnapshotFactory } from '../src/application/render-snapshot.js';
import { builtinTemplate } from '../src/application/render-contract.js';
import { sha256 } from '../src/adapters/asset-bytes.js';
import { canonical } from '../src/domain/index.js';
const resources=()=>loadSimpleResources('resources/fonts');
const content=(cv:Awaited<ReturnType<PresentationService['confirm']>>)=>{const {presentation,revision,updatedAt,...rest}=cv;return sha256(new TextEncoder().encode(canonical(rest)));};
test('F8 template changes preserve logical content hash, settings, resource closure and survive SQLite reopen',async t=>{
 const f=await libraryFixture(t),service=new PresentationService(f.library,resources),before=await f.library.openCv(f.cvId),{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=before.presentation;
 const input={density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide};let cv=before;
 for(const id of ['simple','lateral','simple','lateral']){cv=await service.confirm(cv.id,cv.revision,{...input,templateRef:{id,version:1}});assert.equal(content(cv),content(before));assert.equal(cv.presentation.templateRef.id,id);}
 await f.repository.close();const reopened=await f.open();assert.deepEqual(await reopened.library.openCv(f.cvId),cv);assert.deepEqual((await reopened.repository.health()).integrity,['ok']);
});
test('F8 snapshot selects exact Lateral version and refuses future templates without mutation',async t=>{
 const f=await libraryFixture(t),service=new PresentationService(f.library,resources),before=await f.library.openCv(f.cvId),{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=before.presentation;
 const cv=await service.confirm(before.id,before.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:'lateral',version:1}}),saved=await f.library.snapshot();
 const factory=new RenderSnapshotFactory(f.library,resources,{normalize:async()=>{throw Error('No hidden image decoding');}},sha256,ctx,'synthetic-engine');
 const noPhoto=structuredClone(cv);noPhoto.personalInformation.photo=null;const next=await f.library.confirmEntity(noPhoto,cv.revision);const snapshot=await factory.capture(cv.id,next.revision);
 assert.equal(snapshot.rendererVersion,'lateral-1');assert.equal(snapshot.projection.presentation.templateRef.id,'lateral');assert(Object.isFrozen(snapshot.projection));
 assert.throws(()=>builtinTemplate('lateral',99),/RENDER_TEMPLATE_UNSUPPORTED/);assert.throws(()=>builtinTemplate('modern',1),/RENDER_TEMPLATE_UNSUPPORTED/);
 const current=await f.library.snapshot();await assert.rejects(service.confirm(cv.id,next.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:'lateral',version:99}}),/RENDER_TEMPLATE_UNSUPPORTED/);assert.deepEqual(await f.library.snapshot(),current);assert(saved.content.templates.some(t=>t.layout==='twoColumn'));
});
