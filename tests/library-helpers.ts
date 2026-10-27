import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { TestContext } from 'node:test';
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { LibraryService } from '../src/application/library.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';
import { completeProjectFixture } from './fixtures.js';

// A deterministic synthetic clock after the F2 fixture timestamps; not the machine clock.
export const runtimeContext = {newId:randomUUID,now:()=> '2026-10-17T12:00:00.000Z'};
export async function libraryFixture(t: TestContext, seed = true) {
  const directory = await mkdtemp(join(tmpdir(),'cvforge-f3-library-'));
  const repositories: SqliteLibraryRepository[] = [];
  const open = async () => {
    const repository = await SqliteLibraryRepository.open(directory); repositories.push(repository);
    return {repository,library:new LibraryService(repository,runtimeContext,cvprojCodec)};
  };
  t.after(async () => { for (const r of repositories) await r.close(); await rm(directory,{recursive:true,force:true}); });
  const {repository,library} = await open(); await library.initialize();
  const fixture = completeProjectFixture();
  if (seed) await library.importCvproj(cvprojCodec.encode(fixture,fixture.ctx.now()),{mode:'emptyWorkspace'});
  const record = await library.snapshot();
  return {directory,repository,library,fixture,record,open,cvId:record.content.workspace.cvOrder[0]!};
}
