import { useState } from 'react';
import { protectNarrativeTerms, richText } from '../domain/index.js';
import type { NarrativeField, RichNarrative } from '../domain/index.js';
import { Field } from './fields.js';
import { useMessages } from './i18n.js';
export function ProtectedSpans<T extends NarrativeField|RichNarrative>({field,onChange}:{field:T;onChange:(field:T)=>void}){
  const {t}=useMessages(),[term,setTerm]=useState(''),[error,setError]=useState('');
  const terms=[...new Set(field.protectedSpans.map(s=>s.value))],text=typeof field.current.value==='string'?field.current.value:richText(field.current.value);
  const update=(values:string[])=>{try{onChange(protectNarrativeTerms(field,values,{newId:()=>crypto.randomUUID(),now:()=>new Date().toISOString()}));setError('');return true;}catch{setError('El término debe aparecer literalmente y las protecciones no deben solaparse. Revisa el texto o retira su protección.');return false;}};
  return <details className="protected-editor"><summary>{t('Fragmentos protegidos (B)')}</summary><p className="hint">{t('Protege nombres o términos dentro de esta narrativa. El plan no los enviará al proveedor ni los modificará. Los nombres oficiales ya presentes en otros campos se protegen también.')}</p>
    {terms.map(value=><div className="repeat" key={value}><strong>{value}</strong><button type="button" onClick={()=>update(terms.filter(term=>term!==value))}>{t('Retirar protección de {name}',{name:value})}</button></div>)}
    {field.protectedSpans.some(s=>text.slice(s.start,s.end)!==s.value)&&<p role="status" className="error">{t('El texto cambió: revisa las posiciones de los fragmentos protegidos antes de confirmar.')}</p>}
    <Field label={t('Término que debe conservarse')} path="protectedTerm" value={term} onChange={setTerm}/><div className="actions"><button type="button" onClick={()=>{if(update([...terms,term]))setTerm('');}}>{t('Proteger término')}</button>{!!terms.length&&<button type="button" onClick={()=>update(terms)}>{t('Revisar posiciones protegidas')}</button>}</div>
    {error&&<p role="alert" className="error">{t(error)}</p>}
  </details>;
}
