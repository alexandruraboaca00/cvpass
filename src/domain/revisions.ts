import { z } from 'zod';
import { IdSchema, Timestamp, parse, fail } from './primitives.js';
import type { DomainContext } from './primitives.js';
import { CvDocumentSchema, MasterProfileSchema, validateEntity, validateCv, assertEntityInvariants } from './model.js';
import type { Entity, CvDocument } from './model.js';
export const RevisionSchema=z.strictObject({id:IdSchema,entityId:IdSchema,entityKind:z.enum(['profile','cv']),number:z.int().nonnegative(),createdAt:Timestamp,cause:z.enum(['checkpoint','beforeTranslation','edit','restore','import']),retention:z.enum(['ordinary','pinned']),snapshot:z.union([CvDocumentSchema,MasterProfileSchema])});
export type Revision=z.infer<typeof RevisionSchema>;
export function validateRevision(value:unknown):Revision {
  const r=parse(RevisionSchema,value);const e=validateEntity(r.snapshot);
  assertRevisionInvariants({...r,snapshot:e});
  return r;
}
// Internal: RevisionSchema and the containing graph were parsed by the caller.
export function assertRevisionInvariants(r:Revision,entityAlreadyValidated=false):void {
  const e=r.snapshot;if(!entityAlreadyValidated)assertEntityInvariants(e);
  if(r.entityId!==e.id||r.entityKind!==e.kind||r.number!==e.revision)fail('revision.snapshotMismatch');
  if(r.createdAt<e.updatedAt)fail('revision.beforeSnapshot');
  if(r.cause==='beforeTranslation'&&r.retention!=='pinned')fail('revision.translationMustBePinned');
}
export function checkpoint(entity:Entity,ctx:DomainContext,cause:Revision['cause']='beforeTranslation'):Revision {
  const e=validateEntity(entity);
  return validateRevision({id:ctx.newId(),entityId:e.id,entityKind:e.kind,number:e.revision,createdAt:ctx.now(),cause,retention:cause==='beforeTranslation'?'pinned':'ordinary',snapshot:e});
}
export function restoreCv(current:CvDocument,revision:Revision,ctx:DomainContext):CvDocument {
  const cv=validateCv(current),r=validateRevision(revision);
  if(r.entityKind!=='cv'||r.entityId!==cv.id)fail('revision.wrongOwner');
  return validateCv({...r.snapshot,revision:cv.revision+1,createdAt:cv.createdAt,updatedAt:ctx.now()});
}
