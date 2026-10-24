import test from 'node:test';
import assert from 'node:assert/strict';
import {ProjectValidationCache,canonical,validateProject} from '../src/domain/index.js';
import type {ProjectSnapshot} from '../src/domain/index.js';
import {f9Workspace} from './f9-fixtures.js';
test('F9 memoized validation preserves every project invariant and isolates returned objects',()=>{
  const original=f9Workspace(6).snapshot;if(original.scope!=='workspace')throw Error();const memo=new ProjectValidationCache();
  assert.equal(canonical(validateProject(original,memo)),canonical(validateProject(original)));
  const returned=validateProject(original,memo);if(returned.scope!=='workspace')throw Error();returned.workspace.cvsById[returned.workspace.cvOrder[0]!]!.name='caller mutation';
  assert.equal(canonical(validateProject(original,memo)),canonical(validateProject(original)));
  const reject=(mutate:(v:Extract<ProjectSnapshot,{scope:'workspace'}>)=>void)=>{const bad=structuredClone(original);mutate(bad);assert.throws(()=>validateProject(bad));assert.throws(()=>validateProject(bad,memo));};
  reject(v=>{v.workspace.cvOrder.reverse();v.workspace.cvOrder.pop();});
  reject(v=>{v.workspace.cvsById[v.workspace.cvOrder[0]!]!.name='';});
  reject(v=>{const [a,b]=v.workspace.cvOrder;v.workspace.cvsById[b!]!.personalInformation.contacts[0]!.id=v.workspace.cvsById[a!]!.personalInformation.contacts[0]!.id;});
  reject(v=>{v.workspace.cvsById[v.workspace.cvOrder[0]!]!.personalInformation.birthDate={precision:'month',year:2024,month:13};});
  reject(v=>{v.templates=[];});reject(v=>{v.assetsById={};});
  reject(v=>{const e=v.workspace.cvsById[v.workspace.cvOrder[0]!]!,snapshot=structuredClone(e);snapshot.name='divergent at same revision';v.revisions.push({id:'00000000-0000-4000-8000-000000009999',entityId:e.id,entityKind:'cv',number:e.revision,createdAt:e.updatedAt,cause:'edit',retention:'ordinary',snapshot});});
  // Same-ID/revision changed content must never reuse stale schema approval.
  reject(v=>{(v.workspace.cvsById[v.workspace.cvOrder[0]!]!.personalInformation as unknown as Record<string,unknown>).givenName=NaN;});
  let called=false;const bad=structuredClone(original);Object.defineProperty(bad.workspace,'unexpected',{enumerable:true,get(){called=true;return 1;}});assert.throws(()=>validateProject(bad,memo));assert.equal(called,false);
  assert.equal(canonical(validateProject(original,memo)),canonical(validateProject(original)));
});

test('F9 lazy canonical comparison preserves equivalent reordered snapshots and detects divergent historical versions',()=>{
 const source=f9Workspace(6).snapshot;if(source.scope!=='workspace')throw Error();const memo=new ProjectValidationCache(),cv=source.workspace.cvsById[source.workspace.cvOrder[0]!]!;
 const snapshot=Object.fromEntries(Object.entries(structuredClone(cv)).reverse()) as typeof cv;
 const revision={id:'00000000-0000-4000-8000-000000009997',entityId:cv.id,entityKind:'cv' as const,number:cv.revision,createdAt:cv.updatedAt,cause:'edit' as const,retention:'ordinary' as const,snapshot};
 const same={...source,revisions:[revision]};assert.equal(canonical(validateProject(same,memo)),canonical(validateProject(same)));
 const different=structuredClone(same);different.revisions[0]!.snapshot.name='Divergent synthetic history';assert.throws(()=>validateProject(different,memo),/revision.divergentSnapshot/);assert.throws(()=>validateProject(different),/revision.divergentSnapshot/);
 const past=structuredClone(source),owner=past.workspace.cvsById[past.workspace.cvOrder[0]!]!;owner.revision++;
 past.revisions=[revision,{...structuredClone(revision),id:'00000000-0000-4000-8000-000000009998',snapshot:{...snapshot,name:'Second past snapshot'}}];assert.throws(()=>validateProject(past,memo),/revision.divergentSnapshot/);
 let accessed=false;const bad=structuredClone(source);Object.defineProperty(bad.workspace,'unsafe',{enumerable:true,get(){accessed=true;return 1;}});assert.throws(()=>memo.schema.parse(bad),/data.accessor/);assert.equal(accessed,false);
});
