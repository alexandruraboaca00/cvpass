import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { english, translateMessage } from '../src/ui/messages.js';
test('F5 local ES/EN catalog covers static renderer messages and keeps interpolation variables intact',async()=>{
  for(const file of (await readdir('src/ui')).filter(f=>f.endsWith('.tsx'))){
    const source=await readFile('src/ui/'+file,'utf8');
    for(const match of source.matchAll(/\bt\((['"])((?:\\.|(?!\1)[^\\\n])*?)\1/g))assert(Object.hasOwn(english,match[2]!),`${file}: ${match[2]}`);
    // Includes message IDs selected through conditional expressions and label maps.
    for(const match of source.matchAll(/(['"])((?:\\.|(?!\1)[^\\\n])*?)\1/g)){
      const value=match[2]!;if(/^[A-ZÁÉÍÓÚÑ]/u.test(value)&&value.length>1&&!/^[A-Z0-9_-]+$/.test(value))assert(Object.hasOwn(english,value),`${file}: ${value}`);
    }
  }
  const variables=(text:string)=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]!).sort();
  for(const [key,value] of Object.entries(english)){assert(value.trim(),key);assert.deepEqual(variables(value),variables(key),key);}
  assert.equal(translateMessage('en','Revisión {n}',{n:4}),'Revision 4');assert.equal(translateMessage('es','Revisión {n}',{n:4}),'Revisión 4');
});
