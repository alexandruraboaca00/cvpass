import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {join} from 'node:path';
import {libraryFixture,runtimeContext} from './library-helpers.js';
import {libraryIndex} from '../src/application/library-index.js';
import {CoreEditorService} from '../src/application/editor.js';
import {DATABASE_NAME} from '../src/adapters/sqlite/engine.js';

test('F9 lightweight index matches validated library, returns metadata only and isolates mutations',async t=>{
 const f=await libraryFixture(t),expected=libraryIndex((await f.library.snapshot()).content),index=await f.repository.readIndex();assert.deepEqual(index,expected);
 assert.deepEqual(Object.keys(index!).sort(),['cvs','profileId','profileName','recovery','uiLocale']);assert(!('assetsById' in index!));assert(!('sectionsById' in index!.cvs[0]!));
 index!.cvs[0]!.name='Local mutation';index!.cvs.reverse();assert.deepEqual(await f.repository.readIndex(),expected);
 const next=await f.open();assert.deepEqual(await next.repository.readIndex(),expected);assert.equal((await next.library.health()).synchronous,2);
});
test('F9 initial editor listing uses the validated index without transporting full snapshots',async t=>{
 const f=await libraryFixture(t),original=f.repository.read.bind(f.repository);let reads=0;f.repository.read=async()=>{reads++;return original();};
 const editor=new CoreEditorService(f.library,runtimeContext);assert.deepEqual(await editor.start(),await f.repository.readIndex());assert.equal(reads,0);await editor.list();assert.equal(reads,0);
});
test('F9 index invalidates external metadata changes and rejects corrupt indexed names',async t=>{
 const f=await libraryFixture(t);await f.repository.readIndex();const next=await f.open();await next.library.setUiLocale('en');assert.equal((await f.repository.readIndex())!.uiLocale,'en');
 const db=new Database(join(f.directory,DATABASE_NAME));t.after(()=>db.close());db.prepare('UPDATE entities SET name=? WHERE kind=?').run('Corrupt external metadata','cv');await assert.rejects(f.repository.readIndex(),/STORAGE_INDEX_MISMATCH/);
});
test('F9 lightweight listing still revalidates asset bytes after external writes',async t=>{
 const f=await libraryFixture(t);await f.repository.readIndex();const db=new Database(join(f.directory,DATABASE_NAME));t.after(()=>db.close());
 db.prepare('UPDATE blobs SET bytes=zeroblob(byte_length)').run();await assert.rejects(f.repository.readIndex());
});
