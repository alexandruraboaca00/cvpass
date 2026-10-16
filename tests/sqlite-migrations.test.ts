import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { mkdtemp, readdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { SqliteEngine, DATABASE_NAME } from '../src/adapters/sqlite/engine.js';
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { migrations } from '../src/adapters/sqlite/migrations.js';
import { stateFromProject } from '../src/application/library-state.js';
import { completeProjectFixture } from './fixtures.js';

async function directory(t: {after:(fn:()=>Promise<unknown>)=>void}): Promise<string> {
  const dir = await mkdtemp('/tmp/cvforge-f3-migration-'); t.after(() => rm(dir,{recursive:true,force:true})); return dir;
}
async function seedV1(dir: string): Promise<ReturnType<typeof stateFromProject>> {
  const state = stateFromProject(completeProjectFixture());
  const engine = await SqliteEngine.open(dir); engine.commit(null,state); engine.close();
  const db = new Database(join(dir,DATABASE_NAME));
  db.exec('DROP TABLE draft_assets; DROP TABLE draft_templates; DROP TABLE drafts; DELETE FROM schema_migrations WHERE version=2; PRAGMA user_version=1;'); db.close();
  return state;
}
test('explicit v1 to v2 migration preserves real content and creates a consistent pre-migration WAL backup', async t => {
  const dir = await directory(t), expected = await seedV1(dir);
  const writer = new Database(join(dir,DATABASE_NAME));
  writer.pragma('journal_mode=WAL'); writer.prepare('UPDATE workspace SET generation=7').run();
  const engine = await SqliteEngine.open(dir); writer.close(); t.after(async () => engine.close());
  assert.deepEqual(engine.read(),{generation:7,content:expected});
  const backups = await readdir(join(dir,'migrations')); assert.equal(backups.length,1);
  const backup = new Database(join(dir,'migrations',backups[0]!),{readonly:true});
  assert.equal(backup.pragma('user_version',{simple:true}),1);
  assert.equal(backup.prepare('SELECT generation FROM workspace').pluck().get(),7);
  assert.equal(backup.pragma('integrity_check',{simple:true}),'ok'); backup.close();
  assert.equal((await stat(join(dir,DATABASE_NAME))).mode & 0o777,0o600);
});
test('failed migration rolls back schema, data and ledger, retains backup and can retry safely', async t => {
  const dir = await directory(t), expected = await seedV1(dir);
  const broken = [migrations[0]!,{...migrations[1]!,sql:'CREATE TABLE partial_upgrade(id INTEGER); INSERT INTO missing_table VALUES (1);'}];
  await assert.rejects(SqliteEngine.open(dir,{migrations:broken}),/no such table/);
  const db = new Database(join(dir,DATABASE_NAME));
  assert.equal(db.pragma('user_version',{simple:true}),1);
  assert.equal(db.prepare("SELECT count(*) FROM sqlite_master WHERE name='partial_upgrade'").pluck().get(),0);
  assert.equal(db.prepare('SELECT count(*) FROM schema_migrations').pluck().get(),1); db.close();
  assert.equal((await readdir(join(dir,'migrations'))).length,1);
  const retry = await SqliteEngine.open(dir); assert.deepEqual(retry.read()?.content,expected); retry.close();
});
test('future versions and migration checksum tampering are rejected without rewriting them', async t => {
  const dir = await directory(t); const engine = await SqliteEngine.open(dir); engine.close();
  const path = join(dir,DATABASE_NAME), db = new Database(path); db.pragma('user_version=99'); db.close();
  const before = await readFile(path);
  await assert.rejects(SqliteLibraryRepository.open(dir),/STORAGE_UNSUPPORTED_VERSION/);
  assert.deepEqual(await readFile(path),before);
  const edit = new Database(path); edit.pragma('user_version=2'); edit.exec("UPDATE schema_migrations SET checksum='invalid' WHERE version=1"); edit.close();
  await assert.rejects(SqliteLibraryRepository.open(dir),/MIGRATION_CHECKSUM_MISMATCH/);
});
test('corrupt database, inconsistent snapshots and missing reference indexes are explicit errors', async t => {
  const dir = await directory(t), path = join(dir,DATABASE_NAME);
  await writeFile(path,Buffer.from('synthetic corrupt database'));
  await assert.rejects(SqliteLibraryRepository.open(dir),/SQLITE_NOTADB/);
  await rm(path);
  const engine = await SqliteEngine.open(dir); engine.commit(null,stateFromProject(completeProjectFixture())); engine.close();
  const db = new Database(path); db.exec('DELETE FROM entity_assets'); db.close();
  await assert.rejects(SqliteLibraryRepository.open(dir),/STORAGE_REFERENCE_INDEX_MISMATCH/);
});
test('SQLite constraints protect basic referential integrity independently of domain validation', async t => {
  const dir = await directory(t); const engine = await SqliteEngine.open(dir); engine.commit(null,stateFromProject(completeProjectFixture())); engine.close();
  const db = new Database(join(dir,DATABASE_NAME)); db.pragma('foreign_keys=ON');
  assert.throws(() => db.prepare('INSERT INTO entity_assets VALUES (?,?)').run('00000000-0000-4000-8000-000000123456','00000000-0000-4000-8000-000000654321'),/FOREIGN KEY/);
  assert.throws(() => db.exec("UPDATE entities SET revision=-1"),/CHECK/);
  assert.throws(() => db.exec("UPDATE revisions SET retention='ordinary' WHERE cause='beforeTranslation'"),/CHECK/);
  db.close();
});
test('modified blob bytes and invalid stored domain snapshots cannot be silently opened or repaired', async t => {
  const dir = await directory(t), engine = await SqliteEngine.open(dir), state = stateFromProject(completeProjectFixture());
  engine.commit(null,state); engine.close();
  const path = join(dir,DATABASE_NAME), db = new Database(path), original = db.prepare<[],{sha256:string;bytes:Buffer}>('SELECT sha256,bytes FROM blobs').get()!;
  const broken = Buffer.from(original.bytes); broken[broken.length-1] = broken[broken.length-1]! ^ 1;
  db.prepare('UPDATE blobs SET bytes=? WHERE sha256=?').run(broken,original.sha256); db.close();
  await assert.rejects(SqliteLibraryRepository.open(dir),/DOMAIN_INVALID/);
  const repair = new Database(path); repair.prepare('UPDATE blobs SET bytes=? WHERE sha256=?').run(original.bytes,original.sha256);
  const owner = state.workspace.cvOrder[0]!, text = JSON.stringify({...state.workspace.cvsById[owner],unsupportedFutureField:'SYNTHETIC_SENTINEL'});
  repair.prepare('UPDATE entities SET snapshot_json=? WHERE id=?').run(text,owner); repair.close();
  await assert.rejects(SqliteLibraryRepository.open(dir),/DOMAIN_INVALID/);
  const verify = new Database(path,{readonly:true}); assert.equal(verify.prepare('SELECT snapshot_json FROM entities WHERE id=?').pluck().get(owner),text); verify.close();
});
