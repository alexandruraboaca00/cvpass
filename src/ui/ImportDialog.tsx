import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { entryIds } from '../domain/index.js';
import type { ImportIssue, SensitiveField } from '../domain/index.js';
import { makeForm, sectionLabel } from '../application/editor-model.js';
import type { EditorForm, EditorIssue, EditorTarget } from '../application/editor-model.js';
import type { EditorFailure, EditorResult } from '../application/editor-contract.js';
import type { ImportView } from '../application/structured-import.js';
import type { PhotoView } from '../application/editor.js';
import { Modal } from './Modal.js';
import { Field, Check, SelectField } from './fields.js';
import type { Change } from './fields.js';
import { PersonalForm } from './PersonalForm.js';
import { EntryForm } from './EntryForm.js';
import { MvpEntryForm } from './MvpEntryForm.js';
import { SkillsForm } from './SkillsForm.js';
import { ClassifiedField, visibleText } from './ClassifiedField.js';
import { useMessages } from './i18n.js';

const api=window.cvforge;
const unwrap=<T,>(result:EditorResult<T>):T=>{if(!result.ok)throw result.error;return result.value;};
const issueLabels:Record<ImportIssue['kind'],string>={review:'Requiere revisión',unsupported:'No soportado',invalid:'Inválido',ignored:'Metadatos conservados'};
const codeMessages:Record<string,string>={
  LINK_INVALID:'El enlace original necesita un protocolo HTTP o HTTPS. Revísalo y corrígelo antes de confirmar.',
  CONTACT_URL_REQUIRES_CORRECTION:'El enlace original necesita un protocolo HTTP o HTTPS. Revísalo y corrígelo antes de confirmar.',
  PDF_NO_COMPATIBLE_STRUCTURE:'Este PDF no contiene datos estructurados compatibles. La reconstrucción por texto y el OCR todavía no están disponibles.',NO_COMPATIBLE_CANDIDATE:'No se encontró un candidato compatible. Revisa el resultado de los adjuntos.',FILE_UNSUPPORTED:'Este archivo no tiene un formato compatible.',
  PDF_INVALID:'El PDF está dañado o no se puede leer.',PDF_PASSWORD_UNSUPPORTED:'Los PDF protegidos con contraseña no están admitidos.',CVPROJ_INVALID:'El proyecto está dañado o no supera sus comprobaciones de integridad.',CVPROJ_VERSION_UNSUPPORTED:'Esta versión de proyecto todavía no está admitida.',
  XML_INVALID:'El XML está dañado, truncado o no está bien formado.',XML_DTD_FORBIDDEN:'El XML contiene una declaración DTD o de entidades no admitida.',XML_ENCODING_INVALID:'La codificación del XML no es válida.',XML_ENCODING_MISMATCH:'La declaración XML no corresponde a su codificación.',EUROPASS_STRUCTURE_UNSUPPORTED:'La estructura o el namespace no corresponde al Europass admitido.',EUROPASS_VERSION_UNSUPPORTED:'Esta versión Europass todavía no está admitida.',EUROPASS_PROFILE_MISSING:'Falta el bloque de perfil Europass.',
  IMPORT_ISSUES_REQUIRE_REVIEW:'Revisa y acepta expresamente el informe antes de confirmar.',WORKSPACE_NOT_EMPTY:'La biblioteca actual no está vacía. Elige una sustitución explícita con copia de seguridad.',REPLACE_CONFIRMATION_REQUIRED:'La sustitución de biblioteca requiere confirmación explícita.',
  IMPORT_ANALYSIS_TIMEOUT:'El análisis superó el tiempo permitido.',IMPORT_ANALYSIS_FAILED:'No se pudo analizar el archivo. La biblioteca no ha cambiado.',IMPORT_SIZE_LIMIT:'El archivo supera el límite permitido.',PDF_ATTACHMENT_SIZE_LIMIT:'Los adjuntos superan el límite permitido.',CVFORGE_PAYLOAD_INTEGRITY:'Los datos del PDF no superan la comprobación de integridad.',CVFORGE_PAYLOAD_VERSION_UNSUPPORTED:'La versión de datos del PDF no es compatible.',CVFORGE_CONTAINER_VERSION_UNSUPPORTED:'La versión del contenedor PDF no es compatible.',CVFORGE_TECHNICAL_PROBE_UNSUPPORTED:'Este PDF es una prueba técnica, sin el contrato de datos de producto compatible.',CVFORGE_PAYLOAD_INVALID:'El payload del PDF es inválido.',ATTACHMENT_NOT_STRUCTURED_CV:'Este adjunto no contiene datos estructurados de CV compatibles.',
  DATE_INVALID:'La fecha original es inválida: corrígela o retírala expresamente.',ORIGINAL_LAYOUT_NOT_REPRODUCED:'Se recuperan los datos; el diseño Europass no se reproduce.',FIELD_UNMAPPED:'Este dato no tiene una correspondencia editable y se conserva en el origen privado.',ATTRIBUTE_UNMAPPED:'Este atributo se conserva en el origen privado.',PHOTO_INVALID:'La foto no es válida o no usa un formato admitido. Se conserva en el origen privado.',DISPLAY_NAME_REQUIRED:'Falta el nombre para mostrar. Debes completarlo antes de confirmar.',TITLE_REQUIRED:'Falta un título obligatorio. Corrige la entrada o elimínala de la propuesta.',DOCUMENT_LOCALE_REQUIRED:'Selecciona el idioma del documento; no se ha inferido una traducción.',
  PAYLOAD_WITHOUT_TRANSPORT_DIGEST:'Este payload permite comprobar estructura e imágenes, pero no incluye un digest del transporte completo.',PDF_TEMPLATE_NOT_AVAILABLE:'La plantilla del PDF no está disponible. Se usará la referencia de editor propia.',CONTACT_KIND_REQUIRES_REVIEW:'El tipo de contacto no se pudo recuperar con certeza.',IDENTIFIER_PARTS_REQUIRE_REVIEW:'Se recuperó el identificador visible: revisa su etiqueta y valor.',CEFR_VALUE_INVALID:'El nivel CEFR no es válido. Corrígelo o acepta su exclusión.',CEFR_DIMENSION_DUPLICATE:'Hay una dimensión CEFR duplicada que requiere revisión.',HTML_FORMAT_REDUCED:'Parte del formato no está admitida; se conserva el origen y el contenido soportado.',
};
export function ImportDialog({onClose,onImported}:{onClose:()=>void;onImported:(cvId?:string,backupName?:string)=>void}){
  const {t}=useMessages(),formId=useId(),request=useRef<string|null>(null),formRef=useRef<EditorForm|null>(null),heading=useRef<HTMLHeadingElement>(null);
  const [view,setView]=useState<ImportView|null>(null),[form,setForm]=useState<EditorForm|null>(null),[photo,setPhoto]=useState<PhotoView|null>(null),[phase,setPhase]=useState<'pick'|'analyzing'|'review'|'confirming'>('pick');
  const [error,setError]=useState<EditorFailure|null>(null),[issues,setIssues]=useState<EditorIssue[]>([]),[ack,setAck]=useState(false),[documentLocale,setDocumentLocale]=useState<'es'|'en'|null>(null),[photoBusy,setPhotoBusy]=useState(false);
  const [restoreMode,setRestoreMode]=useState<'emptyWorkspace'|'replaceWorkspace'>('emptyWorkspace'),[restoreConfirm,setRestoreConfirm]=useState(false),[deleting,setDeleting]=useState(false),[candidateChange,setCandidateChange]=useState<string|null>(null);
  const report=(error:unknown)=>{const failure=error&&typeof error==='object'&&'code' in error?error as EditorFailure:{code:'IMPORT_ANALYSIS_FAILED',issues:[]};setError(failure);setIssues(failure.issues);};
  useEffect(()=>()=>{const id=request.current;if(id)void api.importCancel(id).catch(()=>undefined);},[]);
  const cancel=()=>{if(phase==='confirming')return;const id=request.current;request.current=null;if(id)void api.importCancel(id).catch(()=>undefined);onClose();};
  const adopt=(next:ImportView)=>{
    setView(next);setPhoto(next.photo);setAck(false);setIssues([]);setError(null);setDocumentLocale(next.draft?.documentLocale??null);
    if(!next.draft){formRef.current=null;setForm(null);return;}
    const cv=structuredClone(next.draft.cv),base=makeForm(next.id,{kind:'personal'},cv),dates={...base.rawDates},numbers={...base.rawNumbers};
    for(const s of Object.values(cv.sectionsById))if(s.kind!=='skills')for(const e of Object.values(s.entriesById)){const entry=makeForm(next.id,{kind:'entry',sectionId:s.id,entryId:e.id},cv);Object.assign(dates,entry.rawDates);Object.assign(numbers,entry.rawNumbers);}
    const prepared={...base,rawDates:{...dates,...next.draft.rawDates},rawNumbers:{...numbers,...next.draft.rawNumbers}};formRef.current=prepared;setForm(prepared);
  };
  const change:Change=mutate=>{const next=structuredClone(formRef.current!);mutate(next);formRef.current=next;setForm(next);setIssues([]);setError(null);};
  const begin=async(file:File)=>{
    if(phase!=='pick')return;const id=crypto.randomUUID();request.current=id;setPhase('analyzing');setError(null);
    try{if(file.size>200*1024*1024)throw {code:'IMPORT_SIZE_LIMIT',issues:[]};const bytes=new Uint8Array(await file.arrayBuffer());if(request.current!==id)return;const next=unwrap(await api.importFile(id,bytes,file.name));if(request.current!==id)return;adopt(next);setPhase('review');}
    catch(error){if(request.current!==id)return;report(error);setPhase('review');}
  };
  const select=async(key:string)=>{setCandidateChange(null);try{adopt(unwrap(await api.importChoose(view!.id,key)));}catch(error){report(error);}};
  const reset=async()=>{const id=request.current;request.current=null;if(id)await api.importCancel(id);setView(null);formRef.current=null;setForm(null);setError(null);setIssues([]);setPhase('pick');};
  const choose=(target:EditorTarget)=>{change(f=>{f.target=target;});requestAnimationFrame(()=>heading.current?.focus());};
  const selectPhoto=async(file:File)=>{
    const id=request.current!;setPhotoBusy(true);
    try{if(file.size>10*1024*1024||!['image/png','image/jpeg'].includes(file.type))throw {code:'PHOTO_SIZE_OR_TYPE',issues:[]};const selected=unwrap(await api.importPhoto(id,new Uint8Array(await file.arrayBuffer()),file.type as 'image/png'|'image/jpeg'));if(request.current!==id)return;change(f=>{f.cv.personalInformation.photo={assetId:selected.assetId,crop:selected.photo.crop,visible:true};});setPhoto(selected.photo);}
    catch(error){if(request.current===id)report(error);}finally{setPhotoBusy(false);}
  };
  const confirm=async(event:FormEvent)=>{
    event.preventDefault();if(!view||!formRef.current||photoBusy)return;setPhase('confirming');setError(null);
    try{const current=formRef.current,result=unwrap(await api.importConfirm(view.id,{cv:current.cv,rawDates:current.rawDates,rawNumbers:current.rawNumbers,documentLocale,acknowledgeIssues:ack}));request.current=null;onImported(result.cvId);}
    catch(error){report(error);setPhase('review');requestAnimationFrame(()=>heading.current?.focus());}
  };
  const restore=async()=>{setPhase('confirming');setError(null);try{const result=unwrap(await api.importRestore(view!.id,restoreMode,restoreMode==='replaceWorkspace'));request.current=null;onImported(undefined,result.backup?.name);}catch(error){report(error);setRestoreConfirm(false);setPhase('review');}};
  const cv=form?.cv,target=form?.target,selected=view?.candidates.find(c=>c.key===view.selectedKey);
  const title=target?.kind==='personal'?t('Datos personales'):target?.kind==='skills'?t('Habilidades'):target?.kind==='section'?t('Nombre de sección personalizada'):t('Revisar entrada importada');
  const summary=(entry:NonNullable<typeof cv>['sectionsById'][string]['entriesById'][string])=>'title' in entry.fields?visibleText(entry.fields.title,cv!.sensitiveTranslationMemory):entry.kind==='work'?visibleText(entry.fields.position,cv!.sensitiveTranslationMemory):entry.kind==='skill'?visibleText(entry.fields.label,cv!.sensitiveTranslationMemory):entry.fields.language.name??entry.fields.language.code??t('Sin nombre');
  const key=target?.kind==='entry'?target.entryId:target&&'sectionId' in target?target.sectionId:target?.kind;
  const removeEntry=()=>{if(target?.kind!=='entry')return;const {sectionId,entryId}=target;change(f=>{const s=f.cv.sectionsById[sectionId]!;delete s.entriesById[entryId];s.entryOrder=s.entryOrder!.filter(id=>id!==entryId);const prefix=`sectionsById.${sectionId}.entriesById.${entryId}.`;f.rawDates=Object.fromEntries(Object.entries(f.rawDates).filter(([path])=>!path.startsWith(prefix)));f.rawNumbers=Object.fromEntries(Object.entries(f.rawNumbers).filter(([path])=>!path.startsWith(prefix)));f.target={kind:'personal'};});setDeleting(false);};
  return <Modal title={t('Importar archivo')} onCancel={cancel}>
    <p>{t('La biblioteca no cambia hasta Confirmar. Cancelar descarta toda esta propuesta.')}</p>
    {phase==='pick'&&<label className="field">{t('Seleccionar archivo para importar')}<input type="file" onChange={event=>{const file=event.target.files?.[0];if(file)void begin(file);}}/></label>}
    {phase==='analyzing'&&<p role="status">{t('Analizando archivo local…')}</p>}
    {error&&<div role="alert" className="error-banner"><p>{t(codeMessages[error.code]??'No se pudo completar la importación ({code}). La biblioteca confirmada se conserva.',{code:error.code})}</p>{issues.length>0&&<ul>{issues.map((i,index)=><li key={index}><code>{i.path}</code>: {t(i.message)}</li>)}</ul>}</div>}
    {view&&<><p><strong>{view.source.fileName}</strong></p>{view.code&&<p role="status">{t(codeMessages[view.code]??'No se pudo completar la importación ({code}). La biblioteca confirmada se conserva.',{code:view.code})}</p>}
      {view.candidates.length>1&&<section aria-label={t('Candidatos de importación')}><h3>{t('Elige los datos que quieres recuperar')}</h3><p>{t('Los candidatos distintos no se combinan automáticamente.')}</p>{view.candidates.map(c=><article key={c.key} className="repeat"><strong>{c.attachmentName??c.format}</strong><p>{c.summary?.displayName} · {c.summary?.documentLocale??t('Idioma no determinado')} · {t('{n} entradas',{n:c.summary?.entries??0})}</p><small>{c.sha256.slice(0,16)}</small>{c.code&&<p>{t(codeMessages[c.code]??'Dato pendiente ({code})',{code:c.code})}</p>}<button type="button" disabled={c.status==='invalid'||c.status==='incompatible'||phase==='confirming'} onClick={()=>form?setCandidateChange(c.key):void select(c.key)}>{t('Revisar candidato {name}',{name:c.attachmentName??c.key})}</button></article>)}</section>}
      {view.candidates.length===1&&view.candidates[0]?.code&&<p>{t(codeMessages[view.candidates[0].code!]??'Dato pendiente ({code})',{code:view.candidates[0].code!})}</p>}
      {view.selectionReason&&<p className="hint">{t({directFile:'Formato estructurado reconocido en el archivo.',soleCompatible:'Se seleccionó el único candidato compatible.',identicalCandidates:'Los candidatos compatibles contienen exactamente los mismos datos.',explicit:'Candidato elegido expresamente.'}[view.selectionReason])}</p>}
    </>}
    {view?.workspace&&<section aria-label={t('Restauración de biblioteca')}><h3>{t('Este proyecto contiene una biblioteca completa')}</h3><p>{t('Perfil')}: {view.workspace.profileName??t('Sin perfil')}</p><ul>{view.workspace.cvs.map((cv,index)=><li key={index}>{cv.name} · {cv.documentLocale}</li>)}</ul>
      <SelectField label={t('Modo de restauración')} value={restoreMode} onChange={value=>setRestoreMode(value as typeof restoreMode)}><option value="emptyWorkspace">{t('Restaurar solo si la biblioteca está vacía')}</option><option value="replaceWorkspace">{t('Sustituir biblioteca con copia de seguridad')}</option></SelectField>
      <p>{t('La sustitución afecta al perfil y a todos los CV actuales. Se crea antes una copia recuperable.')}</p><button type="button" disabled={phase==='confirming'} onClick={()=>restoreMode==='replaceWorkspace'?setRestoreConfirm(true):void restore()}>{t('Confirmar restauración')}</button>
    </section>}
    {form&&view?.draft&&<form id={formId} noValidate onSubmit={event=>void confirm(event)}><fieldset disabled={phase==='confirming'||photoBusy}>
      <Field label={t('Nombre del nuevo CV')} path="name" required value={form.cv.name} issues={issues} onChange={value=>change(f=>{f.cv.name=value;})}/>
      <SelectField label={t('Idioma del documento importado')} value={documentLocale??''} onChange={value=>setDocumentLocale(value as 'es'|'en')}><option value="">{t('Selecciona un idioma')}</option><option value="es">Español</option><option value="en">English</option></SelectField>
      <p>{t('Elegir el idioma no traduce ni modifica el texto importado.')}</p>
      <details open><summary>{t('Informe de importación ({n})',{n:view.draft.issues.length})}</summary>{view.draft.issues.length===0?<p>{t('Datos compatibles recuperados sin incidencias de mapeo.')}</p>:Object.entries(issueLabels).map(([kind,label])=><section key={kind}><h4>{t(label)}</h4><ul>{view.draft!.issues.filter(i=>i.kind===kind).map((i,index)=><li key={index}><span>{t(codeMessages[i.code]??'Dato pendiente ({code})',{code:i.code})}</span>{i.valuePreview&&<pre className="import-value">{i.valuePreview}</pre>}<details><summary>{t('Procedencia técnica')}</summary><code>{i.sourcePath}</code></details></li>)}</ul></section>)}</details>
      <div className="import-layout"><nav aria-label={t('Datos recuperados')}><button type="button" onClick={()=>choose({kind:'personal'})}>{t('Revisar datos personales')}</button>{cv!.sectionOrder.map(id=>{const s=cv!.sectionsById[id]!,section=s.title?visibleText(s.title,cv!.sensitiveTranslationMemory):t(sectionLabel(s.kind));return <div key={id}><strong>{section}</strong>{s.kind==='custom'&&<button type="button" onClick={()=>choose({kind:'section',sectionId:id})}>{t('Revisar nombre de {name}',{name:section})}</button>}{s.kind==='skills'?<button type="button" onClick={()=>choose({kind:'skills',sectionId:id})}>{t('Revisar habilidades y grupos')}</button>:entryIds(s).map(entryId=><button type="button" key={entryId} onClick={()=>choose({kind:'entry',sectionId:id,entryId})}>{t('Revisar {section}: {title}',{section,title:summary(s.entriesById[entryId]!)||t('Sin título')})}</button>)}</div>;})}</nav>
        <div key={key} className="import-fields"><h3 ref={heading} tabIndex={-1}>{title}</h3>
          {target?.kind==='personal'&&<PersonalForm form={form} change={change} issues={issues} photo={form.cv.personalInformation.photo?photo:null} selectPhoto={file=>void selectPhoto(file)}/>}
          {target?.kind==='entry'&&(cv!.sectionsById[target.sectionId]!.kind==='education'||cv!.sectionsById[target.sectionId]!.kind==='work'?<EntryForm form={form} change={change} issues={issues}/>:<MvpEntryForm form={form} change={change} issues={issues}/>)}
          {target?.kind==='skills'&&<SkillsForm form={form} change={change}/>}
          {target?.kind==='section'&&<ClassifiedField label={t('Nombre de sección')} path={`sectionsById.${target.sectionId}.title`} value={cv!.sectionsById[target.sectionId]!.title!} locale={cv!.documentLocale} memory={cv!.sensitiveTranslationMemory} fieldKind="sectionTitle" issues={issues} onChange={value=>change(f=>{if(f.target.kind==='section')f.cv.sectionsById[f.target.sectionId]!.title=value;})} onMemory={(value,memory)=>change(f=>{if(f.target.kind==='section')f.cv.sectionsById[f.target.sectionId]!.title=value;f.cv.sensitiveTranslationMemory=memory;})}/>}
          <VisibleImportedFields form={form} change={change}/>
          {target?.kind==='entry'&&<><Check label={t('Incluir entrada importada en el CV')} checked={cv!.sectionsById[target.sectionId]!.entriesById[target.entryId]!.included} onChange={value=>change(f=>{if(f.target.kind==='entry')f.cv.sectionsById[f.target.sectionId]!.entriesById[f.target.entryId]!.included=value;})}/><button className="danger-outline" type="button" onClick={()=>setDeleting(true)}>{t('Eliminar entrada de esta propuesta')}</button></>}
        </div>
      </div>
      <Check label={t('He revisado la propuesta y acepto conservar los datos no mapeados solo en el proyecto privado, excluidos del CV visible.')} checked={ack} onChange={setAck}/>
      <p className="hint">{t('Confirmar crea un CV nuevo. El perfil, otros CV y el archivo original permanecen independientes.')}</p>
    </fieldset></form>}
    <footer className="form-actions">{phase==='review'&&<button type="button" onClick={()=>void reset()}>{t('Elegir otro archivo y descartar la propuesta')}</button>}<button type="button" disabled={phase==='confirming'} onClick={cancel}>{t('Cancelar importación')}</button>{form&&view?.draft&&<button form={formId} type="submit" className="primary" disabled={phase==='confirming'||photoBusy}>{t('Confirmar importación')}</button>}</footer>
    {restoreConfirm&&<Modal title={t('Reemplazar biblioteca local')} destructive onCancel={()=>{if(phase!=='confirming')setRestoreConfirm(false);}}><p>{t('Se sustituirán el perfil y todos los CV actuales. La copia de seguridad debe completarse antes de escribir.')}</p><button type="button" disabled={phase==='confirming'} onClick={()=>void restore()}>{t('Reemplazar con copia de seguridad')}</button><button type="button" disabled={phase==='confirming'} onClick={()=>setRestoreConfirm(false)}>{t('Cancelar')}</button></Modal>}
    {candidateChange&&<Modal title={t('Cambiar candidato')} destructive onCancel={()=>setCandidateChange(null)}><p>{t('Se descartarán las correcciones de esta propuesta. La biblioteca no cambia.')}</p><button type="button" onClick={()=>void select(candidateChange)}>{t('Descartar correcciones y cambiar')}</button><button type="button" onClick={()=>setCandidateChange(null)}>{t('Cancelar')}</button></Modal>}
    {deleting&&<Modal title={t('Eliminar entrada de la propuesta')} destructive onCancel={()=>setDeleting(false)}><p>{t('Solo se retira de esta propuesta; el archivo original se conserva.')}</p><button type="button" onClick={removeEntry}>{t('Eliminar entrada de la propuesta')}</button><button type="button" onClick={()=>setDeleting(false)}>{t('Cancelar')}</button></Modal>}
  </Modal>;
}
function VisibleImportedFields({form,change}:{form:EditorForm;change:Change}){
  const {t}=useMessages(),root=form.target.kind==='personal'?form.cv.personalInformation:form.target.kind==='entry'?form.cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!.fields:form.target.kind==='section'?form.cv.sectionsById[form.target.sectionId]!.title:null;
  const fields:{field:SensitiveField;path:(string|number)[]}[]=[];
  const visit=(value:unknown,path:(string|number)[])=>{if(!value||typeof value!=='object')return;const object=value as Record<string,unknown>;if(object.class==='C'){const field=object as unknown as SensitiveField;if(field.decision==='importedVisible')fields.push({field,path});return;}Object.entries(object).forEach(([key,next])=>visit(next,[...path,key]));};visit(root,[]);
  if(!fields.length)return null;
  return <fieldset><legend>{t('Revisar textos sensibles visibles importados')}</legend><p>{t('Puedes corregir lo mostrado sin inventar un original desconocido ni aprobar una traducción automáticamente.')}</p>{fields.flatMap(({field,path},index)=>field.importedVisibleVariants.map((variant,i)=><Field key={field.id+':'+i} label={t('Texto visible {n} ({role})',{n:index+1,role:t(variant.role==='original'?'Original':'Traducción')})} path={field.id} required value={variant.value} onChange={value=>change(f=>{
    let current=f.target.kind==='personal'?f.cv.personalInformation:f.target.kind==='entry'?f.cv.sectionsById[f.target.sectionId]!.entriesById[f.target.entryId]!.fields:f.target.kind==='section'?f.cv.sectionsById[f.target.sectionId]!.title:null;
    for(const key of path)current=(current as unknown as Record<string,unknown>)[key] as typeof current;
    (current as unknown as SensitiveField).importedVisibleVariants[i]!.value=value;
  })}/>))}</fieldset>;
}
