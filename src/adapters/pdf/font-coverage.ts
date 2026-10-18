import { renderFail } from '../../application/render-contract.js';
import type { RenderSnapshot } from '../../application/render-contract.js';
// Read only our pinned sfnt. Reject unsupported characters instead of relying on host fallback fonts.
export function assertFontCoverage(snapshot:RenderSnapshot):void {
  const bytes=Buffer.from(snapshot.fonts[0]!.dataBase64,'base64'),count=bytes.readUInt16BE(4);let cmap=0;
  for(let i=0;i<count;i++){const at=12+16*i;if(bytes.toString('ascii',at,at+4)==='cmap')cmap=bytes.readUInt32BE(at+8);}
  if(!cmap)renderFail('RENDER_FONTS_FAILED');
  const subtables:number[]=[];for(let i=0;i<bytes.readUInt16BE(cmap+2);i++){const at=cmap+4+i*8,platform=bytes.readUInt16BE(at),encoding=bytes.readUInt16BE(at+2);if(platform===0||(platform===3&&[1,10].includes(encoding)))subtables.push(cmap+bytes.readUInt32BE(at+4));}
  const has=(code:number)=>subtables.some(at=>{
    const format=bytes.readUInt16BE(at);
    if(format===12){for(let i=0;i<bytes.readUInt32BE(at+12);i++){const p=at+16+i*12,start=bytes.readUInt32BE(p),end=bytes.readUInt32BE(p+4);if(code>=start&&code<=end)return bytes.readUInt32BE(p+8)+code-start!==0;}return false;}
    if(format!==4||code>65535)return false;const segments=bytes.readUInt16BE(at+6)/2,endAt=at+14,startAt=endAt+2*segments+2,deltaAt=startAt+2*segments,rangeAt=deltaAt+2*segments;
    for(let i=0;i<segments;i++){if(code>bytes.readUInt16BE(endAt+i*2))continue;const start=bytes.readUInt16BE(startAt+i*2);if(code<start)return false;const delta=bytes.readInt16BE(deltaAt+i*2),offset=bytes.readUInt16BE(rangeAt+i*2);if(offset===0)return ((code+delta)&65535)!==0;const glyph=bytes.readUInt16BE(rangeAt+i*2+offset+2*(code-start));return glyph!==0&&((glyph+delta)&65535)!==0;}return false;
  });
  const codes=new Set<number>();const visit=(value:unknown,key=''):void=>{if(typeof value==='string'&&!['dataBase64','sha256'].includes(key))for(const c of value){const code=c.codePointAt(0)!;if(code>32&&!/\p{Cf}/u.test(c))codes.add(code);}else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))visit(v,k);};visit(snapshot.projection);
  if([...codes].some(code=>!has(code)))renderFail('RENDER_GLYPH_UNSUPPORTED');
}
