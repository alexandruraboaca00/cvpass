import { parse, fail, same, Timestamp, IdSchema, Locale, NonBlank } from './primitives.js';
import type { DomainContext } from './primitives.js';
import { SensitiveSchema, ApprovalSchema, VisibleVariantSchema, SensitiveOriginalSchema, SensitiveContextSchema } from './content.js';
import type { SensitiveField, SensitiveApproval, TextField } from './content.js';
import { z } from 'zod';
export type TranslationMemory = Record<string,SensitiveApproval>;
export type VisibleVariant = z.infer<typeof VisibleVariantSchema>;
export function approvalMatches(field:SensitiveField,approval:SensitiveApproval):boolean {
  return field.original!==null && same(field.original,approval.source) && same(field.context,approval.context) && field.outputLocale===approval.locale;
}
export function sensitiveReviewState(field:SensitiveField,memory:TranslationMemory):'pending'|'original'|'approved'|'stale'|'imported' {
  parse(SensitiveSchema,field);
  if(field.decision==='importedVisible')return 'imported';
  if(field.decision==='keepOriginal')return 'original';
  if(field.decision!=='useApproval')return 'pending';
  const a=memory[field.approvalId!];return a&&approvalMatches(field,a)?'approved':'stale';
}
export function keepOriginal(field:SensitiveField):SensitiveField {
  return parse(SensitiveSchema,{...field,decision:'keepOriginal',displayMode:'original',approvalId:null,importedVisibleVariants:[]});
}
export function approveSensitive(field:SensitiveField,value:string,locale:string,ctx:DomainContext,mode:'translation'|'translationAndOriginal'='translation'):{field:SensitiveField;approval:SensitiveApproval} {
  parse(SensitiveSchema,field);if(!field.original)fail('sensitive.originalUnknown');
  const approval=parse(ApprovalSchema,{id:parse(IdSchema,ctx.newId()),source:field.original,context:field.context,value:parse(NonBlank,value),locale:parse(Locale,locale),approvedAt:parse(Timestamp,ctx.now()),provenance:'user'});
  const updated=parse(SensitiveSchema,{...field,outputLocale:locale,displayMode:mode,decision:'useApproval',approvalId:approval.id});
  return {field:updated,approval};
}
export function editSensitiveSource(field:SensitiveField,value:string,locale:string,context:SensitiveField['context']=field.context):SensitiveField {
  parse(SensitiveSchema,field);if(!field.original)fail('sensitive.originalUnknown');
  return parse(SensitiveSchema,{...field,original:parse(SensitiveOriginalSchema,{value,locale,revision:field.original.revision+1}),context:parse(SensitiveContextSchema,context)});
}
export function sensitiveFromVisible(variants:VisibleVariant[],context:SensitiveField['context'],ctx:DomainContext):SensitiveField {
  if(!variants.length)fail('sensitive.missingVisible');
  const mode=variants.length===2?'translationAndOriginal':variants[0]!.role;
  return parse(SensitiveSchema,{class:'C',id:ctx.newId(),original:null,context,outputLocale:variants[0]!.locale,displayMode:mode,decision:'importedVisible',approvalId:null,importedVisibleVariants:variants});
}
export function resolveSensitive(field:SensitiveField,memory:TranslationMemory):VisibleVariant[] {
  const state=sensitiveReviewState(field,memory);
  if(state==='imported')return structuredClone(field.importedVisibleVariants);
  if(state==='pending'||state==='stale')fail(`sensitive.${state}`,[field.id]);
  const original:VisibleVariant={role:'original',value:field.original!.value,locale:field.original!.locale};
  if(field.displayMode==='original')return [original];
  const a=memory[field.approvalId!]!;
  const translation:VisibleVariant={role:'translation',value:a.value,locale:a.locale};
  return field.displayMode==='translationAndOriginal'?[translation,original]:[translation];
}
export function selectedApprovals(value:unknown,memory:TranslationMemory):TranslationMemory {
  const ids=new Set<string>();
  function visit(v:unknown):void {
    if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(visit);return;}
    const o=v as Record<string,unknown>;
    if(o.class==='C') {
      const f=o as SensitiveField;
      if(f.approvalId)ids.add(f.approvalId);
      // Other contextual approvals may be reused for fields explicitly transferred.
      for(const a of Object.values(memory))if(f.original&&same(a.source,f.original)&&same(a.context,f.context))ids.add(a.id);
    }
    Object.entries(o).filter(([k])=>k!=='sensitiveTranslationMemory').forEach(([,x])=>visit(x));
  }
  visit(value);return Object.fromEntries([...ids].map(id=>[id,structuredClone(memory[id]!)]));
}
export function fieldPlain(field:TextField,memory:TranslationMemory):string {
  return field.class==='A'?field.current.value:field.class==='B'?field.value:resolveSensitive(field,memory).map(v=>v.value).join(' — ');
}
