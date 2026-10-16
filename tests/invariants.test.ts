import { readStoredZip, writeStoredZip, WORKSPACE_LIMITS } from '../src/adapters/zip-store.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { validateProject, validateCv, validateProfile, parse, RichNarrativeSchema, createCvFromProfile, reorderEntries, createExportProjection } from '../src/domain/index.js';
import { encodeCvproj, decodeCvproj, selectCvData, encodeExportPayload, UnsupportedProjectVersion } from '../src/adapters/cvproj.js';
import { sha256, makeAsset } from '../src/adapters/asset-bytes.js';
import { encodeJson, decodeJson } from '../src/adapters/json.js';
import { completeProjectFixture, syntheticPng, profileFixture, template } from './fixtures.js';

test('domain boundary imports only its own modules and Zod',()=>{
 for(const file of readdirSync('src/domain').filter(f=>f.endsWith('.ts'))){
  const source=readFileSync(`src/domain/${file}`,'utf8');
  for(const match of source.matchAll(/^\s*(?:import|export)\s+[^;\n]*?\bfrom\s*['"]([^'"]+)['"]/gm))assert(match[1]==='zod'||match[1]!.startsWith('./'),`${file}: ${match[1]}`);
  assert(!/\b(?:require|import)\s*\(/.test(source),`${file}: dynamic module access`);
 }

});
test('skill groups have one ordering model and every skill belongs exactly once',()=>{
 const data=completeProjectFixture();if(data.snapshot.scope!=='workspace')throw new Error('fixture');const cv=data.snapshot.workspace.cvsById[data.snapshot.workspace.cvOrder[0]!]!;
 const skills=Object.values(cv.sectionsById).find(s=>s.kind==='skills')!,group=skills.groupsById[skills.groupOrder[0]!]!;
 const old=structuredClone(cv);skills.ungroupedSkillIds.push(group.skillIds[0]!);assert.throws(()=>validateCv(cv),/order.notPermutation/);
 const duplicate=structuredClone(old);const s=duplicate.sectionsById[skills.id]!;s.entryOrder=[];assert.throws(()=>validateCv(duplicate),/skills.secondOrder/);
 const mismatch=structuredClone(old),m=mismatch.sectionsById[skills.id]!;const e=m.entriesById[group.skillIds[0]!]!;if(e.kind!=='skill')throw new Error('fixture');e.fields.groupId=null;assert.throws(()=>validateCv(mismatch),/skill.groupMismatch/);
});
test('rejects inconsistent revision snapshots, absent template/resources and asset ID collisions',()=>{
 const data=completeProjectFixture();const divergent=structuredClone(data.snapshot);const r=divergent.revisions[0]!;r.number++;r.snapshot.revision++;
 assert.throws(()=>validateProject(divergent),/revision.divergentSnapshot/);
 assert.throws(()=>validateProject({...data.snapshot,templates:[]}),/template.extraOrMissing/);
 const collision=structuredClone(data.snapshot);const a=Object.values(collision.assetsById)[0]!;const original=a.id;const owner=collision.scope==='workspace'?collision.workspace.profile!:collision.cv;a.id=owner.id;delete collision.assetsById[original];collision.assetsById[a.id]=a;
 // Repair photo refs so validation reaches the ID namespace check.
 const text=JSON.stringify(collision).replaceAll(original,owner.id);assert.throws(()=>validateProject(JSON.parse(text)),/asset.idCollision/);
});
test('CV export selects blob dependencies while preserving assets of old pinned revisions',()=>{
 const source=completeProjectFixture();if(source.snapshot.scope!=='workspace')throw new Error('fixture');
 const second=source.snapshot.workspace.cvsById[source.snapshot.workspace.cvOrder[1]!]!;
 const otherBytes=syntheticPng(6,2,'PRIVATE_OTHER_PHOTO'),other=makeAsset(source.ctx.newId(),otherBytes,'photo','image/png');
 source.snapshot.assetsById[other.id]=other;source.blobs.set(other.sha256,otherBytes);second.personalInformation.photo={assetId:other.id,crop:{x:0,y:0,width:1,height:1},visible:true};
 const firstId=source.snapshot.workspace.cvOrder[0]!,selected=selectCvData(source,firstId);
 assert.equal(selected.blobs.size,1);const bytes=encodeCvproj(selected,source.ctx.now());assert(!Buffer.from(bytes).includes(Buffer.from('PRIVATE_OTHER_PHOTO')));
 // The current CV can replace its photo; its old checkpoint must retain the original.
 const first=source.snapshot.workspace.cvsById[firstId]!;first.personalInformation.photo={assetId:other.id,crop:{x:0,y:0,width:1,height:1},visible:true};first.revision++;
 const withHistory=selectCvData(source,firstId);assert.equal(withHistory.blobs.size,2);assert.deepEqual(decodeCvproj(encodeCvproj(withHistory,source.ctx.now())).snapshot,withHistory.snapshot);
});
test('rich narrative protected spans survive the project without a permanent language map',()=>{
 const value={kind:'doc' as const,content:[{kind:'paragraph' as const,content:[{kind:'text' as const,text:'Colaboré con Marca Sintética.',marks:[]}]}]};
 const f={class:'A' as const,current:{value,locale:'es'},revision:1,protectedSpans:[{id:'00000000-0000-4000-8000-000000999999',start:13,end:28,value:'Marca Sintética',entity:'brand' as const}]};
 assert.deepEqual(parse(RichNarrativeSchema,f),f);assert.throws(()=>parse(RichNarrativeSchema,{...f,protectedSpans:[{...f.protectedSpans[0],end:27}]}),/span.invalid/);
 const data=completeProjectFixture();if(data.snapshot.scope!=='workspace')throw new Error('fixture');data.snapshot.workspace.profile!.personalInformation.about=f;
 assert.deepEqual(decodeCvproj(encodeCvproj(data,data.ctx.now())).snapshot,data.snapshot);
});
test('entry reordering preserves fields, visibility and rich semantics; native names need no generic title',()=>{
 const {profile,ctx}=profileFixture();const cv=createCvFromProfile(profile,{name:'CV',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);
 const id=cv.sectionOrder[0]!,s=cv.sectionsById[id]!,e=Object.values(s.entriesById)[0]!,copy={...structuredClone(e),id:ctx.newId()};s.entriesById[copy.id]=copy;s.entryOrder!.push(copy.id);
 const before=structuredClone(s.entriesById),reordered=reorderEntries(cv,id,[copy.id,e.id]);assert.deepEqual(reordered.sectionsById[id]!.entriesById,before);assert.deepEqual(reordered.sectionsById[id]!.entryOrder,[copy.id,e.id]);
 assert.throws(()=>reorderEntries(cv,id,[e.id,e.id]),/order.notPermutation/);
 const data=completeProjectFixture();if(data.snapshot.scope!=='workspace')throw new Error('fixture');validateProfile(data.snapshot.workspace.profile!);
});
test('JSON/domain graph validation rejects cycles, non-data accessors and sparse arrays without inventing values',()=>{
 const cycle:{self?:unknown}={};cycle.self=cycle;assert.throws(()=>encodeJson(cycle),/cycle/);
 assert.throws(()=>encodeJson([,1]),/sparse/);assert.throws(()=>encodeJson({get secret(){throw new Error('must not execute');}}),/accessor/);
 assert.throws(()=>encodeJson({n:-0}),/negativeZero/);assert.throws(()=>decodeJson(new TextEncoder().encode('{"n":-0}')),/negativeZero/);
});
test('export contract rejects unrelated images, duplicate fields and wrong section associations',()=>{
 const {profile,ctx}=profileFixture();const cv=createCvFromProfile(profile,{name:'CV',documentLocale:'es',template,sectionIds:profile.sectionOrder},ctx);const p=createExportProjection(cv);
 const duplicated=structuredClone(p);duplicated.personal.push(duplicated.personal[0]!);assert.throws(()=>encodeExportPayload(duplicated),/export.duplicateField/);
 const image=syntheticPng(2,2);assert.throws(()=>encodeExportPayload({...p,images:[{sha256:sha256(image),mediaType:'image/png',width:2,height:2,dataBase64:Buffer.from(image).toString('base64')}]}),/export.imageReference/);
 const wrong=structuredClone(p);wrong.sections[0]!.kind='skills';assert.throws(()=>encodeExportPayload(wrong),/export.entryAssociation/);
});
test('document and model versions are independent; supported archives keep scope-specific limits',()=>{
 const source=completeProjectFixture(),cv=selectCvData(source,source.snapshot.scope==='workspace'?source.snapshot.workspace.cvOrder[0]!:''),bytes=encodeCvproj(cv,source.ctx.now());
 assert.deepEqual(decodeCvproj(bytes,{workspace:{...WORKSPACE_LIMITS,files:1}}).snapshot,cv.snapshot);
 const files=Object.fromEntries(readStoredZip(bytes,WORKSPACE_LIMITS));const manifest=decodeJson(files['manifest.json']!) as Record<string,unknown>;
 manifest.domainModelVersion=2;files['manifest.json']=encodeJson(manifest);assert.throws(()=>decodeCvproj(writeStoredZip(files)),UnsupportedProjectVersion);
 manifest.domainModelVersion=1;manifest.creator={name:'CVForge',appVersion:'0.2.0'};files['manifest.json']=encodeJson(manifest);assert.deepEqual(decodeCvproj(writeStoredZip(files)).snapshot,cv.snapshot);
 manifest.scope='workspace';files['manifest.json']=encodeJson(manifest);assert.throws(()=>decodeCvproj(writeStoredZip(files)),/scopeMismatch/);
});
test('materialization rejects an ID provider that attempts to reuse source identities',()=>{
 const {profile,ctx}=profileFixture();assert.throws(()=>createCvFromProfile(profile,{name:'CV',documentLocale:'es',template,sectionIds:profile.sectionOrder},{...ctx,newId:()=>profile.id}),/materializationCollision/);
});
