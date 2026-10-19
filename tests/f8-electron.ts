import { app } from 'electron';
import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ChromiumPdfRenderer } from '../src/adapters/pdf/chromium.js';
import { loadSimpleResources } from '../src/adapters/pdf/resources.js';
import { nativeImageNormalizer } from '../src/adapters/pdf/normalize-image.js';
import { createExportProjection, canonical } from '../src/domain/index.js';
import { sha256 } from '../src/adapters/asset-bytes.js';
import type { RenderSnapshot } from '../src/application/render-contract.js';
import { completeProjectFixture } from './fixtures.js';
import { f8Corpus,f8Context } from './f8-fixtures.js';
app.on('window-all-closed',()=>{});
async function main(){try{
 await app.whenReady();const output=process.env.CVFORGE_F8_OUTPUT??'/tmp/cvforge-f8/render';await mkdir(output,{recursive:true});
 const renderer=new ChromiumPdfRenderer(),catalog=await loadSimpleResources('resources/fonts'),fixture=completeProjectFixture(),results=[];
 for(const item of f8Corpus())for(const template of ['simple','lateral'] as const){
  const cv=structuredClone(item.cv);cv.presentation.templateRef={id:template,version:1};const before=canonical(cv),placement=cv.personalInformation.photo!,asset=fixture.snapshot.assetsById[placement.assetId]!,image=await nativeImageNormalizer.normalize(asset,fixture.blobs.get(asset.sha256)!,placement);
  const projection=createExportProjection(cv,()=>image),start=performance.now(),snapshot:RenderSnapshot={id:randomUUID(),cvId:cv.id,revision:cv.revision,capturedAt:f8Context.now(),fingerprint:'synthetic',projectionDigest:sha256(new TextEncoder().encode(canonical(projection))),rendererVersion:template==='simple'?'simple-1':'lateral-1',engineVersion:process.versions.chrome!,resourceVersion:catalog.resourceVersion,projection,fonts:catalog.fonts};
  console.log('Rendering',item.name,template);
  const artifact=await renderer.render(snapshot,new AbortController().signal);assert.equal(canonical(cv),before);
  if(item.name==='small')assert.equal(artifact.pageCount,1);
  const name=item.name+'-'+template;await writeFile(join(output,name+'.pdf'),artifact.bytes);await writeFile(join(output,name+'-projection.json'),JSON.stringify(projection));
  results.push({name,template,snapshotToPdfMs:performance.now()-start,pageCount:artifact.pageCount,pdfBytes:artifact.bytes.length,sha256:sha256(artifact.bytes)});
 }
 await writeFile(join(output,'metrics.json'),JSON.stringify({chromium:process.versions.chrome,results},null,2));console.log('F8 render PASS');app.exit(0);
}catch(e){console.error(e);app.exit(1);}}void main();
