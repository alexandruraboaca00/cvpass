import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { makeAsset, sha256 } from '../asset-bytes.js';
import { SIMPLE_TEMPLATE, renderFail } from '../../application/render-contract.js';
import type { BuiltinResources } from '../../application/render-contract.js';
const Manifest=z.strictObject({family:z.literal('Liberation Sans'),version:z.literal('2.1.5'),license:z.literal('OFL-1.1'),files:z.array(z.strictObject({file:z.string().regex(/^(LiberationSans-(Regular|Bold|Italic|BoldItalic)\.ttf|OFL\.txt)$/),id:z.uuid(),sha256:z.string().regex(/^[a-f0-9]{64}$/),byteLength:z.int().positive().max(1024*1024),style:z.enum(['Regular','Bold','Italic','BoldItalic','License'])})).length(5)});
export async function loadSimpleResources(directory:string):Promise<BuiltinResources>{
  const manifest=Manifest.parse(JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'))),resources:BuiltinResources['resources']={templates:[structuredClone(SIMPLE_TEMPLATE)],assetsById:{},blobs:new Map()},fonts:BuiltinResources['fonts']=[];
  if(new Set(manifest.files.map(f=>f.style)).size!==5||manifest.files.some((f,i)=>f.id!==SIMPLE_TEMPLATE.resourceRefs[i]?.assetId))renderFail('RENDER_RESOURCE_MANIFEST');
  for(const f of manifest.files){
    const bytes=new Uint8Array(await readFile(join(directory,f.file)));if(bytes.length!==f.byteLength||sha256(bytes)!==f.sha256)renderFail('RENDER_RESOURCE_INTEGRITY');
    const asset=makeAsset(f.id,bytes,'templateResource',f.style==='License'?'application/octet-stream':'font/ttf');resources.assetsById[asset.id]=asset;resources.blobs.set(asset.sha256,bytes);
    if(f.style!=='License')fonts.push({weight:f.style.includes('Bold')?700:400,style:f.style.includes('Italic')?'italic':'normal',sha256:f.sha256,dataBase64:Buffer.from(bytes).toString('base64')});
  }
  return {template:structuredClone(SIMPLE_TEMPLATE),resources,fonts,resourceVersion:'liberation-sans-2.1.5-ofl-1.1'};
}
