import { z } from 'zod';
import { IdSchema, Timestamp, Sha256, ExportProjectionSchema } from '../domain/index.js';

// Private receipts, no CV text, assets, source documents or destination paths.
export const ExportRecordSchema=z.strictObject({
  recordVersion:z.literal(1),id:IdSchema,cvId:IdSchema,revision:z.int().nonnegative(),
  templateRef:z.strictObject({id:z.enum(['simple','lateral']),version:z.literal(1)}),
  rendererVersion:z.enum(['simple-1','lateral-1']),engineVersion:z.string().min(1).max(100),
  presentation:ExportProjectionSchema.shape.presentation,
  projectionDigest:Sha256,compositionDigest:Sha256,exportedAt:Timestamp,
  sha256:Sha256,byteLength:z.int().positive(),pageCount:z.int().positive(),
  structuralPolicy:z.literal('visible-export-v1'),
}).superRefine((r,ctx)=>{
  if(r.rendererVersion!==r.templateRef.id+'-1'||r.presentation.templateRef.id!==r.templateRef.id||r.presentation.templateRef.version!==r.templateRef.version)ctx.addIssue({code:'custom',message:'export.recordTemplateMismatch'});
});
export type ExportRecord=z.infer<typeof ExportRecordSchema>;
export interface ExportRecordRepository {
  appendExport(record:ExportRecord):Promise<void>;
  listExports(cvId:string):Promise<ExportRecord[]>;
}
