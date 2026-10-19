import { PresentationSchema, SectionKindSchema } from '../domain/index.js';
import type { Asset, CvDocument, DomainContext, ExportImage, ExportProjection, ImagePlacementSchema, TemplateDefinition } from '../domain/index.js';
import type { z } from 'zod';
import type { LibraryRecord, Resources } from './contracts.js';

export const SIMPLE_TEMPLATE:TemplateDefinition={id:'simple',version:1,rendererContractVersion:1,layout:'singleColumn',capabilities:[...SectionKindSchema.options],resourceRefs:Array.from({length:5},(_,i)=>({assetId:`f7000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,license:'OFL-1.1',attribution:i===4?'SIL Open Font License 1.1 — full license text':'Liberation Sans 2.1.5; Google Corporation / Red Hat, Inc.; license included as resource f7000000-0000-4000-8000-000000000005'}))};
export const LATERAL_TEMPLATE:TemplateDefinition={...SIMPLE_TEMPLATE,id:'lateral',layout:'twoColumn'};
export function builtinTemplate(id:string,version:number):TemplateDefinition {
  if(version!==1||!['simple','lateral'].includes(id))return renderFail('RENDER_TEMPLATE_UNSUPPORTED');
  return structuredClone(id==='simple'?SIMPLE_TEMPLATE:LATERAL_TEMPLATE);
}
export const PresentationInputSchema=PresentationSchema.pick({density:true,accentColor:true,fontFamily:true,numbering:true,datePrecision:true,showCefrGuide:true}).extend({templateRef:PresentationSchema.shape.templateRef.optional()});
export type PresentationInput=z.infer<typeof PresentationInputSchema>;
export interface FontResource {style:'normal'|'italic';weight:400|700;sha256:string;dataBase64:string}
export interface BuiltinResources {template:TemplateDefinition;resources:Required<Resources>;fonts:FontResource[];resourceVersion:string}
export interface ImageNormalizer {normalize(asset:Asset,bytes:Uint8Array,placement:z.infer<typeof ImagePlacementSchema>,signal?:AbortSignal):Promise<ExportImage>}
export interface RenderSource {snapshot():Promise<LibraryRecord>}
export type Digest=(bytes:Uint8Array)=>string;
export interface RenderSnapshot {
  id:string;cvId:string;revision:number;capturedAt:string;fingerprint:string;projectionDigest:string;
  rendererVersion:'simple-1'|'lateral-1';engineVersion:string;resourceVersion:string;
  projection:ExportProjection;fonts:FontResource[];
}
export interface RenderMetrics {snapshotToPdfMs:number;pdfBytes:number;pageCount:number}
export interface PdfArtifact {bytes:Uint8Array;pageCount:number}
export interface PdfRenderPort {render(snapshot:RenderSnapshot,signal:AbortSignal):Promise<PdfArtifact>}
export interface PdfDestination {choose(suggestedName:string):Promise<string|null>;write(path:string,bytes:Uint8Array):Promise<{sha256:string;byteLength:number}>}
export interface PdfGeneration {
  id:string;cvId:string;revision:number;fingerprint:string;sha256:string;bytes:Uint8Array;metrics:RenderMetrics;
}
export class RenderFailure extends Error {constructor(public readonly code:string){super(code);this.name='RenderFailure';}}
export const renderFail=(code:string):never=>{throw new RenderFailure(code);};
export const throwIfAborted=(signal?:AbortSignal):void=>{if(signal?.aborted)renderFail('RENDER_CANCELLED');};
export type { DomainContext, CvDocument };
