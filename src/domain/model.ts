import { z } from 'zod';
import { IdSchema, NonBlank, Timestamp, DocumentLocale, Locale, Sha256, WebUrl, parse, assertOrder, checkMap, fail } from './primitives.js';
import { PartialDateSchema, PeriodSchema } from './dates.js';
import { TextFieldSchema, LiteralSchema, NarrativeSchema, SensitiveSchema, RichNarrativeSchema, ApprovalSchema } from './content.js';

export const SectionKindSchema = z.enum(['education', 'work', 'skills', 'languages', 'certifications', 'projects', 'custom']);
export type SectionKind = z.infer<typeof SectionKindSchema>;
export const ContactSchema = z.discriminatedUnion('kind', [
  z.strictObject({ id: IdSchema, kind: z.literal('email'), label: NonBlank.nullable(), value: z.email() }),
  z.strictObject({ id: IdSchema, kind: z.literal('phone'), label: NonBlank.nullable(), prefix: z.string().regex(/^\+?[0-9 ]{0,8}$/), number: NonBlank }),
  z.strictObject({ id: IdSchema, kind: z.enum(['website', 'social']), label: NonBlank.nullable(), value: WebUrl }),
]);
export const AddressSchema = z.strictObject({ id: IdSchema, lines: z.array(NonBlank), locality: NonBlank.nullable(), region: NonBlank.nullable(), postalCode: NonBlank.nullable(), countryCode: z.string().regex(/^[A-Z]{2}$/).nullable(), original: NonBlank.nullable() });
export const ImagePlacementSchema = z.strictObject({ assetId: IdSchema, crop: z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }).refine(c => c.x + c.width <= 1 && c.y + c.height <= 1, 'image.cropOutside'), visible: z.boolean() });
export const PersonalSchema = z.strictObject({
  displayName: NonBlank, givenName: NonBlank.nullable(), familyName: NonBlank.nullable(), otherNames: z.array(NonBlank),
  headline: TextFieldSchema.nullable(), about: RichNarrativeSchema.nullable(), contacts: z.array(ContactSchema), addresses: z.array(AddressSchema),
  birthDate: PartialDateSchema.nullable(), nationalities: z.array(NonBlank), gender: NonBlank.nullable(), identifiers: z.array(z.strictObject({ id: IdSchema, label: NonBlank, value: NonBlank })),
  photo: ImagePlacementSchema.nullable(),
});
export type PersonalInformation = z.infer<typeof PersonalSchema>;
export const AssetSchema = z.strictObject({
  id: IdSchema, sha256: Sha256, mediaType: z.enum(['image/png', 'image/jpeg', 'application/pdf', 'application/octet-stream', 'text/xml', 'application/xml', 'font/ttf', 'font/otf']),
  byteLength: z.int().positive().max(100 * 1024 * 1024), role: z.enum(['photo', 'signature', 'source', 'templateResource']),
  dimensions: z.strictObject({ width: z.int().positive().max(20_000), height: z.int().positive().max(20_000) }).nullable(),
}).superRefine((a, ctx) => {
  const image = a.mediaType === 'image/png' || a.mediaType === 'image/jpeg';
  if (image !== (a.dimensions !== null) || (['photo', 'signature'].includes(a.role) && !image)) ctx.addIssue({ code: 'custom', message: 'asset.invalidDimensionsOrRole' });
});
export type Asset = z.infer<typeof AssetSchema>;
export const ProfileSourceSchema = z.strictObject({ kind: z.literal('profile'), profileId: IdSchema, profileEntryId: IdSchema, profileRevision: z.int().nonnegative() });
const base = { id: IdSchema, createdAt: Timestamp, updatedAt: Timestamp, sourceRef: ProfileSourceSchema.nullable() };
const link = z.strictObject({ id: IdSchema, label: NonBlank.nullable(), url: WebUrl });
const common = { description: RichNarrativeSchema.nullable(), links: z.array(link) };
const Education = z.strictObject({ ...base, kind: z.literal('education'), fields: z.strictObject({ ...common,
  title: SensitiveSchema, organization: LiteralSchema.nullable(), period: PeriodSchema,
  location: NonBlank.nullable(), eqf: z.int().min(1).max(8).nullable(), web: WebUrl.nullable(), address: AddressSchema.nullable(),
  fieldOfStudy: TextFieldSchema.nullable(), grade: NonBlank.nullable(), thesis: TextFieldSchema.nullable(), subjects: z.array(TextFieldSchema), nationalClassification: NonBlank.nullable(),
  credits: z.strictObject({ system: NonBlank, amount: z.number().nonnegative() }).nullable(), validity: PeriodSchema.nullable(),
}) });
const Work = z.strictObject({ ...base, kind: z.literal('work'), fields: z.strictObject({ ...common, position: z.union([NarrativeSchema, SensitiveSchema]), employer: LiteralSchema.nullable(), period: PeriodSchema, location: NonBlank.nullable(), sector: TextFieldSchema.nullable(), department: TextFieldSchema.nullable(), web: WebUrl.nullable(), contact: NonBlank.nullable() }) });
const Skill = z.strictObject({ ...base, kind: z.literal('skill'), fields: z.strictObject({ label: TextFieldSchema, groupId: IdSchema.nullable(), catalog: z.strictObject({ system: NonBlank, id: NonBlank, version: NonBlank }).nullable() }) });
const languageName = z.strictObject({ code: Locale.nullable(), name: NonBlank.nullable() }).refine(l => l.code !== null || l.name !== null, 'language.missing');
export const CefrSchema = z.enum(['A1','A2','B1','B2','C1','C2']).nullable();
const Native = z.strictObject({ ...base, kind: z.literal('nativeLanguage'), fields: z.strictObject({ language: languageName }) });
const Foreign = z.strictObject({ ...base, kind: z.literal('foreignLanguage'), fields: z.strictObject({ language: languageName, proficiency: z.strictObject({ listening: CefrSchema, reading: CefrSchema, spokenInteraction: CefrSchema, spokenProduction: CefrSchema, writing: CefrSchema }) }) });
const Certification = z.strictObject({ ...base, kind: z.literal('certification'), fields: z.strictObject({ ...common, title: TextFieldSchema, issuer: LiteralSchema.nullable(), issued: PartialDateSchema.nullable(), learningMode: NonBlank.nullable() }) });
const projectFields = z.strictObject({ ...common, title: TextFieldSchema, period: PeriodSchema });
const Project = z.strictObject({ ...base, kind: z.literal('project'), fields: projectFields });
const Custom = z.strictObject({ ...base, kind: z.literal('custom'), fields: projectFields });
export const EntrySchema = z.discriminatedUnion('kind', [Education,Work,Skill,Native,Foreign,Certification,Project,Custom]);
export type Entry = z.infer<typeof EntrySchema>;
export const ProfileSectionSchema = z.strictObject({ id: IdSchema, kind: SectionKindSchema, title: TextFieldSchema.nullable(), entriesById: z.record(IdSchema, EntrySchema), entryOrder: z.array(IdSchema).nullable(), groupsById: z.record(IdSchema, z.strictObject({ id: IdSchema, name: TextFieldSchema, skillIds: z.array(IdSchema) })), groupOrder: z.array(IdSchema), ungroupedSkillIds: z.array(IdSchema) });
export type ProfileSection = z.infer<typeof ProfileSectionSchema>;
// Validation of CV entry inclusion is explicit below; retain a precise discriminated union type.
export type CvEntry = Entry & { included: boolean };
export type CvSection = Omit<ProfileSection, 'entriesById'> & { included: boolean; entriesById: Record<string, CvEntry> };
const CvEntryUnion = z.discriminatedUnion('kind', [Education.extend({included:z.boolean()}),Work.extend({included:z.boolean()}),Skill.extend({included:z.boolean()}),Native.extend({included:z.boolean()}),Foreign.extend({included:z.boolean()}),Certification.extend({included:z.boolean()}),Project.extend({included:z.boolean()}),Custom.extend({included:z.boolean()})]);
export const CvSectionSchema = ProfileSectionSchema.extend({ included: z.boolean(), entriesById: z.record(IdSchema,CvEntryUnion) });
export const TemplateSchema = z.strictObject({ id: NonBlank, version: z.int().positive(), rendererContractVersion: z.literal(1), layout: z.enum(['singleColumn','twoColumn']), capabilities: z.array(SectionKindSchema), resourceRefs: z.array(z.strictObject({ assetId: IdSchema, license: NonBlank, attribution: NonBlank })) });
export type TemplateDefinition = z.infer<typeof TemplateSchema>;
export const PersonalVisibilitySchema = z.strictObject({ displayName: z.boolean(), givenName: z.boolean(), familyName: z.boolean(), otherNames: z.boolean(), headline: z.boolean(), about: z.boolean(), birthDate: z.boolean(), nationalities: z.boolean(), gender: z.boolean(), identifiers: z.boolean(), contacts: z.array(IdSchema), addresses: z.array(IdSchema) });
export const PresentationSchema = z.strictObject({ templateRef: z.strictObject({ id: NonBlank, version: z.int().positive() }), density: z.enum(['compact','normal','spacious']), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), fontFamily: NonBlank, page: z.literal('A4'), numbering: z.boolean(), datePrecision: z.enum(['year','month','day']), showCefrGuide: z.boolean(), personalFieldVisibility: PersonalVisibilitySchema });
const entityBase = { id: IdSchema, revision: z.int().nonnegative(), createdAt: Timestamp, updatedAt: Timestamp, personalInformation: PersonalSchema, sensitiveTranslationMemory: z.record(IdSchema,ApprovalSchema) };
export const MasterProfileSchema = z.strictObject({ ...entityBase, kind: z.literal('profile'), sectionsById: z.record(IdSchema,ProfileSectionSchema), sectionOrder: z.array(IdSchema) });
export const CvDocumentSchema = z.strictObject({ ...entityBase, kind: z.literal('cv'), name: NonBlank, documentTitle: TextFieldSchema.nullable(), documentLocale: DocumentLocale, sectionsById: z.record(IdSchema,CvSectionSchema), sectionOrder: z.array(IdSchema), presentation: PresentationSchema });
export type MasterProfile = z.infer<typeof MasterProfileSchema>;
export type CvDocument = z.infer<typeof CvDocumentSchema>;
export type Entity = MasterProfile | CvDocument;
export const AssetMapSchema = z.record(IdSchema,AssetSchema);

const allowed: Record<SectionKind, Entry['kind'][]> = { education:['education'], work:['work'], skills:['skill'], languages:['nativeLanguage','foreignLanguage'], certifications:['certification'], projects:['project'], custom:['custom'] };
export function entryIds(section: ProfileSection): string[] { return section.kind === 'skills' ? [...section.ungroupedSkillIds,...section.groupOrder.flatMap(id => section.groupsById[id]!.skillIds)] : section.entryOrder!; }
export function validateEntity(input: unknown): Entity {
  const entity = parse(z.discriminatedUnion('kind',[MasterProfileSchema,CvDocumentSchema]),input);
  if (entity.updatedAt < entity.createdAt) fail('timestamp.inverted');
  checkMap(entity.sectionsById,['sectionsById']); checkMap(entity.sensitiveTranslationMemory,['sensitiveTranslationMemory']);
  assertOrder(entity.sectionOrder,Object.keys(entity.sectionsById),['sectionOrder']);
  const seen = new Set<string>();
  function unique(value: unknown, path: (string|number)[] = []): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((v,i)=>unique(v,[...path,i])); return; }
    for (const [key,v] of Object.entries(value)) {
      if (key === 'sourceRef') continue; // Provenance references the original profile, never a dependency.
      if (key === 'id' && typeof v === 'string') { if (seen.has(v)) fail('id.duplicate',[...path,key]); seen.add(v); }
      else unique(v,[...path,key]);
    }
  }
  unique(entity);
  for (const section of Object.values(entity.sectionsById)) {
    if (section.kind==='custom' && !section.title) fail('section.titleRequired',[section.id,'title']);
    checkMap(section.entriesById,[section.id,'entriesById']);checkMap(section.groupsById,[section.id,'groupsById']);
    for (const entry of Object.values(section.entriesById)) {
      if (!allowed[section.kind].includes(entry.kind)) fail('entry.wrongSection',[section.id,entry.id]);
      if (entry.updatedAt<entry.createdAt) fail('timestamp.inverted',[section.id,entry.id]);
    }
    if (section.kind==='skills') {
      if(section.entryOrder!==null) fail('skills.secondOrder',[section.id]);
      assertOrder(section.groupOrder,Object.keys(section.groupsById),[section.id,'groupOrder']);
      assertOrder(entryIds(section),Object.keys(section.entriesById),[section.id,'skills']);
      for(const [groupId,ids] of [[null,section.ungroupedSkillIds],...section.groupOrder.map(id=>[id,section.groupsById[id]!.skillIds])] as [string|null,string[]][]) for(const id of ids) {
        const e=section.entriesById[id];if(e?.kind!=='skill'||e.fields.groupId!==groupId) fail('skill.groupMismatch',[section.id,id]);
      }
    } else {
      if(section.entryOrder===null||section.groupOrder.length||section.ungroupedSkillIds.length||Object.keys(section.groupsById).length) fail('section.invalidOrderModel',[section.id]);
      assertOrder(section.entryOrder,Object.keys(section.entriesById),[section.id,'entryOrder']);
    }
  }
  function approvalRefs(value: unknown):void {
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(approvalRefs);return;}
    const obj=value as Record<string,unknown>;
    if(obj.class==='C' && typeof obj.approvalId==='string' && !entity.sensitiveTranslationMemory[obj.approvalId])fail('sensitive.missingApproval');
    Object.values(obj).forEach(approvalRefs);
  }
  approvalRefs(entity);
  if(entity.kind==='cv') {
    const v=entity.presentation.personalFieldVisibility;
    for(const [ids,records] of [[v.contacts,entity.personalInformation.contacts],[v.addresses,entity.personalInformation.addresses]] as [string[],{id:string}[]][]) {
      if(new Set(ids).size!==ids.length||ids.some(id=>!records.some(r=>r.id===id))) fail('visibility.invalidReference');
    }
  }
  return entity;
}
export function validateProfile(value: unknown): MasterProfile { const p=validateEntity(value);if(p.kind!=='profile')fail('entity.expectedProfile');return p; }
export function validateCv(value: unknown): CvDocument { const cv=validateEntity(value);if(cv.kind!=='cv')fail('entity.expectedCv');return cv; }
