import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {join} from 'node:path';
import {readFile,readdir} from 'node:fs/promises';
import {libraryFixture,runtimeContext as ctx} from './library-helpers.js';
import {ExportRecordSchema} from '../src/application/export-record.js';
import type {ExportRecord} from '../src/application/export-record.js';
import {SqliteLibraryRepository} from '../src/adapters/sqlite/repository.js';
import {DATABASE_NAME} from '../src/adapters/sqlite/engine.js';
import {PdfPreviewService} from '../src/application/pdf-preview.js';
import {RenderSnapshotFactory} from '../src/application/render-snapshot.js';
import {PresentationService} from '../src/application/presentation.js';
import {loadSimpleResources} from '../src/adapters/pdf/resources.js';
import {sha256} from '../src/adapters/asset-bytes.js';
import {createExportProjection} from '../src/domain/index.js';
const resources=()=>loadSimpleResources('resources/fonts');
async function setup(t:Parameters<typeof libraryFixture>[0]){
 const f=await libraryFixture(t),initial=await f.library.openCv(f.cvId);initial.personalInformation.photo=null;await f.library.confirmEntity(initial,initial.revision);
 const current=await f.library.openCv(f.cvId),{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=current.presentation;
 const cv=await new PresentationService(f.library,resources).confirm(current.id,current.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide});
 const snapshots=new RenderSnapshotFactory(f.library,resources,{normalize:async()=>{throw Error('No photo');}},sha256,ctx,'synthetic-engine');
 const record:ExportRecord=ExportRecordSchema.parse({recordVersion:1,id:ctx.newId(),cvId:cv.id,revision:cv.revision,templateRef:{id:'simple',version:1},rendererVersion:'simple-1',engineVersion:'test-engine',presentation:createExportProjection(cv).presentation,projectionDigest:'1'.repeat(64),compositionDigest:'2'.repeat(64),exportedAt:ctx.now(),sha256:'3'.repeat(64),byteLength:5,pageCount:1,structuralPolicy:'visible-export-v1'});
 return {...f,cv,snapshots,record};
}
test('F8 export receipt survives reopen and later CV commits without copying CV text or path',async t=>{
 const f=await setup(t),before=await f.library.snapshot();await f.repository.appendExport(f.record);assert.deepEqual(await f.library.snapshot(),before);
 await f.library.renameCv(f.cvId,'PRIVATE_LATER_NAME',f.cv.revision);await f.repository.close();const next=await f.open();assert.deepEqual(await next.repository.listExports(f.cvId),[f.record]);assert(!JSON.stringify(f.record).includes('Persona'));assert(!JSON.stringify(f.record).includes('/tmp'));assert.deepEqual((await next.repository.health()).integrity,['ok']);
});
test('F8 preview export records final verified bytes only; cancel and write failure do not create receipts',async t=>{
 const f=await setup(t);let mode='cancel';const bytes=new Uint8Array([37,80,68,70,1]);
 const preview=new PdfPreviewService(f.snapshots,f.library,{render:async()=>({bytes,pageCount:1})},{choose:async()=>mode==='cancel'?null:'/synthetic/test.pdf',write:async()=>{if(mode==='fail')throw Error('WRITE_FAILED');return {sha256:sha256(bytes),byteLength:bytes.length};}},sha256,ctx,f.repository);
 const generation=await preview.generate(f.cvId,f.cv.revision);assert.equal((await preview.export(generation.id,generation.sha256)).cancelled,true);assert.deepEqual(await f.repository.listExports(f.cvId),[]);
 mode='fail';await assert.rejects(preview.export(generation.id,generation.sha256),/WRITE_FAILED/);assert.deepEqual(await f.repository.listExports(f.cvId),[]);
 mode='save';await preview.export(generation.id,generation.sha256);const [r]=await f.repository.listExports(f.cvId);assert.equal(r!.sha256,generation.sha256);assert.equal(r!.compositionDigest,generation.fingerprint);assert.equal(r!.revision,generation.revision);
});
test('F8 receipt failure after file write is explicit, never reports normal success',async t=>{
 const f=await setup(t);let wrote=false;const bytes=new Uint8Array([37,80,68,70,1]);
 const preview=new PdfPreviewService(f.snapshots,f.library,{render:async()=>({bytes,pageCount:1})},{choose:async()=>'/synthetic.pdf',write:async()=>{wrote=true;return {sha256:sha256(bytes),byteLength:bytes.length};}},sha256,ctx,{appendExport:async()=>{throw Error('SQLITE_FULL');},listExports:async()=>[]});
 const g=await preview.generate(f.cvId,f.cv.revision);await assert.rejects(preview.export(g.id,g.sha256),/EXPORT_FILE_WRITTEN_RECORD_FAILED/);assert(wrote);assert.deepEqual(await f.repository.listExports(f.cvId),[]);
});
test('F8 deleting a CV removes its local receipts; invalid future records and owners are rejected atomically',async t=>{
 const f=await setup(t);await f.repository.appendExport(f.record);await assert.rejects(f.repository.appendExport({...f.record,id:ctx.newId(),revision:999}),/EXPORT_RECORD_OWNER_INVALID/);
 assert.throws(()=>ExportRecordSchema.parse({...f.record,recordVersion:2}));assert.throws(()=>ExportRecordSchema.parse({...f.record,templateRef:{id:'lateral',version:99}}));assert.equal((await f.repository.listExports(f.cvId)).length,1);
 await f.library.deleteCv(f.cvId,f.cv.revision,{confirm:true,deletePinnedHistory:true,discardDrafts:true});assert.deepEqual(await f.repository.listExports(f.cvId),[]);assert.equal((await f.repository.health()).foreignKeyViolations,0);
});
test('F8 migration v2 to v3 retains full library and creates a recoverable backup',async t=>{
 const f=await setup(t),expected=await f.library.snapshot();await f.repository.close();const db=new Database(join(f.directory,DATABASE_NAME));db.exec('DROP TABLE exports; DELETE FROM schema_migrations WHERE version=3; PRAGMA user_version=2;');db.close();
 const next=await f.open();assert.deepEqual(await next.library.snapshot(),expected);assert.equal((await next.repository.health()).schemaVersion,3);assert.deepEqual(await next.repository.listExports(f.cvId),[]);assert((await readdir(join(f.directory,'migrations'))).length>0);
});
test('F8 corrupt indexed export metadata is rejected on startup without rewriting it',async t=>{
 const f=await setup(t);await f.repository.appendExport(f.record);await f.repository.close();const file=join(f.directory,DATABASE_NAME),db=new Database(file);db.prepare('UPDATE exports SET sha256=?').run('f'.repeat(64));db.close();
 await assert.rejects(SqliteLibraryRepository.open(f.directory),/STORAGE_EXPORT_INDEX_MISMATCH/);const check=new Database(file,{readonly:true});assert.equal(check.prepare('SELECT sha256 FROM exports').pluck().get(),'f'.repeat(64));check.close();
});
test('F8 an export dialog keeps its frozen template/revision receipt while a newer Lateral generation completes',async t=>{
 const f=await setup(t);let release!:(path:string)=>void,n=0;const bytes=(n:number)=>new Uint8Array([37,80,68,70,n]);
 const preview=new PdfPreviewService(f.snapshots,f.library,{render:async()=>({bytes:bytes(++n),pageCount:1})},{choose:async()=>new Promise(r=>{release=r;}),write:async(_p,b)=>({sha256:sha256(b),byteLength:b.length})},sha256,ctx,f.repository);
 const first=await preview.generate(f.cvId,f.cv.revision),exported=preview.export(first.id,first.sha256);while(!release)await new Promise(r=>setTimeout(r,1));
 const {density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=f.cv.presentation;
 const later=await new PresentationService(f.library,resources).confirm(f.cvId,f.cv.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide,templateRef:{id:'lateral',version:1}});await preview.generate(f.cvId,later.revision);release('/synthetic/frozen.pdf');await exported;
 const [record]=await f.repository.listExports(f.cvId);assert.equal(record!.templateRef.id,'simple');assert.equal(record!.revision,first.revision);assert.equal(record!.sha256,first.sha256);assert.equal(record!.compositionDigest,first.fingerprint);
});
