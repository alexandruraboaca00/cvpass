import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { parse, fail, AssetSchema, ExportImageSchema } from '../domain/index.js';
import type { Asset, ExportImage } from '../domain/index.js';
export const sha256=(bytes:Uint8Array):string=>createHash('sha256').update(bytes).digest('hex');
const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes:Uint8Array):number{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]!^(c>>>8);return (c^0xffffffff)>>>0;}
function png(bytes:Uint8Array,normalized=false):{width:number;height:number}{
  const b=Buffer.from(bytes);if(b.length<57||!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail('asset.invalidPng');
  let offset=8,width=0,height=0,ended=false,sawData=false;const data:Buffer[]=[];let bitDepth=0,color=0,interlace=0;
  while(offset<b.length){if(offset+12>b.length)fail('asset.truncatedPng');const len=b.readUInt32BE(offset),end=offset+12+len;
    if(end>b.length)fail('asset.truncatedPng');const type=b.subarray(offset+4,offset+8).toString('ascii');
    if(crc32(b.subarray(offset+4,end-4))!==b.readUInt32BE(end-4))fail('asset.pngCrc');
    if(offset===8){if(type!=='IHDR'||len!==13)fail('asset.invalidPngHeader');width=b.readUInt32BE(offset+8);height=b.readUInt32BE(offset+12);bitDepth=b[offset+16]!;color=b[offset+17]!;interlace=b[offset+20]!;}
    else if(type==='IHDR')fail('asset.duplicatePngHeader');
    if(type==='IDAT'){sawData=true;data.push(b.subarray(offset+8,end-4));}
    if(normalized&&!['IHDR','IDAT','IEND'].includes(type))fail('export.imageNotNormalized');
    if(type==='IEND'){if(len!==0||end!==b.length)fail('asset.pngTrailingData');ended=true;}
    offset=end;
  }
  if(!ended||!sawData||!width||!height||width>20_000||height>20_000)fail('asset.invalidPng');
  // Verify full scanline stream for the portable PNG subset we support in F2.
  const channels=({2:3,6:4} as Record<number,number>)[color];
  if(bitDepth!==8||!channels||interlace!==0)fail('asset.unsupportedPngEncoding');
  const row=width*channels+1,expected=row*height;if(expected>100*1024*1024)fail('asset.imageLimit');
  let decoded:Buffer;try{decoded=inflateSync(Buffer.concat(data),{maxOutputLength:expected});}catch{fail('asset.invalidPngPixels');}
  if(decoded.length!==expected)fail('asset.invalidPngPixels');for(let y=0;y<height;y++)if(decoded[y*row]!>4)fail('asset.invalidPngFilter');
  return {width,height};
}
function jpeg(bytes:Uint8Array):{width:number;height:number}{
 const b=Buffer.from(bytes);if(b.length<4||b.readUInt16BE(0)!==0xffd8||b.readUInt16BE(b.length-2)!==0xffd9)fail('asset.invalidJpeg');
 let at=2;
 while(at+4<=b.length){if(b[at]!==255)fail('asset.invalidJpegMarker');while(b[at]===255)at++;const marker=b[at++]!;
  if(marker===0xda)break;if(marker===0xd9)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
  if(at+2>b.length)fail('asset.truncatedJpeg');const length=b.readUInt16BE(at);if(length<2||at+length>b.length)fail('asset.truncatedJpeg');
  if([0xc0,0xc1,0xc2].includes(marker)){if(length<8)fail('asset.invalidJpegFrame');return {height:b.readUInt16BE(at+3),width:b.readUInt16BE(at+5)};}at+=length;
 }
 fail('asset.missingJpegFrame');
}
export function verifyAssetBytes(asset:Asset,bytes:Uint8Array):void{
  parse(AssetSchema,asset);if(bytes.byteLength!==asset.byteLength||sha256(bytes)!==asset.sha256)fail('asset.integrity',[asset.id]);
  if(asset.mediaType==='image/png'||asset.mediaType==='image/jpeg'){
    const d=asset.mediaType==='image/png'?png(bytes):jpeg(bytes);if(d.width!==asset.dimensions!.width||d.height!==asset.dimensions!.height)fail('asset.dimensionMismatch',[asset.id]);
  }
}
export function makeAsset(id:string,bytes:Uint8Array,role:Asset['role'],mediaType:Asset['mediaType']):Asset{
 const dimensions=mediaType==='image/png'?png(bytes):mediaType==='image/jpeg'?jpeg(bytes):null;
 const a=parse(AssetSchema,{id,sha256:sha256(bytes),byteLength:bytes.byteLength,role,mediaType,dimensions});verifyAssetBytes(a,bytes);return a;
}
export function verifyExportImage(value:unknown):ExportImage{
 const image=parse(ExportImageSchema,value),bytes=Buffer.from(image.dataBase64,'base64');
 if(bytes.toString('base64')!==image.dataBase64||sha256(bytes)!==image.sha256)fail('export.imageIntegrity');
 const d=png(bytes,true);if(d.width!==image.width||d.height!==image.height)fail('export.imageDimensions');return image;
}
