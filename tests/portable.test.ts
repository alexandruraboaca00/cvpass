import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync } from 'fflate';
import { encodeCvproj, decodeCvproj, detectCvproj, UnsupportedProjectVersion, encodeExportPayload, decodeExportPayload } from '../src/adapters/cvproj.js';
import { readStoredZip, writeStoredZip, WORKSPACE_LIMITS, CV_LIMITS } from '../src/adapters/zip-store.js';
import { encodeJson, decodeJson } from '../src/adapters/json.js';
import { sha256, makeAsset, verifyAssetBytes } from '../src/adapters/asset-bytes.js';
import { projectForCv, createExportProjection, validateProject, DOMAIN_MODEL_VERSION, ExportPayloadSchema, parse } from '../src/domain/index.js';
import { completeProjectFixture, syntheticPng } from './fixtures.js';
const at='2026-10-16T12:00:00.000Z';
function rewrite(zip:Uint8Array,edit:(files:Record<string,Uint8Array>)=>void):Uint8Array {const files=Object.fromEntries(readStoredZip(zip,WORKSPACE_LIMITS));edit(files);return writeStoredZip(files);}
function firstCv(snapshot:ReturnType<typeof completeProjectFixture>['snapshot']):string{if(snapshot.scope!=='workspace')throw new Error('fixture');return snapshot.workspace.cvOrder[0]!;}

test('workspace cvproj round-trip preserves every MVP area, CEFR partial, hidden data and pinned revision',()=>{
 const data=completeProjectFixture(),bytes=encodeCvproj(data,at),decoded=decodeCvproj(bytes);
 assert.deepEqual(decoded.snapshot,data.snapshot);assert.deepEqual(decoded.blobs,data.blobs);
 assert.equal(decoded.snapshot.revisions[0]!.retention,'pinned');assert.equal(decoded.snapshot.revisions[0]!.snapshot.kind,'cv');
 assert.deepEqual(detectCvproj(bytes),{format:'cvforge-project',projectFormatVersion:1,domainModelVersion:DOMAIN_MODEL_VERSION});
 if(decoded.snapshot.scope!=='workspace')throw new Error('fixture');
 const cv=decoded.snapshot.workspace.cvsById[firstCv(data.snapshot)]!;
 const languages=Object.values(cv.sectionsById).find(s=>s.kind==='languages')!;
 const foreign=Object.values(languages.entriesById).find(e=>e.kind==='foreignLanguage')!;if(foreign.kind!=='foreignLanguage')throw new Error('fixture');
 assert.deepEqual(foreign.fields.proficiency,{listening:null,reading:null,spokenInteraction:'B1',spokenProduction:null,writing:null});
 const work=Object.values(cv.sectionsById).find(s=>s.kind==='work')!;const e=Object.values(work.entriesById)[0]!;assert.equal(e.kind,'work');if(e.kind!=='work')throw new Error('fixture');assert.equal(e.fields.period.ongoing,true);
 decoded.blobs.values().next().value![0]=0;assert.notEqual(decoded.blobs.values().next().value![0],data.blobs.values().next().value![0]);
});
test('single-CV cvproj contains only that CV and its dependency closure, not the profile or other CVs',()=>{
 const source=completeProjectFixture(),cv=projectForCv(source.snapshot,firstCv(source.snapshot));
 const decoded=decodeCvproj(encodeCvproj({snapshot:cv,blobs:source.blobs},at));assert.deepEqual(decoded.snapshot,cv);
 assert.equal(decoded.snapshot.scope,'cv');const json=JSON.stringify(decoded.snapshot);assert(!json.includes('PRIVATE_OTHER_CV'));assert(!json.includes('PRIVATE_PROFILE_ONLY'));assert(!('workspace' in decoded.snapshot));assert(decoded.snapshot.revisions.every(r=>r.entityKind==='cv'));
 assert.equal(decoded.snapshot.revisions.length,1);assert(JSON.stringify(decoded.snapshot).includes('"included":false'));
 assert.throws(()=>encodeCvproj({...source,snapshot:{...source.snapshot,cache:'secret'} as unknown as typeof source.snapshot},at));
});
test('payload is a separate strict contract: visible-only dates, prepared image and no history/original bytes',()=>{
 const source=completeProjectFixture(),single=projectForCv(source.snapshot,firstCv(source.snapshot));if(single.scope!=='cv')throw new Error('fixture');
 single.cv.presentation.personalFieldVisibility.birthDate=true;single.cv.presentation.datePrecision='year';
 assert.throws(()=>createExportProjection(single.cv),/export.imagePreparationRequired/);
 const image=syntheticPng(2,2),prepared={sha256:sha256(image),mediaType:'image/png' as const,width:2,height:2,dataBase64:Buffer.from(image).toString('base64')};
 const projection=createExportProjection(single.cv,()=>prepared),bytes=encodeExportPayload(projection),decoded=decodeExportPayload(bytes),text=new TextDecoder().decode(bytes);
 assert.deepEqual(decoded.projection,projection);assert(!text.includes('PRIVATE_ORIGINAL_METADATA'));assert(!text.includes(single.cv.name));assert(!text.includes('"day":19'));assert(!text.includes('profileEntryId'));assert(!text.includes('retention'));
 assert.equal(detectCvproj(bytes).format,'unknown');assert.throws(()=>parse(ExportPayloadSchema,{...decoded,project:single}));
 const original=source.blobs.values().next().value!;
 assert.throws(()=>encodeExportPayload({...projection,images:[{...prepared,sha256:sha256(original),width:4,dataBase64:Buffer.from(original).toString('base64')}]}),/export.imageNotNormalized/);
});
test('rejects future/old versions, corrupt bytes, mismatched hashes, unknown fields and incorrect scope without mutating input',()=>{
 const source=completeProjectFixture(),good=encodeCvproj(source,at),copy=new Uint8Array(good);
 for(const version of [0,2]){const future=rewrite(good,files=>{const m=decodeJson(files['manifest.json']!) as Record<string,unknown>;m.projectFormatVersion=version;files['manifest.json']=encodeJson(m);});assert.throws(()=>decodeCvproj(future),UnsupportedProjectVersion);assert.equal(detectCvproj(future).format,'cvforge-project');}
 const wrongHash=rewrite(good,files=>{const m=decodeJson(files['manifest.json']!) as {files:{sha256:string}[]};m.files[0]!.sha256='0'.repeat(64);files['manifest.json']=encodeJson(m);});assert.throws(()=>decodeCvproj(wrongHash),/fileIntegrity/);
 const wrongFormat=rewrite(good,files=>{const m=decodeJson(files['manifest.json']!) as Record<string,unknown>;m.format='foreign-project';files['manifest.json']=encodeJson(m);});assert.throws(()=>decodeCvproj(wrongFormat),/wrongFormat/);
 const corrupt=new Uint8Array(good);corrupt[50]=corrupt[50]!^255;assert.throws(()=>decodeCvproj(corrupt));
 const extra=rewrite(good,files=>{const m=decodeJson(files['manifest.json']!) as Record<string,unknown>;m.cache='private';files['manifest.json']=encodeJson(m);});assert.throws(()=>decodeCvproj(extra));
 assert.deepEqual(good,copy);assert.deepEqual(decodeCvproj(good).snapshot,source.snapshot);
});
test('rejects unsafe paths, symlinks, duplicate names, compressed entries and resource limits before extraction',()=>{
 for(const name of ['../snapshot.json','/tmp/secret','C:\\secret','assets/../secret','a//b']){const zip=zipSync({[name]:new Uint8Array([1])},{level:0});assert.throws(()=>decodeCvproj(zip),/archive.unsafePath/);}
 const symlink=zipSync({'snapshot.json':[new Uint8Array([1]),{os:3,attrs:0xa1ff0000}]},{level:0});assert.throws(()=>decodeCvproj(symlink),/archive.symlink/);
 const compressed=zipSync({'snapshot.json':new TextEncoder().encode('a'.repeat(10000))},{level:9});assert.throws(()=>decodeCvproj(compressed),/unsupportedCompression/);
 const source=completeProjectFixture(),zip=encodeCvproj(source,at);
 assert.throws(()=>decodeCvproj(zip,{workspace:{...WORKSPACE_LIMITS,inputBytes:20}}),/inputLimit/);
 assert.throws(()=>decodeCvproj(zip,{workspace:{...WORKSPACE_LIMITS,files:1}}),/fileLimit/);
 assert.throws(()=>decodeCvproj(zip,{workspace:{...WORKSPACE_LIMITS,expandedBytes:20}}),/expandedLimit/);
 assert.throws(()=>decodeCvproj(zip,{workspace:{...WORKSPACE_LIMITS,controlBytes:20}}),/controlLimit/);
 // Two equal-length safe names are rewritten to duplicate each other in both headers.
 const dup=Buffer.from(zipSync({'manifest.json':new Uint8Array([1]),'snapshot.json':new Uint8Array([2])},{level:0}));
 for(let pos=dup.indexOf('snapshot.json');pos>=0;pos=dup.indexOf('snapshot.json',pos+1))dup.write('manifest.json',pos,'ascii');
 assert.throws(()=>decodeCvproj(dup),/duplicatePath/);
});
test('asset hashes, dimensions and complete PNG bytes are verified; absent/orphan assets are rejected',()=>{
 const source=completeProjectFixture(),asset=Object.values(source.snapshot.assetsById)[0]!,bytes=source.blobs.get(asset.sha256)!;
 verifyAssetBytes(asset,bytes);assert.throws(()=>verifyAssetBytes({...asset,dimensions:{width:1,height:2}},bytes),/dimensionMismatch/);
 assert.throws(()=>verifyAssetBytes({...asset,sha256:'0'.repeat(64)},bytes),/integrity/);
 assert.throws(()=>makeAsset(asset.id,bytes.subarray(0,bytes.length-10),'photo','image/png'));
 assert.throws(()=>validateProject({...source.snapshot,assetsById:{}}),/missingPhoto/);
 const orphan=makeAsset('00000000-0000-4000-8000-999999999999',syntheticPng(2,2),'photo','image/png');assert.throws(()=>validateProject({...source.snapshot,assetsById:{...source.snapshot.assetsById,[orphan.id]:orphan}}),/extraOrMissing/);
});
test('strict JSON rejects duplicated escaped keys, pollution, invalid UTF8, excessive depth and non-finite numbers',()=>{
 for(const s of ['{"x":1,"\\u0078":2}','{"__proto__":{}}','[1,]','1e999','[NaN]','[] garbage','['.repeat(130)+']'.repeat(130)])assert.throws(()=>decodeJson(new TextEncoder().encode(s)));
 assert.throws(()=>decodeJson(new Uint8Array([0xff])));assert.deepEqual(decodeJson(encodeJson({name:'Sintético Ș',x:[1,true,null]})),{name:'Sintético Ș',x:[1,true,null]});
});
