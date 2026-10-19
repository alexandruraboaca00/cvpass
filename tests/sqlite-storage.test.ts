import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { stateFromProject } from '../src/application/library-state.js';
import { completeProjectFixture } from './fixtures.js';

test('SQLite worker round-trips a complete synthetic library across new instances', async t => {
  const directory = await mkdtemp(join('/tmp','cvforge-f3-storage-'));
  t.after(() => rm(directory,{recursive:true,force:true}));
  const fixture = completeProjectFixture(), content = stateFromProject(fixture);
  const first = await SqliteLibraryRepository.open(directory);
  assert.equal(await first.read(),null);
  assert.equal(await first.commit(null,content),0);
  await first.close();
  const second = await SqliteLibraryRepository.open(directory); t.after(() => second.close());
  assert.deepEqual((await second.read())?.content,content);
  const health = await second.health();
  assert.deepEqual(health.integrity,['ok']); assert.equal(health.foreignKeyViolations,0);
  assert.equal(health.schemaVersion,3); assert.equal(health.journalMode,'wal'); assert.equal(health.synchronous,2);
  assert.equal(health.counts.blobs,1); assert.equal(health.counts.entities,3);
  await assert.rejects(second.commit(null,content),/LIBRARY_CONFLICT/);
  const invalid = structuredClone(content); invalid.workspace.cvOrder.reverse(); invalid.workspace.cvOrder.push(invalid.workspace.cvOrder[0]!);
  await assert.rejects(second.commit(0,invalid),/DOMAIN_INVALID/);
  assert.equal((await second.read())?.generation,0);
});
