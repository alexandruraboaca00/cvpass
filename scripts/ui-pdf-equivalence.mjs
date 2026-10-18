// Comparison only: never rewrites either PDF. Chromium's existing wall-clock
// CreationDate/ModDate make independent generations differ even on unchanged main.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const [before,after,receipt]=process.argv.slice(2);
assert(before&&after&&receipt,'Usage: node scripts/ui-pdf-equivalence.mjs BEFORE AFTER RECEIPT');
const original=JSON.parse(await readFile(join(before,'metrics.json'),'utf8'));
const current=JSON.parse(await readFile(join(after,'metrics.json'),'utf8'));
assert.equal(current.chromium,original.chromium);
assert.deepEqual(current.results.map(r=>r.name),original.results.map(r=>r.name));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function stable(bytes){
  let count=0;
  const value=bytes.toString('latin1').replace(/(\/(?:CreationDate|ModDate) \(D:)\d{14}/g,(_,prefix)=>{count++;return prefix+'20000101000000';});
  assert.equal(count,2,'Expected exactly the two existing PDF wall-clock metadata dates');
  return Buffer.from(value,'latin1');
}
const results=[];
for(const item of original.results){
  const other=current.results.find(r=>r.name===item.name);assert.equal(other.pageCount,item.pageCount);
  const a=await readFile(join(before,item.name+'.pdf')),b=await readFile(join(after,item.name+'.pdf'));
  assert.equal(a.length,b.length,item.name+': PDF length changed');
  assert.deepEqual(stable(a),stable(b),item.name+': PDF bytes changed beyond CreationDate/ModDate');
  results.push({name:item.name,pages:item.pageCount,bytes:a.length,rawEqual:a.equals(b),beforeSha256:sha(a),afterSha256:sha(b),equalExceptExistingClockDates:true,comparableSha256:sha(stable(b))});
}
await writeFile(receipt,JSON.stringify({comparison:'all bytes; only the 14 clock digits of existing CreationDate/ModDate compared at a common time; original files untouched',results},null,2)+'\n');
console.log(JSON.stringify(results.map(({name,rawEqual,equalExceptExistingClockDates})=>({name,rawEqual,equalExceptExistingClockDates}))));
