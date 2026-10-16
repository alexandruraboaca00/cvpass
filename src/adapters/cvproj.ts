import { z } from 'zod';
import { parse, fail, Timestamp, Sha256, validateProject, DOMAIN_MODEL_VERSION, projectForCv, ExportPayloadSchema } from '../domain/index.js';
import type { ProjectSnapshot, ExportPayload, ExportProjection } from '../domain/index.js';
import { sha256, verifyAssetBytes, verifyExportImage } from './asset-bytes.js';
import { encodeJson, decodeJson } from './json.js';
import { readStoredZip, writeStoredZip, CV_LIMITS, WORKSPACE_LIMITS, validateLimits } from './zip-store.js';
import type { ArchiveLimits } from './zip-store.js';
export const PROJECT_FORMAT_VERSION=1;
const fileSchema=z.strictObject({path:z.string(),byteLength:z.int().nonnegative(),sha256:Sha256});
export const ProjectManifestSchema=z.strictObject({format:z.literal('cvforge-project'),projectFormatVersion:z.literal(1),domainModelVersion:z.literal(1),scope:z.enum(['cv','workspace']),payloadPolicy:z.literal('complete-private-project'),createdAt:Timestamp,creator:z.strictObject({name:z.literal('CVForge'),appVersion:z.string().regex(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/)}),files:z.array(fileSchema)});
export interface ProjectData{snapshot:ProjectSnapshot;blobs:Map<string,Uint8Array>}
export interface ProjectLimits{cv?:ArchiveLimits;workspace?:ArchiveLimits}
export class UnsupportedProjectVersion extends Error{constructor(public readonly projectVersion:unknown,public readonly modelVersion:unknown){super('cvproj.unsupportedVersion');this.name='UnsupportedProjectVersion';}}
function selectedLimits(scope:'cv'|'workspace',options:ProjectLimits):ArchiveLimits{return scope==='cv'?options.cv??CV_LIMITS:options.workspace??WORKSPACE_LIMITS;}
function manifestOf(files:Map<string,Uint8Array>,limits:ArchiveLimits):z.infer<typeof ProjectManifestSchema>{
 const bytes=files.get('manifest.json');if(!bytes)fail('cvproj.missingManifest');const raw=decodeJson(bytes,limits.controlBytes);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('cvproj.invalidManifest');const m=raw as Record<string,unknown>;
 if(m.format!=='cvforge-project')fail('cvproj.wrongFormat');
 if(m.projectFormatVersion!==PROJECT_FORMAT_VERSION||m.domainModelVersion!==DOMAIN_MODEL_VERSION)throw new UnsupportedProjectVersion(m.projectFormatVersion,m.domainModelVersion);
 return parse(ProjectManifestSchema,raw);
}
export function encodeCvproj(data:ProjectData,createdAt:string,options:ProjectLimits={}):Uint8Array{
 const snapshot=validateProject(data.snapshot);const limits=selectedLimits(snapshot.scope,options);
 const files:Record<string,Uint8Array>={'snapshot.json':encodeJson(snapshot)};
 const required=new Set(Object.values(snapshot.assetsById).map(a=>a.sha256));
 if(data.blobs.size!==required.size||[...data.blobs.keys()].some(k=>!required.has(k)))fail('cvproj.extraOrMissingBlob');
 for(const a of Object.values(snapshot.assetsById)){const bytes=data.blobs.get(a.sha256);if(!bytes)fail('cvproj.missingBlob');verifyAssetBytes(a,bytes);files[`assets/${a.sha256}`]=new Uint8Array(bytes);}
 const manifest=parse(ProjectManifestSchema,{format:'cvforge-project',projectFormatVersion:1,domainModelVersion:1,scope:snapshot.scope,payloadPolicy:'complete-private-project',createdAt,creator:{name:'CVForge',appVersion:'0.1.0'},files:Object.entries(files).map(([path,bytes])=>({path,byteLength:bytes.length,sha256:sha256(bytes)}))});
 files['manifest.json']=encodeJson(manifest);
 if(Object.keys(files).length>limits.files||Object.values(files).reduce((n,b)=>n+b.length,0)>limits.expandedBytes)fail('archive.outputLimit');
 for(const [path,bytes]of Object.entries(files))if(path.endsWith('.json')&&bytes.length>limits.controlBytes)fail('archive.controlLimit');
 const estimatedBytes=22+Object.entries(files).reduce((total,[name,bytes])=>total+76+2*new TextEncoder().encode(name).length+bytes.length,0);
 if(estimatedBytes>limits.inputBytes)fail('archive.outputLimit');
 const result=writeStoredZip(files);if(result.length>limits.inputBytes)fail('archive.outputLimit');return result;
}
export function decodeCvproj(input:Uint8Array,options:ProjectLimits={}):ProjectData{
 const cvLimits=options.cv??CV_LIMITS,workspaceLimits=options.workspace??WORKSPACE_LIMITS;validateLimits(cvLimits);validateLimits(workspaceLimits);
 const initial=Object.fromEntries(Object.keys(cvLimits).map(k=>[k,Math.max(cvLimits[k as keyof ArchiveLimits],workspaceLimits[k as keyof ArchiveLimits])])) as unknown as ArchiveLimits;
 let files=readStoredZip(input,initial);let manifest=manifestOf(files,initial);
 const limits=selectedLimits(manifest.scope,options);files=readStoredZip(input,limits);manifest=manifestOf(files,limits);
 const listed=new Set<string>();
 for(const f of manifest.files){if(f.path==='manifest.json'||listed.has(f.path))fail('cvproj.invalidInventory');listed.add(f.path);const b=files.get(f.path);if(!b||b.length!==f.byteLength||sha256(b)!==f.sha256)fail('cvproj.fileIntegrity',[f.path]);}
 if(listed.size!==files.size-1||[...files.keys()].some(k=>k!=='manifest.json'&&!listed.has(k)))fail('cvproj.extraFile');
 const bytes=files.get('snapshot.json');if(!bytes)fail('cvproj.missingSnapshot');
 // Current version validates an independent clone. No speculative migration of unknown versions.
 const snapshot=validateProject(decodeJson(bytes,limits.controlBytes));if(snapshot.scope!==manifest.scope)fail('cvproj.scopeMismatch');
 const blobs=new Map<string,Uint8Array>();
 for(const a of Object.values(snapshot.assetsById)){const bytes=files.get(`assets/${a.sha256}`);if(!bytes)fail('cvproj.missingBlob');verifyAssetBytes(a,bytes);blobs.set(a.sha256,new Uint8Array(bytes));}
 const expected=new Set(['manifest.json','snapshot.json',...Object.keys(Object.fromEntries([...blobs].map(([hash])=>[`assets/${hash}`,true])))]);
 if(files.size!==expected.size||[...files.keys()].some(k=>!expected.has(k)))fail('cvproj.unreferencedFile');
 return {snapshot,blobs};
}
export function detectCvproj(input:Uint8Array):{format:'cvforge-project';projectFormatVersion:unknown;domainModelVersion:unknown}|{format:'unknown'}{
 try{const files=readStoredZip(input,WORKSPACE_LIMITS);const bytes=files.get('manifest.json');if(!bytes)return {format:'unknown'};const value=decodeJson(bytes) as Record<string,unknown>;return value?.format==='cvforge-project'?{format:'cvforge-project',projectFormatVersion:value.projectFormatVersion,domainModelVersion:value.domainModelVersion}:{format:'unknown'};}catch{return {format:'unknown'};}
}
export function encodeExportPayload(projection:ExportProjection):Uint8Array{
 const payload=parse(ExportPayloadSchema,{format:'cvforge-export-payload',pdfPayloadFormatVersion:1,projection});payload.projection.images.forEach(verifyExportImage);return encodeJson(payload);
}
export function decodeExportPayload(bytes:Uint8Array):ExportPayload{
 const payload=parse(ExportPayloadSchema,decodeJson(bytes));payload.projection.images.forEach(verifyExportImage);return payload;
}

export function selectCvData(source:ProjectData,cvId:string):ProjectData {
 const snapshot=projectForCv(source.snapshot,cvId);const required=new Set(Object.values(snapshot.assetsById).map(a=>a.sha256));
 const blobs=new Map<string,Uint8Array>();for(const hash of required){const b=source.blobs.get(hash);if(!b)fail('cvproj.missingBlob');blobs.set(hash,new Uint8Array(b));}
 return {snapshot,blobs};
}
