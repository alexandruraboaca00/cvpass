import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateProjectSnapshot } from '../src/adapters/migrations.js';
import { encodeJson } from '../src/adapters/json.js';
import { completeProjectFixture } from './fixtures.js';

test('current schema is independently revalidated and keeps an exact recoverable input copy',()=>{
 const data=completeProjectFixture(),bytes=encodeJson(data.snapshot),result=migrateProjectSnapshot(bytes,1);
 assert.deepEqual(result.snapshot,data.snapshot);assert.notEqual(result.snapshot,data.snapshot);assert.deepEqual(result.original.bytes,bytes);assert.deepEqual(result.appliedVersions,[]);
 result.original.bytes[0]=0;assert.notEqual(result.original.bytes[0],bytes[0]);
});
test('explicit synthetic migration preserves original bytes, rejects unknown future and validates the result',()=>{
 const data=completeProjectFixture();
 // Artificial test-only v0 wrapper, never a claimed historical CVForge format.
 const legacy=encodeJson({syntheticLegacySnapshot:data.snapshot}),saved=new Uint8Array(legacy);
 const step={from:0,to:1,transform:(raw:unknown)=>(raw as {syntheticLegacySnapshot:unknown}).syntheticLegacySnapshot};
 const migrated=migrateProjectSnapshot(legacy,0,[step]);assert.deepEqual(migrated.snapshot,data.snapshot);assert.deepEqual(migrated.original.bytes,saved);assert.deepEqual(migrated.appliedVersions,[1]);
 assert.throws(()=>migrateProjectSnapshot(legacy,0),/missingOrAmbiguousStep/);assert.throws(()=>migrateProjectSnapshot(legacy,2,[step]),/unsupportedVersion/);
 assert.throws(()=>migrateProjectSnapshot(legacy,0,[step,step]),/missingOrAmbiguousStep/);
 assert.throws(()=>migrateProjectSnapshot(legacy,0,[{...step,to:0}]),/invalidStep/);
 assert.throws(()=>migrateProjectSnapshot(legacy,0,[{...step,transform:()=>({scope:'cv'})}]));assert.deepEqual(legacy,saved);
});
