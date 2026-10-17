import { z } from 'zod';
import { IdSchema, NonBlank, Sha256, Timestamp } from './primitives.js';

export const ImportFormatSchema=z.enum(['cvproj','cvforgePdf','europassPdf','europassXml']);
export type ImportFormat=z.infer<typeof ImportFormatSchema>;
export const ImportIssueSchema=z.strictObject({
  kind:z.enum(['review','unsupported','invalid','ignored']),code:z.string().regex(/^[A-Z_0-9]+$/),
  sourcePath:z.string().max(2000),targetPath:z.array(z.string().max(200)).max(32),
  valuePreview:z.string().max(2048),resolution:z.enum(['pending','corrected','excluded','informational']),
});
export type ImportIssue=z.infer<typeof ImportIssueSchema>;
// Private, independently versioned provenance. No source or issue enters ExportProjection.
// Optional on a CV: old snapshots stay byte-for-byte meaningful and need no invented provenance.
export const ImportRecordSchema=z.strictObject({
  recordVersion:z.literal(1),id:IdSchema,format:ImportFormatSchema,adapterVersion:NonBlank,importedAt:Timestamp,
  source:z.strictObject({fileName:z.string().min(1).max(255).refine(s=>!/[\/\\\u0000-\u001f]/.test(s),'import.fileName'),sha256:Sha256,byteLength:z.int().positive(),assetId:IdSchema.nullable()}),
  candidate:z.strictObject({key:NonBlank,attachmentName:z.string().max(255).nullable(),sha256:Sha256,selectionReason:z.enum(['directFile','soleCompatible','identicalCandidates','explicit'])}),
  localeEvidence:z.string().max(200),
  mappings:z.array(z.strictObject({sourcePath:z.string().min(1).max(2000),targetPath:z.array(z.string().max(200)).min(1).max(32)})).max(5000),
  issues:z.array(ImportIssueSchema).max(1000),
});
export type ImportRecord=z.infer<typeof ImportRecordSchema>;
