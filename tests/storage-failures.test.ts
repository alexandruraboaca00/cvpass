import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { LibraryService } from '../src/application/library.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';
import { libraryFixture, runtimeContext } from './library-helpers.js';

function child(mode: string, directory: string): ChildProcess {
  return fork(new URL('./storage-child.js',import.meta.url),[mode,directory],{execArgv:[],stdio:['ignore','pipe','pipe','ipc']});
}
function message<T>(process: ChildProcess): Promise<T> {
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => { process.kill('SIGKILL'); reject(new Error('SYNTHETIC_CHILD_TIMEOUT')); },20000);
    process.once('message',value => { clearTimeout(timer); resolve(value as T); });
    process.once('error',error => { clearTimeout(timer); reject(error); });
    process.once('exit',code => { clearTimeout(timer); reject(new Error(`SYNTHETIC_CHILD_EXIT_${code}`)); });
  });
}
function exited(process: ChildProcess): Promise<{code:number|null;signal:string|null}> {
  return new Promise(resolve => process.once('exit',(code,signal) => resolve({code,signal})));
}
test('real SIGKILL after acknowledged draft writes recovers confirmed data and offers draft separately', async t => {
  const directory = await mkdtemp('/tmp/cvforge-f3-crash-'); t.after(() => rm(directory,{recursive:true,force:true}));
  const process = child('crashDraft',directory); t.after(() => { if (process.exitCode === null) process.kill('SIGKILL'); });
  const ready = await message<{cvId:string;draftId:string;generation:number}>(process), done = exited(process);
  process.kill('SIGKILL'); assert.equal((await done).signal,'SIGKILL');
  const repository = await SqliteLibraryRepository.open(directory); t.after(() => repository.close());
  const library = new LibraryService(repository,runtimeContext,cvprojCodec), cv = await library.openCv(ready.cvId);
  assert.equal((await library.snapshot()).generation,ready.generation);
  assert(!JSON.stringify(cv).includes('SYNTHETIC_RECOVERABLE_DRAFT'));
  assert.equal((await library.recoverableDrafts()).length,1);
  assert.deepEqual((await library.acceptRecovery(ready.draftId)).rawDateInputs,{start:'2026-99-'});
  assert((await library.listRevisions(cv.id)).some(r => r.cause === 'beforeTranslation'));
  assert.deepEqual((await repository.health()).integrity,['ok']);
});
test('SIGKILL inside a real SQLite transaction rolls back content, resources, indexes and generation', async t => {
  const {library,repository,directory,open} = await libraryFixture(t), before = await library.snapshot(); await repository.close();
  const process = child('interruptTransaction',directory); const done = await exited(process);
  assert.equal(done.signal,'SIGKILL');
  const next = await open(); assert.deepEqual(await next.library.snapshot(),before);
  const health = await next.repository.health(); assert.deepEqual(health.integrity,['ok']); assert.equal(health.foreignKeyViolations,0);
});
test('real SQLITE_FULL cannot acknowledge success; transaction and original library remain recoverable', async t => {
  const {library,repository,directory,open} = await libraryFixture(t), before = await library.snapshot(); await repository.close();
  const process = child('diskFull',directory), done = exited(process);
  const result = await message<{error:string;unchanged:boolean;saved?:boolean}>(process); assert.equal((await done).code,0);
  assert.equal(result.error,'SQLITE_FULL'); assert.equal(result.unchanged,true); assert.equal(result.saved,undefined);
  assert.deepEqual(await (await open()).library.snapshot(),before);
});
test('two separate clean process instances preserve the complete library digest and SQLite integrity', async t => {
  const directory = await mkdtemp('/tmp/cvforge-f3-two-process-'); t.after(() => rm(directory,{recursive:true,force:true}));
  const first = child('createClose',directory), firstDone = exited(first), created = await message<{digest:string;generation:number}>(first);
  assert.equal((await firstDone).code,0);
  const second = child('inspect',directory), secondDone = exited(second), opened = await message<{digest:string;generation:number;drafts:number;health:{integrity:string[];foreignKeyViolations:number}}>(second);
  assert.equal((await secondDone).code,0); assert.equal(created.digest,opened.digest); assert.equal(created.generation,opened.generation);
  assert.equal(opened.drafts,1); assert.deepEqual(opened.health.integrity,['ok']); assert.equal(opened.health.foreignKeyViolations,0);
});
