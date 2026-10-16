import { z } from 'zod';
import { IdSchema, Locale, NonBlank, Timestamp, SafeLink } from './primitives.js';

const Mark = z.discriminatedUnion('kind', [z.strictObject({ kind: z.literal('bold') }), z.strictObject({ kind: z.literal('italic') }), z.strictObject({ kind: z.literal('link'), href: SafeLink })]);
export const InlineSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('text'), text: z.string().max(100_000), marks: z.array(Mark).max(3) }),
  z.strictObject({ kind: z.literal('break') }),
]);
export const ParagraphSchema = z.strictObject({ kind: z.literal('paragraph'), content: z.array(InlineSchema).max(1000) });
export const RichTextSchema = z.strictObject({ kind: z.literal('doc'), content: z.array(z.union([
  ParagraphSchema,
  z.strictObject({ kind: z.enum(['bulletList', 'orderedList']), items: z.array(z.strictObject({ kind: z.literal('listItem'), content: z.array(ParagraphSchema).min(1).max(100) })).max(1000) }),
])).max(1000) });
export type RichTextDoc = z.infer<typeof RichTextSchema>;
export function richText(value: RichTextDoc): string {
  return value.content.map(block => block.kind === 'paragraph' ? block.content.map(i => i.kind === 'text' ? i.text : '\n').join('') : block.items.map(i => i.content.map(p => p.content.map(n => n.kind === 'text' ? n.text : '\n').join('')).join('\n')).join('\n')).join('\n');
}
const Span = z.strictObject({ id: IdSchema, start: z.int().nonnegative(), end: z.int().positive(), value: NonBlank, entity: z.enum(['person', 'organization', 'brand', 'identifier', 'term']) });
export const NarrativeSchema = z.strictObject({ class: z.literal('A'), current: z.strictObject({ value: NonBlank, locale: Locale }), revision: z.int().positive(), protectedSpans: z.array(Span) }).superRefine((f, ctx) => {
  const sorted = [...f.protectedSpans].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]!;
    if (s.end <= s.start || f.current.value.slice(s.start, s.end) !== s.value || (i > 0 && sorted[i - 1]!.end > s.start)) ctx.addIssue({ code: 'custom', path: ['protectedSpans'], message: 'span.invalid' });
  }
});
export const RichNarrativeSchema = z.strictObject({ class: z.literal('A'), current: z.strictObject({ value: RichTextSchema, locale: Locale }), revision: z.int().positive(), protectedSpans: z.array(Span) }).superRefine((f,ctx)=>{
  const text=richText(f.current.value),sorted=[...f.protectedSpans].sort((a,b)=>a.start-b.start);
  for(let i=0;i<sorted.length;i++){const span=sorted[i]!;if(span.end<=span.start||text.slice(span.start,span.end)!==span.value||(i>0&&sorted[i-1]!.end>span.start))ctx.addIssue({code:'custom',path:['protectedSpans'],message:'span.invalid'});}
});
export const LiteralSchema = z.strictObject({ class: z.literal('B'), value: NonBlank, locale: Locale, protection: z.enum(['person', 'organization', 'brand', 'identifier', 'term']) });
export const SensitiveContextSchema = z.strictObject({ fieldKind: NonBlank, organization: NonBlank.optional(), domain: NonBlank.optional() });
export const SensitiveOriginalSchema = z.strictObject({ value: NonBlank, locale: Locale, revision: z.int().positive() });
export const VisibleVariantSchema = z.strictObject({ role: z.enum(['original', 'translation']), value: NonBlank, locale: Locale });
export const SensitiveSchema = z.strictObject({
  class: z.literal('C'), id: IdSchema, original: SensitiveOriginalSchema.nullable(), context: SensitiveContextSchema,
  outputLocale: Locale, displayMode: z.enum(['original', 'translation', 'translationAndOriginal']),
  decision: z.enum(['pending', 'keepOriginal', 'useApproval', 'importedVisible']), approvalId: IdSchema.nullable(),
  importedVisibleVariants: z.array(VisibleVariantSchema).max(2),
}).superRefine((s, ctx) => {
  if (s.decision === 'importedVisible') {
    const roles = s.importedVisibleVariants.map(v => v.role);
    const expected = s.displayMode === 'translationAndOriginal' ? ['translation', 'original'] : [s.displayMode];
    if (roles.join() !== expected.join() || s.outputLocale !== s.importedVisibleVariants[0]?.locale || s.approvalId !== null || s.original !== null) ctx.addIssue({ code: 'custom', message: 'sensitive.invalidImported' });
  } else if (!s.original || s.importedVisibleVariants.length || (s.decision === 'useApproval') !== (s.approvalId !== null) || (s.decision === 'keepOriginal' && s.displayMode !== 'original')) ctx.addIssue({ code: 'custom', message: 'sensitive.invalidDecision' });
});
export const ApprovalSchema = z.strictObject({ id: IdSchema, source: SensitiveOriginalSchema, context: SensitiveContextSchema, value: NonBlank, locale: Locale, approvedAt: Timestamp, provenance: z.enum(['user', 'transferred']) });
export const TextFieldSchema = z.discriminatedUnion('class', [NarrativeSchema, LiteralSchema, SensitiveSchema]);
export type NarrativeField = z.infer<typeof NarrativeSchema>;
export type LiteralField = z.infer<typeof LiteralSchema>;
export type SensitiveField = z.infer<typeof SensitiveSchema>;
export type SensitiveApproval = z.infer<typeof ApprovalSchema>;
export type TextField = z.infer<typeof TextFieldSchema>;
export type RichNarrative = z.infer<typeof RichNarrativeSchema>;
export const plainText = (f: TextField): string => f.class === 'A' ? f.current.value : f.class === 'B' ? f.value : f.original?.value ?? f.importedVisibleVariants.map(v => v.value).join(' ');
export const A = (value: string, locale = 'es'): NarrativeField => NarrativeSchema.parse({ class: 'A', current: { value, locale }, revision: 1, protectedSpans: [] });
export const B = (value: string, protection: LiteralField['protection'] = 'term', locale = 'und'): LiteralField => LiteralSchema.parse({ class: 'B', value, locale, protection });
