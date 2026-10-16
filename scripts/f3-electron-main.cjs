// Technical F3 harness: no editor, no renderer, synthetic data only.
const {app} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const output = process.env.CVFORGE_F3_OUTPUT;
if (!output || !path.isAbsolute(output)) throw new Error('SYNTHETIC_OUTPUT_REQUIRED');
app.setPath('userData',path.join(output,'userData'));
async function main() {
  await app.whenReady();
  const root = path.resolve(__dirname,'..');
  const load = file => import(pathToFileURL(path.join(root,file)).href);
  const {openLocalLibrary} = await load('dist/src/host/local-library.js');
  const {cvprojCodec} = await load('dist/src/adapters/library-cvproj.js');
  const {projectFromState} = await load('dist/src/application/library-state.js');
  const {canonical} = await load('dist/src/domain/index.js');
  const {sha256} = await load('dist/src/adapters/asset-bytes.js');
  const {completeProjectFixture} = await load('dist/tests/fixtures.js');
  const {runtimeContext} = await load('dist/tests/library-helpers.js');
  const digest = record => sha256(new TextEncoder().encode(canonical({...record.content,blobs:[...record.content.blobs].map(([h,b])=>[h,sha256(b)])})));
  const mode = process.argv.includes('--create') ? 'create' : 'reopen';
  const host = await openLocalLibrary(app,runtimeContext);
  let result;
  if (mode === 'create') {
    await host.library.initialize(); const fixture = completeProjectFixture();
    await host.library.importCvproj(cvprojCodec.encode(fixture,fixture.ctx.now()),{mode:'emptyWorkspace'});
    const cv = await host.library.openCv(fixture.snapshot.workspace.cvOrder[0]);
    const checkpoint = await host.library.createCheckpoint(cv.id,cv.revision,'beforeTranslation');
    const changed = await host.library.renameCv(cv.id,'CV sintético confirmado F3',cv.revision);
    const draft = await host.library.beginDraft(cv.id,changed.revision), saver = host.autosaver(draft);
    saver.schedule({values:{description:'SYNTHETIC_ELECTRON_DRAFT'},rawDateInputs:{end:'2026-99-'},assetIds:[],templateRefs:[]});
    await saver.flush();
    const record = await host.library.snapshot();
    result = {cvId:cv.id,checkpointId:checkpoint.id,draftId:draft.id,digest:digest(record),health:await host.library.health()};
    await host.close('preserveForRecovery');
  } else {
    const created = JSON.parse(fs.readFileSync(path.join(output,'electron-create.json'),'utf8'));
    const record = await host.library.snapshot(); assert.equal(digest(record),created.digest);
    const pending = await host.library.acceptRecovery(created.draftId); assert.equal(pending.values.description,'SYNTHETIC_ELECTRON_DRAFT');
    await host.library.discardDraft(pending.id,pending.version);
    const cv = await host.library.openCv(created.cvId);
    const restored = await host.library.restoreCheckpoint(cv.id,created.checkpointId,cv.revision);
    assert.equal(restored.revision,cv.revision+1);
    const expected = projectFromState((await host.library.snapshot()).content);
    const bytes = await host.library.exportCvproj();
    const health = await host.library.health(); assert.deepEqual(health.integrity,['ok']); assert.equal(health.foreignKeyViolations,0);
    await host.close('preserveForRecovery');
    fs.mkdirSync(path.join(output,'restored'),{recursive:true}); app.setPath('userData',path.join(output,'restored'));
    const copy = await openLocalLibrary(app,runtimeContext); await copy.library.initialize();
    await copy.library.importCvproj(bytes,{mode:'emptyWorkspace'}); await copy.close('preserveForRecovery');
    const again = await openLocalLibrary(app,runtimeContext);
    assert.deepEqual(projectFromState((await again.library.snapshot()).content),expected);
    result = {digestBeforeRecovery:created.digest,digestMatched:true,draftRecovered:true,checkpointRestored:true,portableReopened:true,health:await again.library.health()};
    await again.close('preserveForRecovery');
  }
  result.runtime = {electron:process.versions.electron,node:process.versions.node,modules:process.versions.modules};
  fs.writeFileSync(path.join(output,`electron-${mode}.json`),JSON.stringify(result,null,2)+'\n'); app.exit(0);
}
main().catch(error => { console.error('F3_PROBE_FAILED',error.code || error.name || 'UNKNOWN'); app.exit(1); });
