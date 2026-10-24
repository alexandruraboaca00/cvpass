import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeJson,encodeJson} from '../src/adapters/json.js';
import {assertDataTree} from '../src/domain/index.js';
test('F9 single-pass strict JSON retains scalar, key, graph and exact resource limits',()=>{
 const parse=(s:string)=>decodeJson(new TextEncoder().encode(s));
 for(const s of ['-0','-0.0','-0e10','1e999','{"x":1,"\\u0078":2}','{"constructor":1}','{"prototype":1}','{"__proto__":1}','[0,]','[] trailing','['.repeat(129)+'0'+']'.repeat(129),'['+'0,'.repeat(199999)+'0]'])assert.throws(()=>parse(s));
 assert.throws(()=>decodeJson(new Uint8Array([0xff])));
 for(const value of [null,true,'constructor',[],{},[{a:[1,'ă ț',null]}],{constructorValue:'safe',x:0}]){const decoded=decodeJson(encodeJson(value));assert.deepEqual(decoded,value);assertDataTree(decoded);}
 assertDataTree(parse('['.repeat(128)+'0'+']'.repeat(128)));
});
