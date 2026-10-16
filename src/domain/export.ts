import { z } from 'zod';
import { parse, fail, Locale, NonBlank, WebUrl, Sha256 } from './primitives.js';
import { PartialDateSchema, PeriodSchema, reduceDate } from './dates.js';
import { RichTextSchema, richText } from './content.js';
import type { TextField, RichNarrative } from './content.js';
import { validateCv, SectionKindSchema, CefrSchema, entryIds } from './model.js';
import type { CvDocument, CvEntry, ImagePlacementSchema } from './model.js';
import { resolveSensitive } from './language.js';
export const ExportImageSchema=z.strictObject({sha256:Sha256,mediaType:z.literal('image/png'),width:z.int().positive(),height:z.int().positive(),dataBase64:z.base64()});
export type ExportImage=z.infer<typeof ExportImageSchema>;
const Text=z.strictObject({type:z.literal('text'),value:z.union([NonBlank,RichTextSchema]),locale:Locale,role:z.enum(['content','literal','original','translation'])});
const value=z.union([Text,
  z.strictObject({type:z.literal('date'),value:PartialDateSchema}),
  z.strictObject({type:z.literal('period'),value:PeriodSchema}),
  z.strictObject({type:z.literal('number'),value:z.number().finite()}),
  z.strictObject({type:z.literal('link'),label:NonBlank.nullable(),url:WebUrl}),
  z.strictObject({type:z.literal('cefr'),listening:CefrSchema,reading:CefrSchema,spokenInteraction:CefrSchema,spokenProduction:CefrSchema,writing:CefrSchema}),
  z.strictObject({type:z.literal('image'),sha256:Sha256}),
]);
const fieldName=z.enum(['displayName','givenName','familyName','otherNames','headline','about','contacts','addresses','birthDate','nationalities','gender','identifiers','photo','title','organization','period','location','eqf','web','address','fieldOfStudy','grade','thesis','subjects','nationalClassification','credits','validity','description','links','position','employer','sector','department','contact','label','language','proficiency','issuer','issued','learningMode']);
const datum=z.strictObject({field:fieldName,values:z.array(value).min(1)});
const entry=z.strictObject({kind:z.enum(['education','work','skill','nativeLanguage','foreignLanguage','certification','project','custom']),fields:z.array(datum)});
const section=z.strictObject({kind:SectionKindSchema,title:z.array(Text).nullable(),entries:z.array(entry).min(1),groups:z.array(z.strictObject({name:z.array(Text),entryIndices:z.array(z.int().nonnegative())}))});
export const ExportProjectionSchema=z.strictObject({
  locale:z.enum(['es','en']),documentTitle:z.array(Text).nullable(),
  presentation:z.strictObject({templateRef:z.strictObject({id:NonBlank,version:z.int().positive()}),density:z.enum(['compact','normal','spacious']),accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),fontFamily:NonBlank,page:z.literal('A4'),numbering:z.boolean(),showCefrGuide:z.boolean()}),
  personal:z.array(datum),sections:z.array(section),images:z.array(ExportImageSchema),
});
export type ExportProjection=z.infer<typeof ExportProjectionSchema>;
export const ExportPayloadSchema=z.strictObject({format:z.literal('cvforge-export-payload'),pdfPayloadFormatVersion:z.literal(1),projection:ExportProjectionSchema});
export type ExportPayload=z.infer<typeof ExportPayloadSchema>;
export type ImagePreparation=(placement:z.infer<typeof ImagePlacementSchema>)=>ExportImage;
export function createExportProjection(input:CvDocument,prepareImage?:ImagePreparation):ExportProjection {
  const cv=validateCv(input),memory=cv.sensitiveTranslationMemory;
  const precision=cv.presentation.datePrecision;
  const field=(f:TextField):z.infer<typeof Text>[] => f.class==='A'?[{type:'text',value:f.current.value,locale:f.current.locale,role:'content'}]:f.class==='B'?[{type:'text',value:f.value,locale:f.locale,role:'literal'}]:resolveSensitive(f,memory).map(v=>({type:'text',value:v.value,locale:v.locale,role:v.role}));
  const literal=(s:string):z.infer<typeof Text>=>({type:'text',value:s,locale:'und',role:'literal'});
  const rich=(r:RichNarrative):z.infer<typeof Text>=>({type:'text',value:r.current.value,locale:r.current.locale,role:'content'});
  function entryFields(e:CvEntry):z.infer<typeof datum>[] {
    const out:z.infer<typeof datum>[]=[];
    const text=(key:z.infer<typeof fieldName>,v:TextField|null)=>{if(v)out.push({field:key,values:field(v)});};
    const scalar=(key:z.infer<typeof fieldName>,v:string|null)=>{if(v!==null)out.push({field:key,values:[literal(v)]});};
    const period=(key:z.infer<typeof fieldName>,v:z.infer<typeof PeriodSchema>|null)=>{if(v)out.push({field:key,values:[{type:'period',value:{start:v.start?reduceDate(v.start,precision):null,end:v.end?reduceDate(v.end,precision):null,ongoing:v.ongoing}}]});};
    const date=(key:z.infer<typeof fieldName>,v:z.infer<typeof PartialDateSchema>|null)=>{if(v)out.push({field:key,values:[{type:'date',value:reduceDate(v,precision)}]});};
    const f=e.fields;
    if('description'in f&&f.description&&richText(f.description.current.value).trim())out.push({field:'description',values:[rich(f.description)]});
    if('links'in f&&f.links.length)out.push({field:'links',values:f.links.map(l=>({type:'link',label:l.label,url:l.url}))});
    switch(e.kind){
      case 'education': {
        const f=e.fields;text('title',f.title);text('organization',f.organization);period('period',f.period);scalar('location',f.location);scalar('web',f.web);text('fieldOfStudy',f.fieldOfStudy);scalar('grade',f.grade);text('thesis',f.thesis);scalar('nationalClassification',f.nationalClassification);period('validity',f.validity);
        if(f.address)scalar('address',[...f.address.lines,f.address.locality,f.address.region,f.address.postalCode,f.address.countryCode,f.address.original].filter(Boolean).join(', '));
        if(f.eqf!==null)out.push({field:'eqf',values:[{type:'number',value:f.eqf}]});
        if(f.credits)out.push({field:'credits',values:[literal(f.credits.system),{type:'number',value:f.credits.amount}]});
        if(f.subjects.length)out.push({field:'subjects',values:f.subjects.flatMap(field)});break;
      }
      case 'work':{const f=e.fields;text('position',f.position);text('employer',f.employer);period('period',f.period);scalar('location',f.location);text('sector',f.sector);text('department',f.department);scalar('web',f.web);scalar('contact',f.contact);break;}
      case 'skill':text('label',e.fields.label);break;
      case 'nativeLanguage':case 'foreignLanguage': {
        const l=e.fields.language;scalar('language',l.name??l.code);
        if(e.kind==='foreignLanguage')out.push({field:'proficiency',values:[{type:'cefr',...e.fields.proficiency}]});break;
      }
      case 'certification':{const f=e.fields;text('title',f.title);text('issuer',f.issuer);date('issued',f.issued);scalar('learningMode',f.learningMode);break;}
      case 'project':case 'custom':text('title',e.fields.title);period('period',e.fields.period);break;
    }
    return out;
  }
  const personal:z.infer<typeof datum>[]=[],p=cv.personalInformation,v=cv.presentation.personalFieldVisibility;
  for(const key of ['displayName','givenName','familyName','gender'] as const)if(v[key]&&p[key])personal.push({field:key,values:[literal(p[key])]});
  for(const key of ['otherNames','nationalities'] as const)if(v[key]&&p[key].length)personal.push({field:key,values:p[key].map(literal)});
  if(v.headline&&p.headline)personal.push({field:'headline',values:field(p.headline)});
  if(v.about&&p.about&&richText(p.about.current.value).trim())personal.push({field:'about',values:[rich(p.about)]});
  if(v.birthDate&&p.birthDate)personal.push({field:'birthDate',values:[{type:'date',value:reduceDate(p.birthDate,precision)}]});
  if(v.identifiers&&p.identifiers.length)personal.push({field:'identifiers',values:p.identifiers.map(i=>literal(`${i.label}: ${i.value}`))});
  const contacts=p.contacts.filter(c=>v.contacts.includes(c.id));
  if(contacts.length)personal.push({field:'contacts',values:contacts.map(c=>literal(c.kind==='phone'?`${c.prefix}${c.number}`:c.value))});
  const addresses=p.addresses.filter(a=>v.addresses.includes(a.id));
  if(addresses.length)personal.push({field:'addresses',values:addresses.map(a=>literal([...a.lines,a.locality,a.region,a.postalCode,a.countryCode,a.original].filter(Boolean).join(', ')))});
  const images:ExportImage[]=[];
  if(p.photo?.visible){if(!prepareImage)fail('export.imagePreparationRequired');const image=parse(ExportImageSchema,prepareImage(structuredClone(p.photo)));images.push(image);personal.push({field:'photo',values:[{type:'image',sha256:image.sha256}]});}
  const sections:ExportProjection['sections']=[];
  for(const id of cv.sectionOrder){const s=cv.sectionsById[id]!;if(!s.included)continue;
    const ids=entryIds(s).filter(eid=>s.entriesById[eid]!.included);if(!ids.length)continue;
    const entries=ids.map(eid=>{const e=s.entriesById[eid]!;return {kind:e.kind,fields:entryFields(e)};});
    const groups=s.kind==='skills'?s.groupOrder.filter(gid=>s.groupsById[gid]!.skillIds.some(eid=>ids.includes(eid))).map(gid=>({name:field(s.groupsById[gid]!.name),entryIndices:s.groupsById[gid]!.skillIds.filter(eid=>ids.includes(eid)).map(eid=>ids.indexOf(eid))})):[];
    sections.push({kind:s.kind,title:s.title?field(s.title):null,entries,groups});
  }
  const c=cv.presentation;
  return parse(ExportProjectionSchema,{locale:cv.documentLocale,documentTitle:cv.documentTitle?field(cv.documentTitle):null,presentation:{templateRef:{id:c.templateRef.id,version:c.templateRef.version},density:c.density,accentColor:c.accentColor,fontFamily:c.fontFamily,page:c.page,numbering:c.numbering,showCefrGuide:c.showCefrGuide},personal,sections,images});
}
export function createExportPayload(projection:ExportProjection):ExportPayload{return parse(ExportPayloadSchema,{format:'cvforge-export-payload',pdfPayloadFormatVersion:1,projection});}
