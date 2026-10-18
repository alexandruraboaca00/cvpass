import { nativeImage } from 'electron';
import { verifyAssetBytes, verifyExportImage, sha256 } from '../asset-bytes.js';
import { renderFail, throwIfAborted } from '../../application/render-contract.js';
import type { ImageNormalizer } from '../../application/render-contract.js';
export const nativeImageNormalizer:ImageNormalizer={async normalize(asset,bytes,placement,signal){
  throwIfAborted(signal);verifyAssetBytes(asset,bytes);
  const source=nativeImage.createFromBuffer(Buffer.from(bytes));if(source.isEmpty())renderFail('RENDER_IMAGE_DECODE');
  const size=source.getSize(),c=placement.crop,x=Math.min(size.width-1,Math.floor(c.x*size.width)),y=Math.min(size.height-1,Math.floor(c.y*size.height));
  const width=Math.max(1,Math.min(size.width-x,Math.round(c.width*size.width))),height=Math.max(1,Math.min(size.height-y,Math.round(c.height*size.height)));
  const encoded=source.crop({x,y,width,height}).toPNG(),chunks:Buffer[]=[encoded.subarray(0,8)];
  // Retain only pixel-bearing PNG chunks: no EXIF, text, profiles or original crop pixels.
  for(let at=8;at<encoded.length;){const end=at+12+encoded.readUInt32BE(at);if(end>encoded.length)renderFail('RENDER_IMAGE_DECODE');const kind=encoded.subarray(at+4,at+8).toString('ascii');if(['IHDR','IDAT','IEND'].includes(kind))chunks.push(encoded.subarray(at,end));at=end;}
  const normalized=Buffer.concat(chunks);throwIfAborted(signal);
  return verifyExportImage({sha256:sha256(normalized),mediaType:'image/png',width,height,dataBase64:normalized.toString('base64')});
}};
