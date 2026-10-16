import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile, writeFile, symlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { libraryFixture } from './library-helpers.js';
import { LibraryProjectFiles, readProjectFile, writeProjectFile } from '../src/adapters/project-files.js';
import { projectFromState } from '../src/application/library-state.js';
import { sha256 } from '../src/adapters/asset-bytes.js';

test('real cvproj file restores a complete workspace into an empty durable library and survives reopen', async t => {
  const source = await libraryFixture(t), target = await libraryFixture(t,false), files = new LibraryProjectFiles(source.library);
  const path = join(source.directory,'synthetic-library.cvproj'), receipt = await files.export(path);
  const bytes = await readProjectFile(path); assert.equal(receipt.sha256,sha256(bytes)); assert.equal(receipt.byteLength,bytes.length);
  assert.equal((await stat(path)).mode & 0o777,0o600);
  await new LibraryProjectFiles(target.library).import(path,{mode:'emptyWorkspace'}); await target.repository.close();
  const reopened = await target.open();
  assert.deepEqual(projectFromState((await reopened.library.snapshot()).content),projectFromState((await source.library.snapshot()).content));
  assert.deepEqual((await reopened.repository.health()).integrity,['ok']);
});
test('atomic project writes preserve an existing destination unless overwrite is explicit and clean failed temporaries', async t => {
  const directory = await mkdtemp('/tmp/cvforge-f3-files-'); t.after(() => rm(directory,{recursive:true,force:true}));
  const target = join(directory,'synthetic.cvproj'), original = new Uint8Array([1,2,3]), next = new Uint8Array([4,5]);
  await writeProjectFile(target,original);
  await assert.rejects(writeProjectFile(target,next),{code:'EEXIST'}); assert.deepEqual(new Uint8Array(await readFile(target)),original);
  assert.deepEqual(await readdir(directory),['synthetic.cvproj']);
  await writeProjectFile(target,next,true); assert.deepEqual(await readProjectFile(target),next);
  await assert.rejects(writeProjectFile(directory,next,true)); assert.deepEqual(await readdir(directory),['synthetic.cvproj']);
});
test('corrupt, oversized and symbolic project files fail before any library mutation', async t => {
  const {library,directory} = await libraryFixture(t), before = await library.snapshot(), path = join(directory,'corrupt.cvproj');
  await writeFile(path,'synthetic corrupt archive');
  await assert.rejects(new LibraryProjectFiles(library).import(path,{mode:'copyCv'}));
  await assert.rejects(readProjectFile(path,4),/PROJECT_FILE_SIZE_OR_TYPE/);
  const linked = join(directory,'linked.cvproj'); await symlink(path,linked);
  await assert.rejects(readProjectFile(linked)); assert.deepEqual(await library.snapshot(),before);
});
