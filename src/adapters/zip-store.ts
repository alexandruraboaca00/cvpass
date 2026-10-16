import { zipSync } from 'fflate';
import { fail } from '../domain/primitives.js';
import { crc32 } from './asset-bytes.js';
export interface ArchiveLimits{inputBytes:number;expandedBytes:number;files:number;controlBytes:number}
export const CV_LIMITS:ArchiveLimits={inputBytes:50*1024*1024,expandedBytes:100*1024*1024,files:1000,controlBytes:10*1024*1024};
export const WORKSPACE_LIMITS:ArchiveLimits={inputBytes:200*1024*1024,expandedBytes:500*1024*1024,files:10_000,controlBytes:10*1024*1024};
export function validateLimits(limits:ArchiveLimits):void{for(const n of Object.values(limits))if(!Number.isSafeInteger(n)||n<=0)fail('archive.invalidLimits');}
export const safePath=(name:string):boolean=>name==='manifest.json'||name==='snapshot.json'||/^assets\/[a-f0-9]{64}$/.test(name);
export function writeStoredZip(files:Record<string,Uint8Array>):Uint8Array{
 for(const path of Object.keys(files))if(!safePath(path))fail('archive.unsafePath');
 return zipSync(files,{level:0,mtime:new Date('2020-01-01T00:00:00.000Z')});
}
// v1 deliberately accepts only ZIP STORE. No inflater runs on untrusted archive data.
// Validate directory AND local headers; do not trust declared sizes alone.
export function readStoredZip(input:Uint8Array,limits:ArchiveLimits):Map<string,Uint8Array>{
 validateLimits(limits);if(input.length>limits.inputBytes)fail('archive.inputLimit');
 const b=Buffer.from(input);const end=b.length-22;if(end<0||b.readUInt32LE(end)!==0x06054b50)fail('archive.invalidEnd');
 if(b.readUInt16LE(end+4)||b.readUInt16LE(end+6)||b.readUInt16LE(end+20))fail('archive.unsupportedDiskOrComment');
 const count=b.readUInt16LE(end+10),centralSize=b.readUInt32LE(end+12),central=b.readUInt32LE(end+16);
 if(count!==b.readUInt16LE(end+8)||count===0xffff||centralSize===0xffffffff||central===0xffffffff||central+centralSize!==end)fail('archive.invalidDirectory');
 if(count>limits.files)fail('archive.fileLimit');
 let at=central,total=0;const entries=new Map<string,Uint8Array>(),ranges:[number,number][]=[];
 for(let i=0;i<count;i++){
  if(at+46>end||b.readUInt32LE(at)!==0x02014b50)fail('archive.invalidEntry');
  const flags=b.readUInt16LE(at+8),method=b.readUInt16LE(at+10),crc=b.readUInt32LE(at+16),compressed=b.readUInt32LE(at+20),size=b.readUInt32LE(at+24),nameLen=b.readUInt16LE(at+28),extra=b.readUInt16LE(at+30),comment=b.readUInt16LE(at+32),disk=b.readUInt16LE(at+34),attrs=b.readUInt32LE(at+38),local=b.readUInt32LE(at+42);
  if(flags&~0x800||method!==0||compressed!==size||disk||compressed===0xffffffff||local===0xffffffff)fail('archive.unsupportedCompressionOrFlags');
  if(((attrs>>>16)&0xf000)===0xa000)fail('archive.symlink');
  if(at+46+nameLen+extra+comment>end)fail('archive.invalidEntry');
  let name:string;try{name=new TextDecoder('utf-8',{fatal:true}).decode(b.subarray(at+46,at+46+nameLen));}catch{fail('archive.invalidName');}
  if(!safePath(name))fail('archive.unsafePath');if(entries.has(name))fail('archive.duplicatePath');
  total+=size;if(total>limits.expandedBytes)fail('archive.expandedLimit');if(name.endsWith('.json')&&size>limits.controlBytes)fail('archive.controlLimit');
  if(local+30>central||b.readUInt32LE(local)!==0x04034b50)fail('archive.invalidLocalHeader');
  const localNameLen=b.readUInt16LE(local+26),localExtra=b.readUInt16LE(local+28),start=local+30+localNameLen+localExtra,finish=start+size;
  if(finish>central||b.readUInt16LE(local+6)!==flags||b.readUInt16LE(local+8)!==method||b.readUInt32LE(local+14)!==crc||b.readUInt32LE(local+18)!==compressed||b.readUInt32LE(local+22)!==size||!b.subarray(local+30,local+30+localNameLen).equals(b.subarray(at+46,at+46+nameLen)))fail('archive.localMismatch');
  const bytes=b.subarray(start,finish);if(crc32(bytes)!==crc)fail('archive.crc');entries.set(name,bytes);ranges.push([local,finish]);at+=46+nameLen+extra+comment;
 }
 if(at!==end)fail('archive.directorySize');
 ranges.sort((a,b)=>a[0]-b[0]);let last=0;for(const [start,finish]of ranges){if(start!==last)fail('archive.overlapOrExtraData');last=finish;}if(last!==central)fail('archive.extraData');
 return entries;
}
