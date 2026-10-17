import { useId, useState } from 'react';
import type { ComponentProps } from 'react';
import { approveSensitive, approvalMatches, classifyText, keepOriginal, plainText, resolveSensitive, sensitiveReviewState } from '../domain/index.js';
import type { CvDocument, SensitiveField, TextField } from '../domain/index.js';
import { editText } from '../application/editor-model.js';
import type { EditorIssue } from '../application/editor-model.js';
import { Check, Field, SelectField } from './fields.js';
import { Modal } from './Modal.js';
import { useMessages } from './i18n.js';
import { ProtectedSpans } from './ProtectedSpans.js';
const context=()=>({newId:()=>crypto.randomUUID(),now:()=>new Date().toISOString()});
export function OptionalClassifiedField({value,onChange,...props}:Omit<ComponentProps<typeof ClassifiedField>,'value'|'onChange'|'required'>&{value:TextField|null;onChange:(value:TextField|null)=>void}){
  return <ClassifiedField {...props} required={false} value={value??{class:'A',current:{value:'',locale:props.locale},revision:1,protectedSpans:[]}} onChange={next=>onChange(plainText(next)===''?null:next)}/>;
}
export function visibleText(field:TextField,memory:CvDocument['sensitiveTranslationMemory']):string {
  if(field.class!=='C')return plainText(field);
  try{return resolveSensitive(field,memory).map(v=>v.value).join(' — ');}catch{return plainText(field);}
}
function draftReviewState(field:SensitiveField,memory:CvDocument['sensitiveTranslationMemory']):string {
  try{return sensitiveReviewState(field,memory);}catch{return 'pending';}
}
export function ClassifiedField({label,path,value,locale,memory,onChange,onMemory,issues=[],allowed=['A','B','C'],fieldKind,required=true}:{label:string;path:string;value:TextField;locale:string;memory:CvDocument['sensitiveTranslationMemory'];onChange:(value:TextField)=>void;onMemory:(field:SensitiveField,memory:CvDocument['sensitiveTranslationMemory'])=>void;issues?:EditorIssue[];allowed?:('A'|'B'|'C')[];fieldKind:string;required?:boolean}){
  const {t}=useMessages(),[review,setReview]=useState(false),[error,setError]=useState('');
  const locked=value.class==='C'&&!value.original;
  return <div className="classified-field">
    {locked?<p role="note">{t('Original desconocido: se conserva el contenido importado.')}: {plainText(value)}</p>:<Field label={label} path={path} value={plainText(value)} required={required} issues={issues} onChange={v=>onChange(editText(value,v,locale,true)!)}/>}
    {allowed.length>1&&!locked&&<SelectField label={t('Tratamiento lingüístico de {label}',{label})} value={value.class} onChange={classification=>{try{onChange(classifyText(value,classification as 'A'|'B'|'C',locale,context(),fieldKind));setError('');}catch{setError('Conserva la aprobación existente; revisa este campo sensible antes de reclasificarlo.');}}}>
      {allowed.includes('A')&&<option value="A">{t('A — Texto traducible')}</option>}{allowed.includes('B')&&<option value="B">{t('B — Conservar literal')}</option>}{allowed.includes('C')&&<option value="C">{t('C — Traducción sensible')}</option>}
    </SelectField>}
    {value.class==='B'&&<p className="hint">{t('Se conservará literalmente al cambiar el idioma del CV.')}</p>}
    {value.class==='A'&&!!value.current.value.trim()&&<ProtectedSpans field={value} onChange={onChange}/>}
    {value.class==='C'&&<><p className="hint" role="status">{t('Estado sensible')}: {t(reviewLabel(draftReviewState(value,memory)))}</p><p>{t('Mostrar en CV')}: {visibleText(value,memory)}</p>{!locked&&<button type="button" disabled={!value.original?.value.trim()} onClick={()=>setReview(true)}>{t('Revisar traducción sensible de {label}',{label})}</button>}</>}
    {error&&<p role="alert" className="error">{t(error)}</p>}
    {review&&value.class==='C'&&<SensitiveReview field={value} memory={memory} onCancel={()=>setReview(false)} onConfirm={(field,newMemory)=>{onMemory(field,newMemory);setReview(false);}}/>}
  </div>;
}
export function reviewLabel(state:string):string{return ({pending:'Necesita revisión',original:'Original seleccionado',approved:'Traducción aprobada',stale:'Desactualizada: el original o contexto ha cambiado',imported:'Contenido visible importado',missing:'Falta traducción revisada',reused:'Traducción aprobada reutilizada',unknown:'Original desconocido'})[state]??state;}
export function DisplayModes({mode,onChange}:{mode:SensitiveField['displayMode'];onChange:(mode:SensitiveField['displayMode'])=>void}){
  const {t}=useMessages(),name=useId();return <fieldset><legend>{t('Mostrar en CV')}</legend>{(['original','translation','translationAndOriginal'] as const).map(value=><label className="check" key={value}><input type="radio" name={name} value={value} checked={mode===value} onChange={()=>onChange(value)}/>{t({original:'Solo original',translation:'Solo traducción',translationAndOriginal:'Traducción + original'}[value])}</label>)}</fieldset>;
}
function SensitiveReview({field,memory,onCancel,onConfirm}:{field:SensitiveField;memory:CvDocument['sensitiveTranslationMemory'];onCancel:()=>void;onConfirm:(field:SensitiveField,memory:CvDocument['sensitiveTranslationMemory'])=>void}){
  const {t}=useMessages(),[locale,setLocale]=useState<'es'|'en'>(field.outputLocale==='en'?'en':field.original?.locale==='es'?'en':'es');
  const [text,setText]=useState(field.approvalId?memory[field.approvalId]?.value??'':''),[mode,setMode]=useState(field.displayMode),[approved,setApproved]=useState(false),[error,setError]=useState('');
  const confirm=()=>{try{
    let next:SensitiveField={...field,outputLocale:locale},nextMemory=structuredClone(memory);
    const matching=Object.values(memory).find(a=>approvalMatches(next,a)&&a.value===text);
    if(mode==='original'&&!approved&&!matching){next=keepOriginal(next);}
    else {
      if(!text.trim()||(!matching&&!approved)){setError('Revisa y aprueba la traducción antes de utilizarla.');return;}
      if(matching)next={...next,decision:'useApproval',approvalId:matching.id,displayMode:mode};
      else {const result=approveSensitive(next,text,locale,context(),mode==='original'?'translation':mode);next=result.field;nextMemory[result.approval.id]=result.approval;}
      if(mode==='original')next={...next,displayMode:'original'};
    }
    onConfirm(next,nextMemory);
  }catch{setError('No se puede aprobar: revisa el original, el idioma y la traducción.');}};
  return <Modal title={t('Revisión de traducción sensible')} onCancel={onCancel}><form noValidate onSubmit={event=>{event.preventDefault();event.stopPropagation();confirm();}}>
    <p>{t('Original')}: <strong>{field.original?.value}</strong></p><p className="hint">{t('Una traducción revisada no acredita una equivalencia oficial.')}</p>
    <SelectField label={t('Idioma de la traducción')} value={locale} onChange={value=>{const target=value as 'es'|'en';setLocale(target);const found=Object.values(memory).find(a=>approvalMatches({...field,outputLocale:target},a));setText(found?.value??'');setApproved(false);}}><option value="es">Español</option><option value="en">English</option></SelectField>
    <Field label={locale==='en'?'English':'Español'} path="sensitiveTranslation" value={text} onChange={v=>{setText(v);setApproved(false);}}/>
    <Check label={t('He revisado y apruebo esta traducción')} checked={approved} onChange={setApproved}/>
    <DisplayModes mode={mode} onChange={setMode}/><p className="hint">{t('La revisión del hijo solo cambia el borrador del formulario padre. Cancelar el padre descarta todo.')}</p>
    {error&&<p role="alert" className="error">{t(error)}</p>}
    <footer className="form-actions"><button type="button" onClick={onCancel}>{t('Cancelar revisión')}</button><button className="primary" type="submit">{t('Confirmar revisión en borrador')}</button></footer>
  </form></Modal>;
}
