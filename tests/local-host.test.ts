import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, symlink, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openLocalLibrary } from '../src/host/local-library.js';
import { emptyPersonal } from '../src/domain/index.js';
import { runtimeContext } from './library-helpers.js';
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { DATABASE_NAME } from '../src/adapters/sqlite/engine.js';
import { template } from './fixtures.js';

test('trusted Electron userData capability chooses external storage and flushes draft controllers before close', async t => {
  const userData = await mkdtemp('/tmp/cvforge-f3-host-'); t.after(() => rm(userData,{recursive:true,force:true}));
  const requested: string[] = [], app = {getPath(name:'userData') { requested.push(name); return userData; }};
  const first = await openLocalLibrary(app,runtimeContext); await first.library.initialize();
  const profile = await first.library.createProfile(emptyPersonal('Nombre sintético'));
  const cv = await first.library.createCv({name:'CV local',documentLocale:'es',template,sectionIds:[]},profile.revision);
  const d = await first.library.beginDraft(cv.id,cv.revision), autosaver = first.autosaver(d);
  autosaver.schedule({values:{notes:'Trabajo pendiente sintético'},rawDateInputs:{},assetIds:[],templateRefs:[]});
  await first.close('preserveForRecovery');
  assert.deepEqual(requested,['userData']); assert.equal((await stat(join(userData,'library',DATABASE_NAME))).isFile(),true);
  const second = await openLocalLibrary(app,runtimeContext);
  assert.deepEqual((await second.library.acceptRecovery(d.id)).values,{notes:'Trabajo pendiente sintético'});
  assert.equal((await second.library.openCv(cv.id)).name,'CV local'); await second.close('discard');
});
test('storage rejects repository paths and symbolic-link database files without reading their target', async t => {
  await assert.rejects(SqliteLibraryRepository.open(process.cwd()),/STORAGE_INSIDE_REPOSITORY/);
  const outside = await mkdtemp('/tmp/cvforge-f3-symlink-'); t.after(() => rm(outside,{recursive:true,force:true}));
  const target = join(outside,'synthetic-target.txt');
  const {writeFile} = await import('node:fs/promises'); await writeFile(target,'PRIVATE_SYNTHETIC_SENTINEL');
  const directory = join(outside,'storage'); const {mkdir} = await import('node:fs/promises'); await mkdir(directory);
  await symlink(target,join(directory,DATABASE_NAME));
  await assert.rejects(SqliteLibraryRepository.open(directory),/STORAGE_UNSAFE_PATH/);
  assert.equal(await readFile(target,'utf8'),'PRIVATE_SYNTHETIC_SENTINEL');
  const link = join(outside,'project-link'); await symlink(process.cwd(),link);
  await assert.rejects(SqliteLibraryRepository.open(join(link,'do-not-create-library')),/STORAGE_INSIDE_REPOSITORY/);
});
test('application and domain have no SQLite/filesystem/Electron/network adapter dependencies', async () => {
  for (const directory of ['src/application','src/domain']) for (const name of await readdir(directory)) {
    if (!name.endsWith('.ts')) continue;
    const source = await readFile(join(directory,name),'utf8');
    for (const match of source.matchAll(/^\s*(?:import|export)\s+[^;\n]*?\bfrom\s*['"]([^'"]+)['"]/gm)) {
      assert(match[1] === 'zod' || match[1]!.startsWith('./') || match[1]!.startsWith('../domain/'),`${name}: ${match[1]}`);
    }
    assert(!/\b(?:require|import)\s*\(/.test(source));
    assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(source));
  }
});
