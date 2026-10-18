// Synthetic real Chromium acceptance driver. Run through scripts/f7-render-check.mjs.
import { app, nativeImage } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { ChromiumPdfRenderer } from '../src/adapters/pdf/chromium.js';
import { loadSimpleResources } from '../src/adapters/pdf/resources.js';
import { nativeImageNormalizer } from '../src/adapters/pdf/normalize-image.js';
import { completeProjectFixture } from './fixtures.js';
import { createExportProjection, canonical, createSection, A, keepOriginal } from '../src/domain/index.js';
import { sha256 } from '../src/adapters/asset-bytes.js';
import type { RenderSnapshot } from '../src/application/render-contract.js';
app.on('window-all-closed',()=>{});
async function main(){try {
 await app.whenReady();const output=process.env.CVFORGE_F7_OUTPUT??'/tmp/cvforge-f7-render';await mkdir(output,{recursive:true});
 const catalog=await loadSimpleResources(resolve('resources/fonts')),renderer=new ChromiumPdfRenderer(),fixture=completeProjectFixture();
 if(fixture.snapshot.scope!=='workspace')throw new Error();
 const cv=fixture.snapshot.workspace.cvsById[fixture.snapshot.workspace.cvOrder[0]!]!;
 cv.presentation.templateRef={id:'simple',version:1};cv.presentation.fontFamily='Liberation Sans';cv.presentation.numbering=true;
 cv.personalInformation.displayName='Persona sintética Ștefan';cv.personalInformation.headline=null;
 cv.personalInformation.about={class:'A',current:{locale:'es',value:{kind:'doc',content:[{kind:'paragraph',content:[{kind:'text',text:'Sobre mí sintético: á é í ó ú ñ ¿ ¡ ă â î ș ț.',marks:[]}]}]}},revision:1,protectedSpans:[]};cv.presentation.personalFieldVisibility.about=true;
 const richWork=Object.values(cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='work')!;
 if(richWork.kind!=='work'||!richWork.fields.description)throw Error();richWork.fields.description.current.value.content.push({kind:'orderedList',items:['ORDERED_FIRST','ORDERED_SECOND'].map(text=>({kind:'listItem',content:[{kind:'paragraph',content:[{kind:'text',text,marks:[]}]}]}))},{kind:'paragraph',content:[{kind:'text',text:'Rich link',marks:[{kind:'link',href:'https://example.test/rich'},{kind:'italic'}]},{kind:'break'},{kind:'text',text:'After explicit break',marks:[{kind:'bold'}]}]});
 const photo=cv.personalInformation.photo!,asset=fixture.snapshot.assetsById[photo.assetId]!,image=await nativeImageNormalizer.normalize(asset,fixture.blobs.get(asset.sha256)!,photo);
 assert.equal(image.width,2);assert.equal(image.height,2);assert(!Buffer.from(image.dataBase64,'base64').includes(Buffer.from('PRIVATE_ORIGINAL_METADATA')));
 const pixels=nativeImage.createFromBuffer(Buffer.from(image.dataBase64,'base64')).toBitmap();for(let i=0;i<pixels.length;i+=4)assert.deepEqual([...pixels.subarray(i,i+4)],[255,0,0,255]);
 const full=structuredClone(cv);for(const s of Object.values(full.sectionsById))s.included=true;
 const project=Object.values(full.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='project')!;
 if(project.kind!=='project')throw new Error();
 project.fields.description={class:'A',current:{locale:'es',value:{kind:'doc',content:Array.from({length:48},(_,i)=>({kind:'paragraph',content:[{kind:'text',text:`PARAGRAPH_${String(i+1).padStart(2,'0')} Este párrafo sintético incluye información verificable para comprobar la paginación y el orden de lectura. á é í ó ú ñ ¿ ¡ ă â î ș ț. Conservamos todo el contenido aunque ocupe varias líneas y páginas. END_${String(i+1).padStart(2,'0')}`,marks:i===0?[{kind:'bold'},{kind:'italic'}]:[]}]}))}},revision:1,protectedSpans:[]};
 const longUrl='https://example.test/'+('long-segment-'.repeat(35))+'final';project.fields.links=[{id:randomUUID(),label:null,url:longUrl}];
 const cases=[{name:'small',cv:structuredClone(cv)},{name:'large',cv:full}];cases[0]!.cv.sectionOrder=cases[0]!.cv.sectionOrder.filter(id=>['education','work'].includes(cases[0]!.cv.sectionsById[id]!.kind));
 for(const c of cases){for(const key of Object.keys(c.cv.sectionsById))if(!c.cv.sectionOrder.includes(key))delete c.cv.sectionsById[key];}
 const empty={...createSection('custom',{newId:randomUUID,now:fixture.ctx.now},A('EMPTY_SECTION_SENTINEL')),entriesById:{},included:true};full.sectionsById[empty.id]=empty;full.sectionOrder.push(empty.id);
 const original=structuredClone(cases[0]!.cv),translation=structuredClone(original),english=structuredClone(original),hidden=structuredClone(full);
 for(const [input,mode] of [[original,'original'],[translation,'translation']] as const){const e=Object.values(input.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='education')!;if(e.kind!=='education')throw Error();e.fields.title=mode==='original'?keepOriginal(e.fields.title):{...e.fields.title,displayMode:'translation'};}
 english.documentLocale='en';english.personalInformation.photo=null;
 const hiddenProject=Object.values(hidden.sectionsById).find(s=>s.kind==='projects')!;hiddenProject.included=false;
 const work=Object.values(hidden.sectionsById).find(s=>s.kind==='work')!,hiddenEntry=Object.values(work.entriesById)[0]!;hiddenEntry.included=false;
 const year=structuredClone(cases[0]!.cv);year.presentation.datePrecision='year';year.presentation.personalFieldVisibility.birthDate=true;
 cases.push({name:'original-only',cv:original},{name:'translation-only',cv:translation},{name:'english-no-photo',cv:english},{name:'hidden',cv:hidden},{name:'year-only',cv:year});
 const results=[];
 for(const {name,cv:input} of cases){
   const before=canonical(input),projection=createExportProjection(input,()=>image),start=performance.now();
   const snapshot:RenderSnapshot={id:randomUUID(),cvId:input.id,revision:input.revision,capturedAt:fixture.ctx.now(),fingerprint:'synthetic',projectionDigest:sha256(new TextEncoder().encode(canonical(projection))),rendererVersion:'simple-1',engineVersion:process.versions.chrome!,resourceVersion:catalog.resourceVersion,projection,fonts:catalog.fonts};
   const artifact=await renderer.render(snapshot,new AbortController().signal);assert.equal(canonical(input),before);if(name==='small')assert.equal(artifact.pageCount,1);if(name==='large')assert.equal(artifact.pageCount,5,'Trailing dates must not chain independent sections onto an unnecessary sixth page');
   await writeFile(join(output,name+'.pdf'),artifact.bytes);await writeFile(join(output,name+'-projection.json'),JSON.stringify(projection));
   results.push({name,snapshotToPdfMs:performance.now()-start,pdfBytes:artifact.bytes.length,pageCount:artifact.pageCount,sha256:sha256(artifact.bytes)});
 }
 await writeFile(join(output,'metrics.json'),JSON.stringify({chromium:process.versions.chrome,results},null,2));console.log('F7 Chromium render PASS '+output);app.exit(0);
}catch(error){console.error(error);app.exit(1);}}
void main();
