import test from 'node:test';
import type {TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import Database from 'better-sqlite3';
import {SqliteEngine,DATABASE_NAME} from '../src/adapters/sqlite/engine.js';
import {LibraryService} from '../src/application/library.js';
import {stateFromProject} from '../src/application/library-state.js';
import {cvprojCodec} from '../src/adapters/library-cvproj.js';
import {f9Workspace} from './f9-fixtures.js';
import type {LibraryContent} from '../src/application/contracts.js';

const ctx={newId:randomUUID,now:()=> '2026-10-25T12:00:00.000Z'};
async function fixture(t:TestContext){
  const directory=await mkdtemp('/tmp/cvforge-f9-single-');let closed=false;
  const control={armed:false,fail:false,changes:0,base:0,hook:undefined as undefined|(()=>void)};
  const engine=await SqliteEngine.open(directory,{transactionProbe(stage,db){
    if(!control.armed)return;
    if(stage==='beforeWrite')control.base=Number(db.prepare('SELECT total_changes()').pluck().get());
    if(stage==='afterEntities'){control.changes=Number(db.prepare('SELECT total_changes()').pluck().get())-control.base;if(control.fail)throw new Error('injected-after-entity');}
  }});
  const close=()=>{if(!closed){engine.close();closed=true;}};t.after(async()=>{close();await rm(directory,{recursive:true,force:true});});
  engine.commit(null,stateFromProject(f9Workspace(6)));
  const repository={read:async()=>engine.read(),commit:async(g:number|null,c:LibraryContent)=>{control.hook?.();return engine.commit(g,c);},health:async()=>engine.health(),backup:()=>engine.backup(),close:async()=>close()};
  const library=new LibraryService(repository,ctx,cvprojCodec);return {directory,engine,library,control,close};
}
async function roundtrip(t:TestContext,kind:'cv'|'profile'){
  const f=await fixture(t),initial=(await f.library.snapshot()).content;
  const entity=kind==='cv'?initial.workspace.cvsById[initial.workspace.cvOrder[1]!]!:initial.workspace.profile!;
  const d=await f.library.beginDraft(entity.id,entity.revision),candidate=structuredClone(entity);candidate.personalInformation.displayName='Confirmed synthetic '+kind;
  const staged=await f.library.updateDraft(d.id,d.version,{values:candidate,rawDateInputs:{},assetIds:[],templateRefs:[]});
  f.control.armed=true;const saved=await f.library.confirmDraft(d.id,staged.version,candidate);
  assert.equal(f.control.changes,1,'only one entity row is written before afterEntities');
  const after=(await f.library.snapshot()).content;
  assert.equal(after.revisions.length,initial.revisions.length+1);assert.equal(after.drafts.length,0);
  assert.deepEqual(after.revisions.at(-1)!.snapshot,entity);assert.equal(saved.revision,entity.revision+1);
  for(const id of initial.workspace.cvOrder)if(id!==entity.id)assert.deepEqual(after.workspace.cvsById[id],initial.workspace.cvsById[id]);
  if(kind==='cv')assert.deepEqual(after.workspace.profile,initial.workspace.profile);
  assert.deepEqual(after.blobs,initial.blobs);assert.deepEqual(after.assetsById,initial.assetsById);
  assert.equal(f.engine.health().journalMode,'wal');assert.equal(f.engine.health().synchronous,2);
  f.close();const reopened=await SqliteEngine.open(f.directory);try{assert.deepEqual(reopened.read()!.content,after);assert.equal(reopened.health().integrity.join(','),'ok');assert.equal(reopened.health().foreignKeyViolations,0);}finally{reopened.close();}
}
test('F9 single CV confirmation writes one entity, preserves other CV/assets and reopens with durable revision and no draft',t=>roundtrip(t,'cv'));
test('F9 single MasterProfile confirmation preserves every materialized CV and reopens exact content',t=>roundtrip(t,'profile'));
test('F9 narrow confirmation rollback retains the draft and confirmed state, then retry creates exactly one revision',async t=>{
  const f=await fixture(t),entity=await f.library.openCv((await f.library.listCvs())[1]!.id),d=await f.library.beginDraft(entity.id,entity.revision);
  const candidate=structuredClone(entity);candidate.personalInformation.displayName='Retry synthetic';
  const staged=await f.library.updateDraft(d.id,d.version,{values:candidate,rawDateInputs:{},assetIds:[],templateRefs:[]}),before=await f.library.snapshot();
  f.control.armed=true;f.control.fail=true;await assert.rejects(f.library.confirmDraft(d.id,staged.version,candidate),/injected-after-entity/);
  assert.equal(f.control.changes,1);assert.deepEqual(await f.library.snapshot(),before);
  f.control.fail=false;await f.library.confirmDraft(d.id,staged.version,candidate);
  const after=await f.library.snapshot();assert.equal(after.content.revisions.length,before.content.revisions.length+1);assert.equal(after.content.drafts.length,0);
  f.close();const reopened=await SqliteEngine.open(f.directory);try{assert.deepEqual(reopened.read(),after);}finally{reopened.close();}
});
test('F9 external state change without a generation bump disables narrow writes rather than trusting stale cache',async t=>{
  const f=await fixture(t),initial=(await f.library.snapshot()).content,[a,b]=initial.workspace.cvOrder;
  const entity=initial.workspace.cvsById[a!]!,d=await f.library.beginDraft(entity.id,entity.revision),candidate=structuredClone(entity);candidate.personalInformation.displayName='Edited synthetic';
  const staged=await f.library.updateDraft(d.id,d.version,{values:candidate,rawDateInputs:{},assetIds:[],templateRefs:[]});
  f.control.armed=true;f.control.hook=()=>{f.control.hook=undefined;const db=new Database(join(f.directory,DATABASE_NAME));try{const other=structuredClone(initial.workspace.cvsById[b!]!);other.name='External same-generation value';db.prepare('UPDATE entities SET name=?,snapshot_json=? WHERE id=?').run(other.name,JSON.stringify(other),other.id);}finally{db.close();}};
  await f.library.confirmDraft(d.id,staged.version,candidate);
  assert(f.control.changes>1,'unknown external state must use the complete replacement transaction');
  const after=(await f.library.snapshot()).content;assert.deepEqual(after.workspace.cvsById[b!],initial.workspace.cvsById[b!]);
  f.close();const reopened=await SqliteEngine.open(f.directory);try{assert.deepEqual(reopened.read()!.content,after);}finally{reopened.close();}
});
