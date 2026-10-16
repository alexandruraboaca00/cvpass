import { z } from 'zod';
import {
  DomainError, PartialDateSchema, assertDataTree, canonical, parse,
  plainText, richText, validateCv,
} from '../domain/index.js';
import type { CvDocument, CvEntry, DomainContext, PartialDate, RichNarrative, RichTextDoc, TextField } from '../domain/index.js';

export const EditorTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({kind:z.literal('personal')}),
  z.strictObject({kind:z.literal('entry'),sectionId:z.uuid(),entryId:z.uuid()}),
  z.strictObject({kind:z.literal('order'),sectionId:z.uuid().nullable()}),
]);
export type EditorTarget = z.infer<typeof EditorTargetSchema>;
export interface EditorForm {
  draftId: string;
  target: EditorTarget;
  cv: CvDocument;
  rawDates: Record<string,string>;
  rawNumbers: Record<string,string>;
}
export interface EditorIssue { path:string; message:string }
export class EditorValidationError extends Error {
  constructor(public readonly issues:EditorIssue[]) { super('EDITOR_VALIDATION'); }
}
export const sectionLabel = (kind:string):string => kind === 'education' ? 'Educación' : kind === 'work' ? 'Experiencia laboral' : kind;
export function dateInput(date:PartialDate|null):string {
  if (!date) return '';
  return String(date.year).padStart(4,'0') + (date.precision === 'year' ? '' : `-${String(date.month).padStart(2,'0')}` + (date.precision === 'day' ? `-${String(date.day).padStart(2,'0')}` : ''));
}
export function parseDateInput(raw:string):PartialDate|null {
  if (raw === '') return null;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(raw);
  if (!match) throw new Error('Usa AAAA, AAAA-MM o AAAA-MM-DD.');
  return parse(PartialDateSchema,match[3] ? {precision:'day',year:Number(match[1]),month:Number(match[2]),day:Number(match[3])} : match[2] ? {precision:'month',year:Number(match[1]),month:Number(match[2])} : {precision:'year',year:Number(match[1])});
}
export function periodLabel(period:{start:PartialDate|null;end:PartialDate|null;ongoing:boolean}):string {
  return [dateInput(period.start),period.ongoing ? 'Actualmente' : dateInput(period.end)].filter(Boolean).join(' → ') || 'Periodo no indicado';
}
// Text classification and approved terms survive ordinary editing. Changing a source makes
// an old approval stale by the F2 rules; F4 does not offer a translation/review workflow.
export function editText(field:TextField|null,value:string,locale:string,required=false):TextField|null {
  if (value === '' && !required) return null;
  if (field && plainText(field) === value) return field;
  if (!field) return {class:'A',current:{value,locale},revision:1,protectedSpans:[]};
  if (field.class === 'B') return {...field,value};
  if (field.class === 'C') {
    if (!field.original) throw new EditorValidationError([{path:'',message:'Este campo importado no tiene original conocido; su edición requiere la revisión de importación.'}]);
    // Keep invalid input in the form as well: strict validation happens at Confirmar.
    return {...field,original:{...field.original,value,revision:field.original.revision+1}};
  }
  return {...field,current:{...field.current,value},revision:field.revision+1};
}
export function editRich(field:RichNarrative|null,value:RichTextDoc,locale:string):RichNarrative|null {
  if (field && canonical(field.current.value) === canonical(value)) return field;
  if (!richText(value).trim()) return null;
  return field ? {...field,current:{...field.current,value},revision:field.revision+1} : {class:'A',current:{value,locale},revision:1,protectedSpans:[]};
}
export function newCoreEntry(kind:'education'|'work',ctx:DomainContext,locale:string):CvEntry {
  const base = {id:ctx.newId(),createdAt:ctx.now(),updatedAt:ctx.now(),sourceRef:null,included:true};
  const common = {period:{start:null,end:null,ongoing:false},description:null,links:[],location:null,web:null};
  // Empty required fields are allowed only inside an unconfirmed form.
  if (kind === 'work') return {...base,kind,fields:{...common,position:{class:'A',current:{value:'',locale},revision:1,protectedSpans:[]},employer:null,sector:null,department:null,contact:null}};
  return {...base,kind,fields:{...common,title:{class:'C',id:ctx.newId(),original:{value:'',locale,revision:1},context:{fieldKind:'qualification'},outputLocale:locale,displayMode:'original',decision:'keepOriginal',approvalId:null,importedVisibleVariants:[]},organization:null,eqf:null,address:null,fieldOfStudy:null,grade:null,thesis:null,subjects:[],nationalClassification:null,credits:null,validity:null}};
}
export const entryPath = (sectionId:string,entryId:string):string => `sectionsById.${sectionId}.entriesById.${entryId}`;
export function makeForm(draftId:string,target:EditorTarget,cv:CvDocument):EditorForm {
  const form:EditorForm = {draftId,target,cv:structuredClone(cv),rawDates:{},rawNumbers:{}};
  if (target.kind === 'personal') form.rawDates['personalInformation.birthDate'] = dateInput(cv.personalInformation.birthDate);
  if (target.kind === 'entry') {
    const entry = cv.sectionsById[target.sectionId]?.entriesById[target.entryId];
    if (!entry || (entry.kind !== 'education' && entry.kind !== 'work')) throw new Error('EDITOR_ENTRY_UNSUPPORTED');
    const path = entryPath(target.sectionId,target.entryId)+'.fields';
    form.rawDates[path+'.period.start'] = dateInput(entry.fields.period.start);
    form.rawDates[path+'.period.end'] = dateInput(entry.fields.period.end);
    if (entry.kind === 'education') {
      form.rawNumbers[path+'.eqf'] = entry.fields.eqf?.toString() ?? '';
      form.rawNumbers[path+'.credits.amount'] = entry.fields.credits?.amount.toString() ?? '';
      if (entry.fields.validity) {
        form.rawDates[path+'.validity.start'] = dateInput(entry.fields.validity.start);
        form.rawDates[path+'.validity.end'] = dateInput(entry.fields.validity.end);
      }
    }
  }
  return form;
}
function setLeaf(object:unknown,path:string,value:unknown):void {
  const parts = path.split('.'); let parent = object as Record<string,unknown>;
  for (const part of parts.slice(0,-1)) {
    if (!Object.hasOwn(parent,part) || !parent[part] || typeof parent[part] !== 'object') throw new Error('EDITOR_FIELD_INVALID');
    parent = parent[part] as Record<string,unknown>;
  }
  if (!Object.hasOwn(parent,parts.at(-1)!)) throw new Error('EDITOR_FIELD_INVALID');
  parent[parts.at(-1)!] = value;
}
export function assertEditorScope(base:CvDocument,form:EditorForm):void {
  assertDataTree(form);
  parse(EditorTargetSchema,form.target);
  const allowed = structuredClone(base), target = form.target, proposed = form.cv;
  if (target.kind === 'personal') {
    allowed.personalInformation = proposed.personalInformation;
    allowed.presentation.personalFieldVisibility = proposed.presentation.personalFieldVisibility;
  } else if (target.kind === 'entry') {
    const section = allowed.sectionsById[target.sectionId], candidate = proposed.sectionsById[target.sectionId];
    if (!section || !candidate || !['education','work'].includes(section.kind)) throw new Error('EDITOR_ENTRY_UNSUPPORTED');
    const entry = candidate.entriesById[target.entryId];
    if (!entry || entry.kind !== section.kind) throw new Error('EDITOR_ENTRY_UNSUPPORTED');
    const previous = section.entriesById[target.entryId];
    if (previous && (entry.createdAt !== previous.createdAt || canonical(entry.sourceRef) !== canonical(previous.sourceRef) || entry.included !== previous.included)) throw new Error('EDITOR_IDENTITY_CHANGED');
    section.entriesById[target.entryId] = entry;
    if (!previous) section.entryOrder!.push(target.entryId);
  } else if (target.sectionId === null) allowed.sectionOrder = proposed.sectionOrder;
  else {
    const section = allowed.sectionsById[target.sectionId];
    if (!section || !['education','work'].includes(section.kind)) throw new Error('EDITOR_SECTION_UNSUPPORTED');
    section.entryOrder = proposed.sectionsById[target.sectionId]!.entryOrder;
  }
  if (canonical(allowed) !== canonical(proposed)) throw new Error('EDITOR_SCOPE_CHANGED');
  const expected = makeForm(form.draftId,target,proposed);
  if (Object.keys(form.rawDates).some(k => !Object.hasOwn(expected.rawDates,k)) || Object.keys(form.rawNumbers).some(k => !Object.hasOwn(expected.rawNumbers,k))) throw new Error('EDITOR_FIELD_INVALID');
}
export function candidateFromForm(base:CvDocument,form:EditorForm,ctx:DomainContext):CvDocument {
  assertEditorScope(base,form);
  const cv = structuredClone(form.cv), issues:EditorIssue[] = [];
  for (const [path,raw] of Object.entries(form.rawDates)) {
    try { setLeaf(cv,path,parseDateInput(raw)); } catch { issues.push({path,message:'Fecha inválida. Usa AAAA, AAAA-MM o AAAA-MM-DD con una fecha real.'}); }
  }
  for (const [path,raw] of Object.entries(form.rawNumbers)) {
    if (path.endsWith('credits.amount') && form.target.kind === 'entry' && cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!.kind === 'education') {
      const e = cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;
      if (e.kind === 'education' && e.fields.credits === null) { if (raw) issues.push({path,message:'Indica también el sistema de créditos.'}); continue; }
    }
    if (raw !== '' && (!/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(Number(raw)))) issues.push({path,message:'Introduce un número válido.'});
    else { try { setLeaf(cv,path,raw === '' ? null : Number(raw)); } catch { issues.push({path,message:'Campo numérico inválido.'}); } }
  }
  // A new repeatable address needs at least one value; an empty row must not
  // become an invalid empty literal when the F2 visible projection is built.
  const addresses:[string,CvDocument['personalInformation']['addresses'][number]][]=[];
  if(form.target.kind==='personal')cv.personalInformation.addresses.forEach((a,index)=>addresses.push([`personalInformation.addresses.${index}`,a]));
  if(form.target.kind==='entry'){
    const entry=cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;
    if(entry.kind==='education'&&entry.fields.address)addresses.push([entryPath(form.target.sectionId,form.target.entryId)+'.fields.address',entry.fields.address]);
  }
  for(const [path,address] of addresses)if(![...address.lines,address.locality,address.region,address.postalCode,address.countryCode,address.original].some(value=>value?.trim()))issues.push({path:path+'.lines',message:'Indica al menos un dato de dirección o retira esta dirección.'});
  if (form.target.kind === 'entry') cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!.updatedAt = ctx.now();
  if (issues.length) throw new EditorValidationError(issues);
  try { return validateCv(cv); } catch (error) {
    if (error instanceof DomainError) throw new EditorValidationError(error.issues.map(i => ({path:i.path.join('.'),message:validationMessage(i.message)})));
    throw error;
  }
}
export function validationMessage(message:string):string {
  if (message.includes('period.inverted')) return 'La fecha final es anterior al inicio.';
  if (message.includes('period.ongoingWithEnd')) return 'Actualmente requiere fecha final vacía. Retira la fecha final o desmarca Actualmente.';
  if (message.includes('span.invalid')) return 'El cambio afecta a un fragmento protegido. Conserva ese fragmento o cancela; su revisión se añadirá en una fase posterior.';
  return 'Valor inválido. Revisa el campo: los datos obligatorios no pueden quedar vacíos y los enlaces deben ser válidos.';
}
