import type { Asset, CvDocument, DomainContext, ImportFormat, ImportIssue, ImportRecord, TemplateDefinition } from '../domain/index.js';
import type { ProjectData } from './contracts.js';

export interface ImportSource {fileName:string;sha256:string;byteLength:number}
export interface ImportDraft {
  cv:CvDocument;
  rawDates:Record<string,string>;
  rawNumbers:Record<string,string>;
  documentLocale:'es'|'en'|null;
  localeEvidence:string;
  mappings:ImportRecord['mappings'];
  issues:ImportIssue[];
}
export interface ImportCandidate {
  key:string;format:ImportFormat;attachmentName:string|null;sha256:string;
  status:'ready'|'partial'|'invalid'|'incompatible';code:string|null;
  draft:ImportDraft|null;project:ProjectData|null;
}
export interface ImportAnalysis {
  source:ImportSource;
  detected:'cvproj'|'pdf'|'xml'|'unsupported'|'corrupt';
  code:string|null;candidates:ImportCandidate[];
  selectedKey:string|null;selectionReason:'directFile'|'soleCompatible'|'identicalCandidates'|null;
}
export interface StructuredImportPort {analyze(bytes:Uint8Array,fileName:string):Promise<ImportAnalysis>}
export const IMPORT_FILE_LIMIT=50*1024*1024;
export const IMPORT_WORKSPACE_LIMIT=200*1024*1024;
export const IMPORT_XML_LIMIT=10*1024*1024;
export const importTemplate:TemplateDefinition={id:'cvforge-core',version:2,rendererContractVersion:1,layout:'singleColumn',capabilities:['education','work','skills','languages','certifications','projects','custom'],resourceRefs:[]};
export class ImportFailure extends Error {constructor(public readonly code:string){super(code);this.name='ImportFailure';}}
export function importFail(code:string):never{throw new ImportFailure(code);}
export interface ImportedImage {asset:Asset;bytes:Uint8Array}
export type ImportContext=DomainContext;
