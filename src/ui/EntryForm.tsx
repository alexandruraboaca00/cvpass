import { useMessages } from './i18n.js';
import { plainText } from '../domain/index.js';
import type { Entry, LiteralField } from '../domain/index.js';
import { editRich, editText, entryPath } from '../application/editor-model.js';
import type { ContentForm, EditorIssue } from '../application/editor-model.js';
import { AddressFields, Check, Field, newAddress, nullable, PeriodFields } from './fields.js';
import type { ContentChange as Change } from './fields.js';
import { RichEditor } from './RichEditor.js';
import { ClassifiedField, OptionalClassifiedField } from './ClassifiedField.js';
import { updateOrganization } from './MvpEntryForm.js';
type CoreEntry = Extract<Entry,{kind:'education'|'work'}>;
const literal = (previous:LiteralField|null,value:string):LiteralField|null=>value === '' ? null : previous ? {...previous,value} : {class:'B',value,locale:'und',protection:'organization'};
export function EntryForm({form,change,issues}:{form:ContentForm;change:Change;issues:EditorIssue[]}) {
  const {t}=useMessages();
  if (form.target.kind !== 'entry') return null;
  const {sectionId,entryId}=form.target, entry=form.entity.sectionsById[sectionId]!.entriesById[entryId]!;
  if (entry.kind !== 'education' && entry.kind !== 'work') return null;
  const path=entryPath(sectionId,entryId)+'.fields', fields=entry.fields;
  const update=(fn:(entry:CoreEntry)=>void)=>change(f=>fn(f.entity.sectionsById[sectionId]!.entriesById[entryId] as CoreEntry));
  const edu=(fn:(entry:Extract<CoreEntry,{kind:'education'}>)=>void)=>update(e=>{if(e.kind === 'education')fn(e);});
  const work=(fn:(entry:Extract<CoreEntry,{kind:'work'}>)=>void)=>update(e=>{if(e.kind === 'work')fn(e);});
  const title=entry.kind === 'education' ? entry.fields.title : entry.fields.position;
  const titleKey=entry.kind === 'education' ? 'title' : 'position';
  return <>
    <p>{t("La titulación o el puesto son obligatorios. Los demás campos son opcionales. Cada formulario modifica únicamente esta entrada.")}</p>
    <ClassifiedField label={entry.kind==='education'?t('Titulación'):t('Puesto')} path={path+'.'+titleKey} value={title} locale={form.textLocale} memory={form.entity.sensitiveTranslationMemory} fieldKind={entry.kind==='education'?'qualification':'position'} issues={issues} allowed={entry.kind==='education'?['C']:['A','C']} onChange={value=>update(e=>{if(e.kind==='education')e.fields.title=value as typeof e.fields.title;else e.fields.position=value as typeof e.fields.position;})} onMemory={(value,memory)=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind==='education')e.fields.title=value;else if(e.kind==='work')e.fields.position=value;f.entity.sensitiveTranslationMemory=memory;})}/>
    <div className="grid"><Field label={entry.kind === 'education' ? t("Institución") : t("Empresa")} path={path+(entry.kind === 'education' ? '.organization' : '.employer')} value={(entry.kind === 'education' ? entry.fields.organization : entry.fields.employer)?.value ?? ''} issues={issues} onChange={v=>update(e=>{if(e.kind === 'education'){e.fields.organization=literal(e.fields.organization,v);e.fields.title=updateOrganization(e.fields.title,v||null);}else {e.fields.employer=literal(e.fields.employer,v);if(e.fields.position.class==='C')e.fields.position=updateOrganization(e.fields.position,v||null);}})}/>
      <Field label={t("Ubicación")} path={path+'.location'} value={fields.location ?? ''} issues={issues} onChange={v=>update(e=>{e.fields.location=nullable(v);})}/>
      <Field label={t("Sitio web")} path={path+'.web'} value={fields.web ?? ''} issues={issues} type="url" onChange={v=>update(e=>{e.fields.web=nullable(v);})}/></div>
    <PeriodFields label={t("Periodo")} path={path+'.period'} period={fields.period} form={form} change={change} issues={issues} setOngoing={(f,v)=>{(f.entity.sectionsById[sectionId]!.entriesById[entryId] as CoreEntry).fields.period.ongoing=v;}}/>
    <RichEditor field={fields.description} onProtectionChange={value=>update(e=>{e.fields.description=value;})} label={entry.kind === 'work' ? t("Descripción y responsabilidades") : t("Descripción")} value={fields.description?.current.value ?? null} onChange={v=>update(e=>{e.fields.description=editRich(e.fields.description,v,form.textLocale);})}/>
    <fieldset><legend>{t("Enlaces adicionales")}</legend>{fields.links.map((link,index)=><div className="repeat grid" key={link.id}>
      <Field label={t("Etiqueta del enlace {n}",{n:index+1})} path={`${path}.links.${index}.label`} value={link.label ?? ''} issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.label=nullable(v);})}/>
      <Field label={t("Dirección del enlace {n}",{n:index+1})} path={`${path}.links.${index}.url`} value={link.url} required type="url" issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.url=v;})}/>
      <button type="button" onClick={()=>update(e=>{e.fields.links.splice(index,1);})}>{t("Retirar enlace {n}",{n:index+1})}</button>
    </div>)}<button type="button" onClick={()=>update(e=>{e.fields.links.push({id:crypto.randomUUID(),label:null,url:''});})}>{t("Añadir enlace")}</button></fieldset>
    {entry.kind === 'work' && <fieldset><legend>{t("Otros datos laborales")}</legend><div className="grid">
      {(['sector','department'] as const).map((key)=><OptionalClassifiedField key={key} label={key==='sector'?t('Sector'):t('Departamento')} path={path+'.'+key} value={entry.fields[key]} memory={form.entity.sensitiveTranslationMemory} locale={form.textLocale} fieldKind={key} issues={issues} onChange={value=>work(e=>{e.fields[key]=value;})} onMemory={(value,memory)=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind==='work')e.fields[key]=value;f.entity.sensitiveTranslationMemory=memory;})}/>)}
      <Field label={t("Contacto de la empresa")} path={path+'.contact'} value={entry.fields.contact ?? ''} issues={issues} onChange={v=>work(e=>{e.fields.contact=nullable(v);})}/>
    </div></fieldset>}
    {entry.kind === 'education' && <fieldset><legend>{t("Otros datos educativos")}</legend><div className="grid">
      {([['fieldOfStudy','Área de estudio'],['thesis','Tesis']] as const).map(([key,label])=><OptionalClassifiedField key={key} label={t(label)} path={path+'.'+key} value={entry.fields[key]} memory={form.entity.sensitiveTranslationMemory} locale={form.textLocale} fieldKind={key} issues={issues} onChange={value=>edu(e=>{e.fields[key]=value;})} onMemory={(value,memory)=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind==='education')e.fields[key]=value;f.entity.sensitiveTranslationMemory=memory;})}/>)}
      <Field label={t("Calificación")} path={path+'.grade'} value={entry.fields.grade ?? ''} issues={issues} onChange={v=>edu(e=>{e.fields.grade=nullable(v);})}/>
      <Field label={t("Clasificación nacional")} path={path+'.nationalClassification'} value={entry.fields.nationalClassification ?? ''} issues={issues} onChange={v=>edu(e=>{e.fields.nationalClassification=nullable(v);})}/>
      <Field label={t("Nivel EQF (1 a 8)")} path={path+'.eqf'} value={form.rawNumbers[path+'.eqf'] ?? ''} issues={issues} onChange={v=>change(f=>{f.rawNumbers[path+'.eqf']=v;})}/>
    </div>
    {entry.fields.subjects.map((subject,index)=><div className="repeat" key={index}><ClassifiedField label={t('Materia {n}',{n:index+1})} path={`${path}.subjects.${index}`} value={subject} memory={form.entity.sensitiveTranslationMemory} locale={form.textLocale} fieldKind="subject" issues={issues} onChange={value=>edu(e=>{e.fields.subjects[index]=value;})} onMemory={(value,memory)=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind==='education')e.fields.subjects[index]=value;f.entity.sensitiveTranslationMemory=memory;})}/><button type="button" onClick={()=>edu(e=>{e.fields.subjects.splice(index,1);})}>{t("Retirar materia {n}",{n:index+1})}</button></div>)}
    <button type="button" onClick={()=>edu(e=>{e.fields.subjects.push({class:'A',current:{value:'',locale:form.textLocale},revision:1,protectedSpans:[]});})}>{t("Añadir materia")}</button>
    <Check label={t("Indicar créditos")} checked={entry.fields.credits !== null} onChange={v=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education'){e.fields.credits=v ? {system:'',amount:0} : null;f.rawNumbers[path+'.credits.amount']='';}})}/>
    {entry.fields.credits && <div className="grid"><Field label={t("Sistema de créditos")} path={path+'.credits.system'} value={entry.fields.credits.system} required issues={issues} onChange={v=>edu(e=>{e.fields.credits!.system=v;})}/>
      <Field label={t("Cantidad de créditos")} path={path+'.credits.amount'} value={form.rawNumbers[path+'.credits.amount'] ?? ''} required issues={issues} onChange={v=>change(f=>{f.rawNumbers[path+'.credits.amount']=v;})}/></div>}
    <Check label={t("Indicar dirección de la institución")} checked={entry.fields.address !== null} onChange={v=>edu(e=>{e.fields.address=v ? newAddress() : null;})}/>
    {entry.fields.address && <AddressFields address={entry.fields.address} path={path+'.address'} issues={issues} update={fn=>edu(e=>fn(e.fields.address!))}/>}
    <Check label={t("Indicar periodo de validez")} checked={entry.fields.validity !== null} onChange={v=>change(f=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education'){e.fields.validity=v ? {start:null,end:null,ongoing:false} : null;for(const key of ['start','end']){if(v)f.rawDates[path+'.validity.'+key]='';else delete f.rawDates[path+'.validity.'+key];}}})}/>
    {entry.fields.validity && <PeriodFields label={t("Validez")} path={path+'.validity'} period={entry.fields.validity} form={form} change={change} issues={issues} setOngoing={(f,v)=>{const e=f.entity.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education')e.fields.validity!.ongoing=v;}}/>}
    </fieldset>}
  </>;
}
