import {useState} from 'react';
import type {MasterProfile} from '../domain/index.js';
import {entryIds,plainText} from '../domain/index.js';
import {personalSelectionKeys} from '../application/profile-selection.js';
import type {ProfileSelection} from '../application/profile-selection.js';
import type {EditorDocumentView} from '../application/editor.js';
import {sectionLabel} from '../application/editor-model.js';
import {Modal} from './Modal.js';
import {Check,Field,SelectField} from './fields.js';
import {useMessages} from './i18n.js';
import {operationErrorMessage} from './error-message.js';
const labels={displayName:'Nombre para mostrar',givenName:'Nombre',familyName:'Apellidos',otherNames:'Otros nombres',headline:'Titular profesional',about:'Presentación personal',birthDate:'Fecha de nacimiento',nationalities:'Nacionalidades',gender:'Género',identifiers:'Identificadores'};
export function ProfileSelectionDialog({profile,onCancel,onCreated}:{profile:MasterProfile;onCancel:()=>void;onCreated:(v:EditorDocumentView)=>void}){
  const {t}=useMessages(),[name,setName]=useState(''),[locale,setLocale]=useState<'es'|'en'>('es'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [selection,setSelection]=useState<ProfileSelection>({personalFields:[...personalSelectionKeys],contactIds:profile.personalInformation.contacts.map(c=>c.id),addressIds:profile.personalInformation.addresses.map(a=>a.id),photo:!!profile.personalInformation.photo,sections:profile.sectionOrder.map(id=>({sectionId:id,entryIds:entryIds(profile.sectionsById[id]!)}))});
  const change=(mutate:(s:ProfileSelection)=>void)=>setSelection(old=>{const next=structuredClone(old);mutate(next);return next;});
  const toggle=(ids:string[],id:string,value:boolean)=>value?[...ids,id]:ids.filter(x=>x!==id);
  return <Modal title={t('Crear CV desde perfil')} onCancel={()=>{if(!busy)onCancel();}}><form noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError(t('Escribe un nombre para el CV.'));return;}setBusy(true);setError('');void window.cvforge.profileMaterialize(name,locale,profile.revision,selection).then(r=>{if(!r.ok)throw r.error;onCreated(r.value);}).catch(e=>setError(t(operationErrorMessage(e.code,'No se ha creado el CV. El perfil y los demás documentos se conservan.')))).finally(()=>setBusy(false));}}>
    <p>{t('Elige los datos que se copiarán. El nuevo CV será independiente: los cambios posteriores no se sincronizan.')}</p>
    <fieldset disabled={busy}><div className="grid"><Field label={t('Nombre del CV en la biblioteca')} value={name} required path="profileCvName" onChange={setName}/><SelectField label={t('Idioma del nuevo CV')} value={locale} onChange={v=>setLocale(v as 'es'|'en')}><option value="es">Español</option><option value="en">English</option></SelectField></div>
      <p className="hint">{t('Elegir el idioma no traduce el contenido del perfil.')}</p>
      <fieldset><legend>{t('Datos personales que copiar')}</legend><div className="grid">{personalSelectionKeys.map(key=><div key={key}><Check disabled={key==='displayName'} label={t(labels[key])} checked={selection.personalFields.includes(key)} onChange={value=>{if(key!=='displayName')change(s=>{s.personalFields=toggle(s.personalFields,key,value) as typeof s.personalFields;});}}/>{key==='displayName'&&<small>{t('Obligatorio para crear el CV.')}</small>}</div>)}</div>
        {profile.personalInformation.contacts.map(c=><Check key={c.id} label={t('Copiar contacto: {value}',{value:c.kind==='phone'?c.prefix+' '+c.number:c.value})} checked={selection.contactIds.includes(c.id)} onChange={v=>change(s=>{s.contactIds=toggle(s.contactIds,c.id,v);})}/>)}
        {profile.personalInformation.addresses.map((a,i)=><Check key={a.id} label={t('Copiar dirección {n}',{n:i+1})} checked={selection.addressIds.includes(a.id)} onChange={v=>change(s=>{s.addressIds=toggle(s.addressIds,a.id,v);})}/>)}
        {profile.personalInformation.photo&&<Check label={t('Copiar foto')} checked={selection.photo} onChange={v=>change(s=>{s.photo=v;})}/>} </fieldset>
      {profile.sectionOrder.map(id=>{const section=profile.sectionsById[id]!,selected=selection.sections.find(s=>s.sectionId===id),label=section.title?plainText(section.title):t(sectionLabel(section.kind));return <fieldset key={id}><legend>{label}</legend>
        <Check label={t('Copiar sección {name}',{name:label})} checked={!!selected} onChange={v=>change(s=>{s.sections=v?[...s.sections,{sectionId:id,entryIds:entryIds(section)}]:s.sections.filter(s=>s.sectionId!==id);})}/>
        {selected&&entryIds(section).map(entryId=>{const e=section.entriesById[entryId]!,title='title'in e.fields?plainText(e.fields.title):e.kind==='work'?plainText(e.fields.position):e.kind==='skill'?plainText(e.fields.label):e.fields.language.name??e.fields.language.code??'';return <Check key={entryId} label={t('Copiar entrada: {name}',{name:title})} checked={selected.entryIds.includes(entryId)} onChange={v=>change(s=>{const chosen=s.sections.find(s=>s.sectionId===id)!;chosen.entryIds=toggle(chosen.entryIds,entryId,v);})}/>;})}</fieldset>;})}
    </fieldset>{error&&<p role="alert" className="error-banner">{error}</p>}<footer className="form-actions"><button type="button" disabled={busy} onClick={onCancel}>{t('Cancelar')}</button><button type="submit" disabled={busy} className="primary">{t(busy?'Guardando…':'Crear CV independiente')}</button></footer>
  </form></Modal>;
}
