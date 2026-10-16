import { plainText } from '../domain/index.js';
import type { CvEntry, LiteralField } from '../domain/index.js';
import { editRich, editText, entryPath } from '../application/editor-model.js';
import type { EditorForm, EditorIssue } from '../application/editor-model.js';
import { AddressFields, Check, Field, newAddress, nullable, PeriodFields } from './fields.js';
import type { Change } from './fields.js';
import { RichEditor } from './RichEditor.js';
type CoreEntry = Extract<CvEntry,{kind:'education'|'work'}>;
const literal = (previous:LiteralField|null,value:string):LiteralField|null=>value === '' ? null : previous ? {...previous,value} : {class:'B',value,locale:'und',protection:'organization'};
export function EntryForm({form,change,issues}:{form:EditorForm;change:Change;issues:EditorIssue[]}) {
  if (form.target.kind !== 'entry') return null;
  const {sectionId,entryId}=form.target, entry=form.cv.sectionsById[sectionId]!.entriesById[entryId]!;
  if (entry.kind !== 'education' && entry.kind !== 'work') return null;
  const path=entryPath(sectionId,entryId)+'.fields', fields=entry.fields;
  const update=(fn:(entry:CoreEntry)=>void)=>change(f=>fn(f.cv.sectionsById[sectionId]!.entriesById[entryId] as CoreEntry));
  const edu=(fn:(entry:Extract<CoreEntry,{kind:'education'}>)=>void)=>update(e=>{if(e.kind === 'education')fn(e);});
  const work=(fn:(entry:Extract<CoreEntry,{kind:'work'}>)=>void)=>update(e=>{if(e.kind === 'work')fn(e);});
  const title=entry.kind === 'education' ? entry.fields.title : entry.fields.position;
  const titleKey=entry.kind === 'education' ? 'title' : 'position';
  const locked=title.class === 'C' && title.original === null;
  return <>
    <p>La titulación o el puesto son obligatorios. Los demás campos son opcionales. Cada formulario modifica únicamente esta entrada.</p>
    {locked ? <p role="note">Original desconocido del contenido importado: {plainText(title)}. Se conserva; su revisión se realizará con el flujo de importación.</p>
      : <Field label={entry.kind === 'education' ? 'Titulación' : 'Puesto'} path={path+'.'+titleKey} required issues={issues} value={plainText(title)} onChange={v=>update(e=>{if(e.kind === 'education') e.fields.title=editText(e.fields.title,v,form.cv.documentLocale,true) as typeof e.fields.title;else e.fields.position=editText(e.fields.position,v,form.cv.documentLocale,true) as typeof e.fields.position;})}/>}
    <div className="grid"><Field label={entry.kind === 'education' ? 'Institución' : 'Empresa'} path={path+(entry.kind === 'education' ? '.organization' : '.employer')} value={(entry.kind === 'education' ? entry.fields.organization : entry.fields.employer)?.value ?? ''} issues={issues} onChange={v=>update(e=>{if(e.kind === 'education')e.fields.organization=literal(e.fields.organization,v);else e.fields.employer=literal(e.fields.employer,v);})}/>
      <Field label="Ubicación" path={path+'.location'} value={fields.location ?? ''} issues={issues} onChange={v=>update(e=>{e.fields.location=nullable(v);})}/>
      <Field label="Sitio web" path={path+'.web'} value={fields.web ?? ''} issues={issues} type="url" onChange={v=>update(e=>{e.fields.web=nullable(v);})}/></div>
    <PeriodFields label="Periodo" path={path+'.period'} period={fields.period} form={form} change={change} issues={issues} setOngoing={(f,v)=>{(f.cv.sectionsById[sectionId]!.entriesById[entryId] as CoreEntry).fields.period.ongoing=v;}}/>
    <RichEditor label={entry.kind === 'work' ? 'Descripción y responsabilidades' : 'Descripción'} value={fields.description?.current.value ?? null} onChange={v=>update(e=>{e.fields.description=editRich(e.fields.description,v,form.cv.documentLocale);})}/>
    <fieldset><legend>Enlaces adicionales</legend>{fields.links.map((link,index)=><div className="repeat grid" key={link.id}>
      <Field label={`Etiqueta del enlace ${index+1}`} path={`${path}.links.${index}.label`} value={link.label ?? ''} issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.label=nullable(v);})}/>
      <Field label={`Dirección del enlace ${index+1}`} path={`${path}.links.${index}.url`} value={link.url} required type="url" issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.url=v;})}/>
      <button type="button" onClick={()=>update(e=>{e.fields.links.splice(index,1);})}>Retirar enlace {index+1}</button>
    </div>)}<button type="button" onClick={()=>update(e=>{e.fields.links.push({id:crypto.randomUUID(),label:null,url:''});})}>Añadir enlace</button></fieldset>
    {entry.kind === 'work' && <fieldset><legend>Otros datos laborales</legend><div className="grid">
      {(['sector','department'] as const).map((key)=><Field key={key} label={key === 'sector' ? 'Sector' : 'Departamento'} path={path+'.'+key} value={entry.fields[key] ? plainText(entry.fields[key]!) : ''} issues={issues} onChange={v=>work(e=>{e.fields[key]=editText(e.fields[key],v,form.cv.documentLocale);})}/>)}
      <Field label="Contacto de la empresa" path={path+'.contact'} value={entry.fields.contact ?? ''} issues={issues} onChange={v=>work(e=>{e.fields.contact=nullable(v);})}/>
    </div></fieldset>}
    {entry.kind === 'education' && <fieldset><legend>Otros datos educativos</legend><div className="grid">
      {([['fieldOfStudy','Área de estudio'],['thesis','Tesis']] as const).map(([key,label])=><Field key={key} label={label} path={path+'.'+key} value={entry.fields[key] ? plainText(entry.fields[key]!) : ''} issues={issues} onChange={v=>edu(e=>{e.fields[key]=editText(e.fields[key],v,form.cv.documentLocale);})}/>)}
      <Field label="Calificación" path={path+'.grade'} value={entry.fields.grade ?? ''} issues={issues} onChange={v=>edu(e=>{e.fields.grade=nullable(v);})}/>
      <Field label="Clasificación nacional" path={path+'.nationalClassification'} value={entry.fields.nationalClassification ?? ''} issues={issues} onChange={v=>edu(e=>{e.fields.nationalClassification=nullable(v);})}/>
      <Field label="Nivel EQF (1 a 8)" path={path+'.eqf'} value={form.rawNumbers[path+'.eqf'] ?? ''} issues={issues} onChange={v=>change(f=>{f.rawNumbers[path+'.eqf']=v;})}/>
    </div>
    {entry.fields.subjects.map((subject,index)=><div className="repeat" key={index}><Field label={`Materia ${index+1}`} path={`${path}.subjects.${index}`} value={plainText(subject)} required issues={issues} onChange={v=>edu(e=>{e.fields.subjects[index]=editText(subject,v,form.cv.documentLocale,true)!;})}/><button type="button" onClick={()=>edu(e=>{e.fields.subjects.splice(index,1);})}>Retirar materia {index+1}</button></div>)}
    <button type="button" onClick={()=>edu(e=>{e.fields.subjects.push({class:'A',current:{value:'',locale:form.cv.documentLocale},revision:1,protectedSpans:[]});})}>Añadir materia</button>
    <Check label="Indicar créditos" checked={entry.fields.credits !== null} onChange={v=>change(f=>{const e=f.cv.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education'){e.fields.credits=v ? {system:'',amount:0} : null;f.rawNumbers[path+'.credits.amount']='';}})}/>
    {entry.fields.credits && <div className="grid"><Field label="Sistema de créditos" path={path+'.credits.system'} value={entry.fields.credits.system} required issues={issues} onChange={v=>edu(e=>{e.fields.credits!.system=v;})}/>
      <Field label="Cantidad de créditos" path={path+'.credits.amount'} value={form.rawNumbers[path+'.credits.amount'] ?? ''} required issues={issues} onChange={v=>change(f=>{f.rawNumbers[path+'.credits.amount']=v;})}/></div>}
    <Check label="Indicar dirección de la institución" checked={entry.fields.address !== null} onChange={v=>edu(e=>{e.fields.address=v ? newAddress() : null;})}/>
    {entry.fields.address && <AddressFields address={entry.fields.address} path={path+'.address'} issues={issues} update={fn=>edu(e=>fn(e.fields.address!))}/>}
    <Check label="Indicar periodo de validez" checked={entry.fields.validity !== null} onChange={v=>change(f=>{const e=f.cv.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education'){e.fields.validity=v ? {start:null,end:null,ongoing:false} : null;for(const key of ['start','end']){if(v)f.rawDates[path+'.validity.'+key]='';else delete f.rawDates[path+'.validity.'+key];}}})}/>
    {entry.fields.validity && <PeriodFields label="Validez" path={path+'.validity'} period={entry.fields.validity} form={form} change={change} issues={issues} setOngoing={(f,v)=>{const e=f.cv.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind === 'education')e.fields.validity!.ongoing=v;}}/>}
    </fieldset>}
  </>;
}
