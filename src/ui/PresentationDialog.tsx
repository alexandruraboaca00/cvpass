import {useState} from 'react';
import type {CvDocument} from '../domain/index.js';
import type {PresentationInput} from '../application/render-contract.js';
import type {EditorDocumentView} from '../application/editor.js';
import {useMessages} from './i18n.js';
import {Modal} from './Modal.js';
import {operationErrorMessage} from './error-message.js';
const api=window.cvforge;
export function PresentationDialog({cv,onSaved,onCancel}:{cv:CvDocument;onSaved:(v:EditorDocumentView)=>void;onCancel:()=>void}){
  const {t}=useMessages(),[input,setInput]=useState<PresentationInput>(()=>{const {density,accentColor,numbering,datePrecision,showCefrGuide,templateRef}=cv.presentation;return {density,accentColor,numbering,datePrecision,showCefrGuide,fontFamily:'Liberation Sans',templateRef:['simple','lateral'].includes(templateRef.id)&&templateRef.version===1?templateRef:{id:'simple',version:1}};}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lateral=input.templateRef?.id==='lateral';
  return <Modal title={t(lateral?'Presentación Lateral':'Presentación Simple')} onCancel={()=>{if(!busy)onCancel();}}><form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void api.presentation(cv.id,cv.revision,input).then(result=>{if(result.ok)onSaved(result.value);else setError(result.error.code);}).finally(()=>setBusy(false));}}>
    <p>{t(lateral?'Lateral v1 · Dos columnas · Liberation Sans local':'Simple v1 · Una columna · Liberation Sans local')}</p><fieldset className="presentation-fields" disabled={busy}><div className="grid">
      <label className="field span-full">{t('Plantilla')}<select aria-label={t('Plantilla')} value={input.templateRef?.id??'simple'} onChange={e=>setInput({...input,templateRef:{id:e.target.value,version:1}})}><option value="simple">Simple</option><option value="lateral">Lateral</option></select></label>
      <label className="field">{t('Densidad')}<select aria-label={t('Densidad')} value={input.density} onChange={e=>setInput({...input,density:e.target.value as PresentationInput['density']})}><option value="compact">{t('Compacta')}</option><option value="normal">{t('Normal')}</option><option value="spacious">{t('Espaciosa')}</option></select></label>
      <label className="field color-field">{t('Color de acento')}<input type="color" value={input.accentColor} onChange={e=>setInput({...input,accentColor:e.target.value})}/></label>
      <label className="field span-full">{t('Precisión máxima de fechas')}<select aria-label={t('Precisión máxima de fechas')} value={input.datePrecision} onChange={e=>setInput({...input,datePrecision:e.target.value as PresentationInput['datePrecision']})}><option value="year">{t('Solo año')}</option><option value="month">{t('Mes y año')}</option><option value="day">{t('Fecha completa si existe')}</option></select></label>
      </div><div className="presentation-toggles"><label className="check"><input type="checkbox" checked={input.numbering} onChange={e=>setInput({...input,numbering:e.target.checked})}/>{t('Numerar páginas')}</label>
      <label className="check"><input type="checkbox" checked={input.showCefrGuide} onChange={e=>setInput({...input,showCefrGuide:e.target.checked})}/>{t('Mostrar guía CEFR')}</label>
    </div></fieldset>{error&&<p role="alert" data-error-code={error}>{t(operationErrorMessage(error,'No se pudo generar o guardar ({code}). El CV confirmado se conserva.'),{code:error})}</p>}
    <footer className="form-actions"><button type="button" disabled={busy} onClick={onCancel}>{t('Cancelar')}</button><button type="submit" disabled={busy}>{t('Confirmar')}</button></footer>
  </form></Modal>;
}
