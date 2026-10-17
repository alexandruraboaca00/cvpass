import { parse, NonBlank, validateCv, DomainError } from '../domain/index.js';
import type { CvDocument, DomainContext, PersonalInformation } from '../domain/index.js';
import { parseDateInput, EditorValidationError } from './editor-model.js';
import type { EditorIssue } from './editor-model.js';
import { importTemplate, importFail } from './import-contract.js';
import type { ImportDraft } from './import-contract.js';

export function emptyImportDraft(ctx:DomainContext,locale:'es'|'en'|null,name:string):ImportDraft {
  const p:PersonalInformation={displayName:'',givenName:null,familyName:null,otherNames:[],headline:null,about:null,contacts:[],addresses:[],birthDate:null,nationalities:[],gender:null,identifiers:[],photo:null},at=ctx.now();
  // Empty required values belong only to an unconfirmed proposal, never to the library.
  const cv:CvDocument={kind:'cv',id:ctx.newId(),revision:0,createdAt:at,updatedAt:at,name,documentTitle:null,documentLocale:locale??'es',personalInformation:p,sectionsById:{},sectionOrder:[],sensitiveTranslationMemory:{},
    presentation:{templateRef:{id:importTemplate.id,version:importTemplate.version},density:'normal',accentColor:'#224466',fontFamily:'Liberation Sans',page:'A4',numbering:false,datePrecision:'day',showCefrGuide:false,
      personalFieldVisibility:{displayName:true,givenName:false,familyName:false,otherNames:false,headline:true,about:true,birthDate:false,nationalities:false,gender:false,identifiers:false,contacts:[],addresses:[]}}};
  return {cv,rawDates:{},rawNumbers:{},documentLocale:locale,localeEvidence:'',mappings:[],issues:[]};
}
export function importDatePaths(cv:CvDocument):Set<string>{
  const keys=new Set(['personalInformation.birthDate']);
  for(const s of Object.values(cv.sectionsById))for(const e of Object.values(s.entriesById)){
    const base=`sectionsById.${s.id}.entriesById.${e.id}.fields`;
    if('period' in e.fields){keys.add(base+'.period.start');keys.add(base+'.period.end');}
    if(e.kind==='education'&&e.fields.validity){keys.add(base+'.validity.start');keys.add(base+'.validity.end');}
    if(e.kind==='certification')keys.add(base+'.issued');
  }return keys;
}
function set(object:unknown,path:string,value:unknown):void{
  let cursor=object as Record<string,unknown>;const keys=path.split('.');
  for(const key of keys.slice(0,-1)){if(!Object.hasOwn(cursor,key)||!cursor[key]||typeof cursor[key]!=='object')importFail('IMPORT_REVIEW_PATH_INVALID');cursor=cursor[key] as Record<string,unknown>;}
  if(!Object.hasOwn(cursor,keys.at(-1)!))importFail('IMPORT_REVIEW_PATH_INVALID');cursor[keys.at(-1)!]=value;
}
export function validateImportDraft(input:Pick<ImportDraft,'cv'|'rawDates'|'rawNumbers'|'documentLocale'>):CvDocument{
  const cv=structuredClone(input.cv),issues:EditorIssue[]=[],dates=importDatePaths(cv);
  if(!input.documentLocale)issues.push({path:'documentLocale',message:'Selecciona el idioma del documento; no se ha inferido una traducción.'});else cv.documentLocale=input.documentLocale;
  for(const [path,value] of Object.entries(input.rawDates)){
    if(!dates.has(path))importFail('IMPORT_REVIEW_PATH_INVALID');
    try{set(cv,path,parseDateInput(value));}catch{issues.push({path,message:'Fecha inválida. Usa AAAA, AAAA-MM o AAAA-MM-DD con una fecha real.'});}
  }
  const numbers=new Set<string>();for(const s of Object.values(cv.sectionsById))for(const e of Object.values(s.entriesById))if(e.kind==='education'){
    const base=`sectionsById.${s.id}.entriesById.${e.id}.fields`;numbers.add(base+'.eqf');numbers.add(base+'.credits.amount');
  }
  for(const [path,value] of Object.entries(input.rawNumbers)){
    if(!numbers.has(path))importFail('IMPORT_REVIEW_PATH_INVALID');
    if(path.endsWith('.credits.amount')){const keys=path.split('.'),e=cv.sectionsById[keys[1]!]!.entriesById[keys[3]!]!;if(e.kind==='education'&&!e.fields.credits){if(value!=='')issues.push({path,message:'Indica también el sistema de créditos.'});continue;}}
    if(value!==''&&!/^\d+(?:\.\d+)?$/.test(value))issues.push({path,message:'Introduce un número válido.'});else set(cv,path,value===''?null:Number(value));
  }
  if(issues.length)throw new EditorValidationError(issues);
  try{parse(NonBlank,cv.name);return validateCv(cv);}catch(error){
    if(error instanceof DomainError)throw new EditorValidationError(error.issues.map(i=>({path:i.path.join('.'),message:i.message.includes('period.')?'El periodo es inválido. Revisa las fechas y Actualmente.':'Valor inválido. Revisa los datos obligatorios y el formato del campo.'})));
    throw error;
  }
}
