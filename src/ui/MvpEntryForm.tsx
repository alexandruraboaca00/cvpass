import { plainText } from '../domain/index.js';
import type { CvEntry, SensitiveField, TextField } from '../domain/index.js';
import { editRich, entryPath } from '../application/editor-model.js';
import type { EditorForm, EditorIssue } from '../application/editor-model.js';
import { ClassifiedField } from './ClassifiedField.js';
import { Field, nullable, PeriodFields, SelectField } from './fields.js';
import type { Change } from './fields.js';
import { RichEditor } from './RichEditor.js';
import { useMessages } from './i18n.js';
type Additional=Extract<CvEntry,{kind:'certification'|'project'|'custom'}>;
export function updateOrganization(field:SensitiveField,organization:string|null):SensitiveField {
  const context={...field.context};if(organization)context.organization=organization;else delete context.organization;
  return {...field,context};
}
export function MvpEntryForm({form,change,issues}:{form:EditorForm;change:Change;issues:EditorIssue[]}){
  const {t}=useMessages();if(form.target.kind!=='entry')return null;
  const {sectionId,entryId}=form.target,entry=form.cv.sectionsById[sectionId]!.entriesById[entryId]!,path=entryPath(sectionId,entryId)+'.fields';
  if(entry.kind==='nativeLanguage'||entry.kind==='foreignLanguage')return <LanguageFields entry={entry} path={path} issues={issues} update={fn=>change(f=>fn(f.cv.sectionsById[sectionId]!.entriesById[entryId] as typeof entry))}/>;
  if(entry.kind!=='certification'&&entry.kind!=='project'&&entry.kind!=='custom')return null;
  const update=(fn:(e:Additional)=>void)=>change(f=>fn(f.cv.sectionsById[sectionId]!.entriesById[entryId] as Additional));
  const setTitle=(value:TextField)=>update(e=>{e.fields.title=value;});
  return <><p>{t('El título es obligatorio. Cada formulario modifica únicamente esta entrada.')}</p>
    <ClassifiedField label={t('Título')} path={path+'.title'} value={entry.fields.title} locale={form.cv.documentLocale} memory={form.cv.sensitiveTranslationMemory} fieldKind={entry.kind} issues={issues} onChange={setTitle} onMemory={(field,memory)=>change(f=>{(f.cv.sectionsById[sectionId]!.entriesById[entryId] as Additional).fields.title=field;f.cv.sensitiveTranslationMemory=memory;})}/>
    {entry.kind==='certification'?<><div className="grid"><Field label={t('Emisor')} path={path+'.issuer'} value={entry.fields.issuer?.value??''} issues={issues} onChange={value=>update(e=>{if(e.kind==='certification'){e.fields.issuer=value===''?null:{class:'B',value,locale:'und',protection:'organization'};if(e.fields.title.class==='C')e.fields.title=updateOrganization(e.fields.title,value||null);}})}/>
      <Field label={t('Fecha de expedición')} path={path+'.issued'} value={form.rawDates[path+'.issued']??''} issues={issues} hint={t('AAAA, AAAA-MM o AAAA-MM-DD')} onChange={v=>change(f=>{f.rawDates[path+'.issued']=v;})}/>
      <Field label={t('Modalidad de aprendizaje')} path={path+'.learningMode'} value={entry.fields.learningMode??''} issues={issues} onChange={v=>update(e=>{if(e.kind==='certification')e.fields.learningMode=nullable(v);})}/></div></>
      :<PeriodFields label={t('Periodo')} path={path+'.period'} period={entry.fields.period} form={form} change={change} issues={issues} setOngoing={(f,v)=>{const e=f.cv.sectionsById[sectionId]!.entriesById[entryId]!;if(e.kind==='project'||e.kind==='custom')e.fields.period.ongoing=v;}}/>}
    <RichEditor field={entry.fields.description} onProtectionChange={value=>update(e=>{e.fields.description=value;})} label={t('Descripción')} value={entry.fields.description?.current.value??null} onChange={value=>update(e=>{e.fields.description=editRich(e.fields.description,value,form.cv.documentLocale);})}/>
    <fieldset><legend>{t('Enlaces adicionales')}</legend>{entry.fields.links.map((link,index)=><div className="repeat grid" key={link.id}>
      <Field label={t('Etiqueta del enlace {n}',{n:index+1})} path={`${path}.links.${index}.label`} value={link.label??''} issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.label=nullable(v);})}/>
      <Field label={t('Dirección del enlace {n}',{n:index+1})} path={`${path}.links.${index}.url`} value={link.url} required type="url" issues={issues} onChange={v=>update(e=>{e.fields.links[index]!.url=v;})}/>
      <button type="button" onClick={()=>update(e=>{e.fields.links.splice(index,1);})}>{t('Retirar enlace {n}',{n:index+1})}</button>
    </div>)}<button type="button" onClick={()=>update(e=>{e.fields.links.push({id:crypto.randomUUID(),label:null,url:''});})}>{t('Añadir enlace')}</button></fieldset>
  </>;
}
type Language=Extract<CvEntry,{kind:'nativeLanguage'|'foreignLanguage'}>;
const dimensions=[['listening','Comprensión oral / Listening'],['reading','Lectura / Reading'],['spokenInteraction','Interacción oral / Spoken interaction'],['spokenProduction','Expresión oral / Spoken production'],['writing','Escritura / Writing']] as const;
function LanguageFields({entry,path,issues,update}:{entry:Language;path:string;issues:EditorIssue[];update:(fn:(e:Language)=>void)=>void}){
  const {t}=useMessages();return <><p>{t('Indica al menos un código de idioma válido o un nombre. No se inventan niveles.')}</p>
    <Field label={t('Código del idioma')} path={path+'.language.code'} value={entry.fields.language.code??''} issues={issues} hint={t('Por ejemplo: es, en, ro. Puedes dejarlo vacío si indicas el nombre.')} onChange={v=>update(e=>{e.fields.language.code=nullable(v);})}/>
    <Field label={t('Nombre del idioma')} path={path+'.language.name'} value={entry.fields.language.name??''} issues={issues} onChange={v=>update(e=>{e.fields.language.name=nullable(v);})}/>
    {entry.kind==='nativeLanguage'?<p className="hint">{t('Lengua materna: no se asigna C2 ni una escala CEFR.')}</p>:<fieldset><legend>{t('Destrezas CEFR independientes')}</legend><p>{t('Cada dimensión es opcional. Sin evaluar se guarda como null, sin nivel global.')}</p>
      {dimensions.map(([key,label])=><SelectField label={t(label)} key={key} value={entry.fields.proficiency[key]??''} onChange={value=>update(e=>{if(e.kind==='foreignLanguage')e.fields.proficiency[key]=(value||null) as typeof e.fields.proficiency[typeof key];})}><option value="">{t('Sin evaluar')}</option>{['A1','A2','B1','B2','C1','C2'].map(level=><option value={level} key={level}>{level}</option>)}</SelectField>)}
    </fieldset>}
  </>;
}
