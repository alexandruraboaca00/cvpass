// Genuine ICO directory with seven embedded PNG representations (Windows Vista+).
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const sizes=[16,24,32,48,64,128,256],images=await Promise.all(sizes.map(n=>readFile(`assets/icons/${n}x${n}.png`)));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
for(const [i,n]of sizes.entries()){const b=images[i];assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),n);assert.equal(b.readUInt32BE(20),n);const at=6+16*i;header[at]=n===256?0:n;header[at+1]=n===256?0:n;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(b.length,at+8);header.writeUInt32LE(offset,at+12);offset+=b.length;}
await writeFile('assets/icons/cvpass.ico',Buffer.concat([header,...images]));console.log('CVPass ICO: '+sizes.join(', ')+'px; official transparent PNG derivatives');
