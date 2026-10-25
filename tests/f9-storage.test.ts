import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {join} from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {SqliteEngine,DATABASE_NAME} from '../src/adapters/sqlite/engine.js';
import {SqliteLibraryRepository} from '../src/adapters/sqlite/repository.js';
import {assertDataTree,canonical,emptyPersonal} from '../src/domain/index.js';
import {libraryFixture} from './library-helpers.js';
import {f9Workspace} from './f9-fixtures.js';
import {cvprojCodec} from '../src/adapters/library-cvproj.js';
import {LibraryProjectFiles} from '../src/adapters/project-files.js';
import {CoreEditorService} from '../src/application/editor.js';
import {runtimeContext} from './library-helpers.js';

test('F9 validated read cache isolates caller mutations, invalidates external writes and preserves CAS rollback',async t=>{
  const directory=await mkdtemp('/tmp/cvforge-f9-cache-');t.after(()=>rm(directory,{recursive:true,force:true}));
  const engine=await SqliteEngine.open(directory);t.after(()=>engine.close());
  const f=await libraryFixture(t),s=(await f.library.snapshot()).content;engine.commit(null,s);
  const a=engine.read()!;a.content.workspace.cvOrder=[];assert.notDeepEqual(engine.read()!.content.workspace.cvOrder,[]);
  const db=new Database(join(directory,DATABASE_NAME));t.after(()=>db.close());
  db.prepare('UPDATE workspace SET generation=generation+1').run();assert.equal(engine.read()!.generation,1);
  assert.throws(()=>engine.commit(0,s),/LIBRARY_CONFLICT/);assert.equal(engine.read()!.generation,1);
  db.prepare('UPDATE entities SET name=? WHERE kind=?').run('invalid index','cv');assert.throws(()=>engine.read(),/STORAGE_INDEX_MISMATCH/);
});
test('F9 graph validation rejects accessors without invoking them and retains graph safety limits',()=>{
  let called=false;const v={};Object.defineProperty(v,'bad',{enumerable:true,get(){called=true;return 1;}});
  assert.throws(()=>assertDataTree(v),/data.accessor/);assert.equal(called,false);
  const a:any[]=[];a.push(a);assert.throws(()=>assertDataTree(a),/data.cycle/);
  assert.throws(()=>assertDataTree([,1]),/data.sparseOrExtendedArray/);assert.throws(()=>assertDataTree(-0),/data.negativeZero/);
});
test('F9 main-side snapshot cache uses exactly committed bytes and observes external changes without a generation bump',async t=>{
  const f=await libraryFixture(t),r=(await f.repository.read())!,before=structuredClone(r.content);
  const save=f.repository.commit(r.generation,r.content);r.content.workspace.cvOrder=[];await save;
  assert.deepEqual((await f.repository.read())!.content,before);
  const second=await SqliteLibraryRepository.open(f.directory);t.after(()=>second.close());const external=(await second.read())!;external.content.workspace.settings.uiLocale='en';await second.commit(external.generation,external.content);
  assert.equal((await f.repository.read())!.content.workspace.settings.uiLocale,'en');
  const db=new Database(join(f.directory,DATABASE_NAME));db.prepare('UPDATE entities SET name=? WHERE kind=?').run('invalid external index','cv');db.close();await assert.rejects(f.repository.read(),/STORAGE_INDEX_MISMATCH/);
});
test('F9 AC-06 two CV from a profile remain independent after CV and profile edits and reopening',async t=>{
  const f=await libraryFixture(t,false);const profile=await f.library.createProfile(emptyPersonal('F9 profile'));
  const template=f.fixture.snapshot.templates[0]!;
  const a=await f.library.createCv({name:'F9 A',documentLocale:'es',template,sectionIds:[]},profile.revision),b=await f.library.createCv({name:'F9 B',documentLocale:'es',template,sectionIds:[]},profile.revision);
  a.personalInformation.displayName='F9 A changed';await f.library.confirmEntity(a,a.revision);
  profile.personalInformation.displayName='F9 profile changed';await f.library.confirmEntity(profile,profile.revision);
  await f.repository.close();const next=await f.open();assert.deepEqual(await next.library.openCv(b.id),b);
  assert.equal((await next.library.openCv(a.id)).personalInformation.displayName,'F9 A changed');
  assert.equal((await next.library.snapshot()).content.workspace.profile!.personalInformation.displayName,'F9 profile changed');
});
test('F9 AC-08 complete workspace round-trip and an unwritable destination never acknowledge backup success',async t=>{
  const a=await libraryFixture(t),bytes=await a.library.exportCvproj(),before=await a.library.snapshot();
  const b=await libraryFixture(t,false);await b.library.importCvproj(bytes,{mode:'emptyWorkspace'});await b.repository.close();const next=await b.open();assert.deepEqual((await next.library.snapshot()).content,before.content);
  let success=false;await assert.rejects(async()=>{await new LibraryProjectFiles(a.library).export(join(a.directory,'missing','backup.cvproj'));success=true;});assert.equal(success,false);
  assert.equal(canonical((await a.library.snapshot()).content.workspace),canonical(before.content.workspace));
});
test('F9 reproducible 100-CV corpus preserves all eight areas, groups, partial levels and asset dependencies',()=>{
  const a=f9Workspace(),b=f9Workspace();assert.equal(canonical(a.snapshot),canonical(b.snapshot));
  if(a.snapshot.scope!=='workspace')throw Error();assert.equal(a.snapshot.workspace.cvOrder.length,100);
  const bytes=cvprojCodec.encode(a,'2026-10-23T12:00:00.000Z');assert.deepEqual(cvprojCodec.decode(bytes),a);
});
test('F9 unchanged form staging does not create another durable draft write before Confirmar',async t=>{
  const f=await libraryFixture(t),editor=new CoreEditorService(f.library,runtimeContext);
  const cv=await f.library.openCv(f.cvId),form=await editor.begin(cv.id,cv.revision,{kind:'personal'});await editor.flush();
  const before=await f.library.snapshot();editor.stage(structuredClone(form));await editor.flush();assert.equal((await f.library.snapshot()).generation,before.generation);
  form.cv.personalInformation.displayName='F9 confirmed';await editor.confirm(form);assert.equal((await f.library.openCv(cv.id)).personalInformation.displayName,'F9 confirmed');
});
test('F9 lossless worker transport rejects invalid JSON values without coercion or partial writes',async t=>{
  const f=await libraryFixture(t),before=(await f.repository.read())!;
  for(const value of [NaN,Infinity,-0,undefined]){
    const changed=structuredClone(before.content);
    (changed.workspace.settings as unknown as Record<string,unknown>).unexpected=value;
    await assert.rejects(f.repository.commit(before.generation,changed));
    assert.deepEqual(await f.repository.read(),before);
  }
  const cyclic=structuredClone(before.content);(cyclic.workspace.settings as unknown as Record<string,unknown>).cycle=cyclic.workspace.settings;
  await assert.rejects(f.repository.commit(before.generation,cyclic));assert.deepEqual(await f.repository.read(),before);
});
