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
