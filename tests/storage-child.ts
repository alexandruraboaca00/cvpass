// Synthetic process harness. Never shipped as the application or used by a renderer.
import { SqliteLibraryRepository } from '../src/adapters/sqlite/repository.js';
import { SqliteEngine } from '../src/adapters/sqlite/engine.js';
import { LibraryService } from '../src/application/library.js';
import { cvprojCodec } from '../src/adapters/library-cvproj.js';
import { checkpoint, canonical } from '../src/domain/index.js';
import { safeError } from '../src/adapters/sqlite/protocol.js';
import { makeAsset, sha256 } from '../src/adapters/asset-bytes.js';
import { completeProjectFixture, syntheticPng } from './fixtures.js';
import { runtimeContext } from './library-helpers.js';

const [mode,directory] = process.argv.slice(2);
if (!directory) throw new Error('SYNTHETIC_DIRECTORY_REQUIRED');
const report = (value:unknown): void => { if (process.send) process.send(value); else process.stdout.write(JSON.stringify(value)+'\n'); };
if (mode === 'crashDraft' || mode === 'createClose') {
  const repository = await SqliteLibraryRepository.open(directory), library = new LibraryService(repository,runtimeContext,cvprojCodec);
  await library.initialize(); const fixture = completeProjectFixture();
  await library.importCvproj(cvprojCodec.encode(fixture,fixture.ctx.now()),{mode:'emptyWorkspace'});
  const cv = await library.openCv(fixture.snapshot.scope === 'workspace' ? fixture.snapshot.workspace.cvOrder[0]! : '');
  await library.createCheckpoint(cv.id,cv.revision,'beforeTranslation');
  const draft = await library.beginDraft(cv.id,cv.revision);
  await library.updateDraft(draft.id,0,{values:{description:'SYNTHETIC_RECOVERABLE_DRAFT'},rawDateInputs:{start:'2026-99-'},assetIds:[],templateRefs:[]});
  const record = await library.snapshot(), digest = sha256(new TextEncoder().encode(canonical({...record.content,blobs:[...record.content.blobs].map(([h,b])=>[h,sha256(b)])})));
  if (mode === 'createClose') await library.saveAndClose('preserveForRecovery');
  report({ready:true,cvId:cv.id,draftId:draft.id,generation:record.generation,digest});
  if (mode === 'crashDraft') process.on('message',() => {}); else process.disconnect?.();
} else if (mode === 'inspect') {
  const repository = await SqliteLibraryRepository.open(directory), record = await repository.read();
  if (!record) throw new Error('MISSING_SYNTHETIC_RECORD');
  const digest = sha256(new TextEncoder().encode(canonical({...record.content,blobs:[...record.content.blobs].map(([h,b])=>[h,sha256(b)])})));
  report({generation:record.generation,digest,health:await repository.health(),drafts:record.content.drafts.length});
  await repository.close(); process.disconnect?.();
} else if (mode === 'interruptTransaction' || mode === 'diskFull') {
  const engine = await SqliteEngine.open(directory,{transactionProbe(stage,db) {
    if (mode === 'interruptTransaction' && stage === 'afterEntities') process.kill(process.pid,'SIGKILL');
    if (mode === 'diskFull' && stage === 'beforeWrite') db.pragma(`max_page_count = ${Number(db.pragma('page_count',{simple:true}))}`);
  }});
  const before = engine.read(); if (!before) throw new Error('MISSING_SYNTHETIC_RECORD');
  const content = structuredClone(before.content), cv = content.workspace.cvsById[content.workspace.cvOrder[0]!]!;
  content.revisions.push(checkpoint(cv,runtimeContext,'edit'));
  cv.name = 'SYNTHETIC_INTERRUPTED_CHANGE'; cv.revision++; cv.updatedAt = runtimeContext.now();
  if (mode === 'diskFull') {
    const bytes = new Uint8Array(3*1024*1024).fill(42), asset = makeAsset(runtimeContext.newId(),bytes,'templateResource','font/ttf');
    content.assetsById[asset.id] = asset; content.blobs.set(asset.sha256,bytes);
    const original = content.templates.find(t => t.id === cv.presentation.templateRef.id && t.version === cv.presentation.templateRef.version)!;
    const next = {...original,version:original.version+1,resourceRefs:[{assetId:asset.id,license:'MIT',attribution:'Synthetic bytes for disk-full fault only'}]};
    content.templates.push(next); cv.presentation.templateRef = {id:next.id,version:next.version};
  }
  try { engine.commit(before.generation,content); report({saved:true}); }
  catch (error) { report({error:safeError(error).code,unchanged:canonical(engine.read()) === canonical(before),health:engine.health()}); }
  engine.close(); process.disconnect?.();
} else throw new Error('UNKNOWN_SYNTHETIC_MODE');
