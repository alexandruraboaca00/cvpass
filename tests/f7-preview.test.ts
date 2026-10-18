import test from 'node:test';
import assert from 'node:assert/strict';
import { PdfPreviewService } from '../src/application/pdf-preview.js';
import { RenderSnapshotFactory } from '../src/application/render-snapshot.js';
import { PresentationService } from '../src/application/presentation.js';
import type { PdfArtifact, PdfDestination, PdfRenderPort } from '../src/application/render-contract.js';
import { loadSimpleResources } from '../src/adapters/pdf/resources.js';
import { sha256 } from '../src/adapters/asset-bytes.js';
import { libraryFixture, runtimeContext as ctx } from './library-helpers.js';
import { simpleHtml, richHtml, formatDate } from '../src/adapters/pdf/simple.js';
import { assertFontCoverage } from '../src/adapters/pdf/font-coverage.js';
const resources=()=>loadSimpleResources('resources/fonts');
const artifact=(value:number):PdfArtifact=>({bytes:new Uint8Array([37,80,68,70,value]),pageCount:1});
async function setup(t:Parameters<typeof libraryFixture>[0],renderer:PdfRenderPort,destination:PdfDestination={choose:async()=>null,write:async()=>{throw Error('Unexpected write');}}){
 const f=await libraryFixture(t),cv=await f.library.openCv(f.cvId);cv.personalInformation.photo=null;await f.library.confirmEntity(cv,cv.revision);
 const current=await f.library.openCv(f.cvId),{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide}=current.presentation;
 const selected=await new PresentationService(f.library,resources).confirm(f.cvId,current.revision,{density,accentColor,fontFamily,numbering,datePrecision,showCefrGuide});
 const snapshots=new RenderSnapshotFactory(f.library,resources,{normalize:async()=>{throw Error('No photo');}},sha256,ctx,'synthetic-engine');
 return {...f,cv:selected,snapshots,preview:new PdfPreviewService(snapshots,f.library,renderer,destination,sha256,ctx)};
}
test('F7 obsolete completion cannot publish over a newer generation even when the renderer ignores abort',async t=>{
 const releases:Array<(a:PdfArtifact)=>void>=[],renderer:PdfRenderPort={render:async()=>new Promise(resolve=>releases.push(resolve))},f=await setup(t,renderer);
 const first=f.preview.generate(f.cvId,f.cv.revision);const rejected=assert.rejects(first,/RENDER_OBSOLETE/);
 while(releases.length<1)await new Promise(r=>setTimeout(r,1));
 const second=f.preview.generate(f.cvId,f.cv.revision);while(releases.length<2)await new Promise(r=>setTimeout(r,1));releases[1]!(artifact(2));const ready=await second;releases[0]!(artifact(1));await rejected;
 assert.equal(ready.bytes[4],2);assert.deepEqual(await f.preview.export(ready.id,ready.sha256),{cancelled:true});
});
test('F7 render failure leaves library unchanged and retry works',async t=>{
 let fails=true;const f=await setup(t,{render:async()=>{if(fails)throw Error('Synthetic render failure');return artifact(3);}}),before=await f.library.snapshot();
 await assert.rejects(f.preview.generate(f.cvId,f.cv.revision),/Synthetic render failure/);assert.deepEqual(await f.library.snapshot(),before);fails=false;assert.equal((await f.preview.generate(f.cvId,f.cv.revision)).bytes[4],3);
});
test('F7 editor writes finish during generation; changed revision rejects an old artifact',async t=>{
 let release!:(a:PdfArtifact)=>void;const f=await setup(t,{render:async()=>new Promise(r=>{release=r;})}),pending=f.preview.generate(f.cvId,f.cv.revision),rejected=assert.rejects(pending,/RENDER_OBSOLETE/);
 while(!release)await new Promise(r=>setTimeout(r,1));await f.library.renameCv(f.cvId,'Confirmed during render',f.cv.revision);release(artifact(1));await rejected;assert.equal((await f.library.openCv(f.cvId)).name,'Confirmed during render');
});
test('F7 export captures exact preview bytes before destination dialog, even if another generation completes',async t=>{
 let choose!:(path:string)=>void,written:Uint8Array|undefined,n=0;const f=await setup(t,{render:async()=>artifact(++n)},{choose:async()=>new Promise(r=>{choose=r;}),write:async(_path,bytes)=>{written=bytes;return {sha256:sha256(bytes),byteLength:bytes.length};}});
 const first=await f.preview.generate(f.cvId,f.cv.revision),saved=structuredClone(first.bytes),exported=f.preview.export(first.id,first.sha256);while(!choose)await new Promise(r=>setTimeout(r,1));first.bytes.fill(0);
 const second=await f.preview.generate(f.cvId,f.cv.revision);assert.notEqual(second.sha256,sha256(saved));choose('/synthetic/dialog-destination.pdf');const receipt=await exported;assert.deepEqual(written,saved);assert.equal(receipt.sha256,sha256(saved));
});
test('F7 export rejects stale/tampered generation, checks destination digest and permits only equivalent visible hyperlink destinations',async t=>{
 const f=await setup(t,{render:async()=>artifact(1)},{choose:async()=>'/synthetic/path.pdf',write:async()=>({sha256:'0'.repeat(64),byteLength:5})}),cv=structuredClone(f.cv),work=Object.values(cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='work')!;
 if(work.kind!=='work')throw Error();work.fields.web='https://EXAMPLE.test:443';const next=await f.library.confirmEntity(cv,cv.revision),ready=await f.preview.generate(f.cvId,next.revision);
 assert(f.preview.canOpenLink('https://example.test/'));assert(f.preview.canOpenLink('mailto:synthetic@example.org'));assert(!f.preview.canOpenLink('https://example.test/unseen'));assert(!f.preview.canOpenLink('file:///tmp'));assert(!f.preview.canOpenLink('javascript:alert(1)'));assert(!f.preview.canOpenLink('example.test'));
 await assert.rejects(f.preview.export(ready.id,'f'.repeat(64)),/RENDER_OBSOLETE/);await assert.rejects(f.preview.export(ready.id,ready.sha256),/RENDER_EXPORT_INTEGRITY/);f.preview.invalidate();await assert.rejects(f.preview.export(ready.id,ready.sha256),/RENDER_OBSOLETE/);
});
test('F7 Simple renders semantic rich text, escaped content, partial dates and only approved visible variants',async t=>{
 const f=await setup(t,{render:async()=>artifact(1)}),snapshot=await f.snapshots.capture(f.cvId,f.cv.revision),html=simpleHtml(snapshot);
 assert(html.includes('Reviewed synthetic degree'));assert(html.includes('(Título sintético)'));assert(html.includes('Instituto Sintético'));assert(html.includes('<ul>'));assert(html.includes('Actualmente'));assert(!html.includes('PRIVATE_PROFILE_ONLY'));assert(!html.includes('Proyecto sintético'));
 assert.equal(formatDate({precision:'year',year:2024}),'2024');assert.equal(formatDate({precision:'month',year:2024,month:5}),'05/2024');assert.equal(formatDate({precision:'day',year:2024,month:5,day:9}),'09/05/2024');
 const rich=richHtml({kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'<script>safe</script>',marks:[{kind:'bold'},{kind:'italic'},{kind:'link',href:'https://example.test/'}]},{kind:'break'}]}]});assert(rich.includes('&lt;script&gt;'));assert(rich.includes('<strong>')&&rich.includes('<em>')&&rich.includes('<a href=')&&rich.includes('<br>'));assert(!rich.includes('<script>'));
 const en=structuredClone(snapshot);en.projection.locale='en';assert(simpleHtml(en).includes('Ongoing'));assert(simpleHtml(en).includes('Instituto Sintético'));
 assertFontCoverage(snapshot);const bad=structuredClone(snapshot);bad.projection.personal[0]!.values=[{type:'text',value:'Unsupported 🦄',locale:'es',role:'literal'}];assert.throws(()=>assertFontCoverage(bad),/RENDER_GLYPH_UNSUPPORTED/);
});
