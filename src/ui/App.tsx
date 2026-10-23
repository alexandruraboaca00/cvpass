import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CvDocument, CvEntry, CvSection } from '../domain/index.js';
import { entryIds, plainText } from '../domain/index.js';
import { dateInput, periodLabel, sectionLabel } from '../application/editor-model.js';
import type { EditorForm, EditorIssue } from '../application/editor-model.js';
import type { EditorDocumentView, EditorLibraryView, PhotoView } from '../application/editor.js';
import type { BeginEditorTarget, EditorFailure, EditorResult } from '../application/editor-contract.js';
import { EntryForm } from './EntryForm.js';
import { PersonalForm } from './PersonalForm.js';
import { Photo } from './Photo.js';
import { Field } from './fields.js';
import type { Change } from './fields.js';
import { Modal } from './Modal.js';
import { ClassifiedField, visibleText } from './ClassifiedField.js';
import { MvpEntryForm } from './MvpEntryForm.js';
import { SkillsForm } from './SkillsForm.js';
import { ImportDialog } from './ImportDialog.js';
import { LanguagePlanForm } from './LanguagePlanForm.js';
import { useMessages } from './i18n.js';
import type { Translate } from './i18n.js';
import { PdfPreview, PresentationDialog } from './PdfPreview.js';
import { operationErrorMessage } from './error-message.js';

const api=window.cvforge;
function unwrap<T>(result:EditorResult<T>):T {if(!result.ok)throw result.error;return result.value;}
export function entryTitle(entry:CvEntry,cv?:CvDocument):string {
  if('title' in entry.fields)return cv?visibleText(entry.fields.title,cv.sensitiveTranslationMemory):plainText(entry.fields.title);
  if(entry.kind==='work')return cv?visibleText(entry.fields.position,cv.sensitiveTranslationMemory):plainText(entry.fields.position);
  if(entry.kind==='skill')return cv?visibleText(entry.fields.label,cv.sensitiveTranslationMemory):plainText(entry.fields.label);
  return entry.fields.language.name??entry.fields.language.code??'';
}
function failure(error:unknown):EditorFailure {return error&&typeof error==='object'&&'code' in error?error as EditorFailure:{code:'LOCAL_OPERATION_FAILED',issues:[]};}
const errors:Record<string,string>={EDITOR_VALIDATION:'No se puede confirmar. Revisa los campos indicados.',EDITOR_FORM_OPEN:'Confirma o cancela el formulario abierto.',DRAFTS_PENDING:'Recupera o descarta primero el borrador pendiente.',REVISION_CONFLICT:'La revisión ha cambiado. Cancela y vuelve a abrir el documento.',DRAFT_BASE_CONFLICT:'La base del borrador ha cambiado; no se puede aplicar automáticamente.',IPC_INPUT_INVALID:'Los datos enviados no son válidos.',PHOTO_DECODE_FAILED:'No se ha podido leer la imagen.',PHOTO_SIZE_OR_TYPE:'Selecciona una imagen PNG o JPEG de hasta 10 MiB.',PHOTO_FORMAT_UNSUPPORTED:'Esta imagen no es compatible o está dañada. Prueba a guardarla como PNG RGB de 8 bits sin entrelazado, o JPEG.',ASSET_NOT_FOUND:'La imagen no está disponible.'};
function errorText(error:EditorFailure,t:Translate):string{return errors[error.code]?t(errors[error.code]!):t(operationErrorMessage(error.code,'No se ha completado la operación ({code}). Los cambios confirmados se conservan.'),{code:error.code});}
function sectionName(section:CvSection,t:Translate,memory:CvDocument['sensitiveTranslationMemory']):string{return section.title?visibleText(section.title,memory):t(sectionLabel(section.kind));}
function entryAddLabel(kind:string):string{return ({education:'Añadir educación',work:'Añadir experiencia',certifications:'Añadir certificación',projects:'Añadir proyecto',custom:'Añadir entrada personalizada'})[kind]??'Añadir entrada';}
function formTitle(form:EditorForm,t:Translate):string {
  switch(form.target.kind){case 'personal':return t('Editar datos personales');case 'skills':return t('Editar habilidades y grupos');case 'section':return t('Nombre de sección personalizada');case 'language':return t('Plan de cambio de idioma');case 'order':return t(form.target.sectionId?'Orden de entradas':'Orden de secciones');case 'entry':{
    const e=form.cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;return t(({education:'Editar educación',work:'Editar experiencia',skill:'Editar habilidad',nativeLanguage:'Editar lengua materna',foreignLanguage:'Editar lengua extranjera',certification:'Editar certificación',project:'Editar proyecto',custom:'Editar entrada personalizada'})[e.kind]);
  }}
}
export function App(){
  const {t,locale,setLocale}=useMessages();
  const [library,setLibrary]=useState<EditorLibraryView|null>(null),[document,setDocument]=useState<EditorDocumentView|null>(null),[form,setForm]=useState<EditorForm|null>(null);
  const [photo,setPhoto]=useState<PhotoView|null>(null),[issues,setIssues]=useState<EditorIssue[]>([]),[error,setError]=useState<EditorFailure|null>(null),[notice,setNotice]=useState('');
  const [importing,setImporting]=useState(false);
  const [previewOpen,setPreviewOpen]=useState(false),[presentationOpen,setPresentationOpen]=useState(false);
  const [busy,setBusy]=useState(false),[collapsed,setCollapsed]=useState<Set<string>>(new Set()),[creating,setCreating]=useState(false),[cvName,setCvName]=useState(''),[personName,setPersonName]=useState('');
  const [duplicating,setDuplicating]=useState(false),[duplicateName,setDuplicateName]=useState(''),[history,setHistory]=useState<{id:string;number:number;cause:string;pinned:boolean}[]|null>(null),[restoring,setRestoring]=useState<{id:string;number:number}|null>(null);
  const [deleting,setDeleting]=useState<{sectionId:string;entryId:string|null;label:string}|null>(null),[saveStatus,setSaveStatus]=useState('');
  const currentForm=useRef<EditorForm|null>(null),pending=useRef<Promise<void>>(Promise.resolve()),activeAction=useRef<Promise<unknown>>(Promise.resolve()),closeRequested=useRef<()=>void>(()=>{}),returnFocus=useRef<HTMLElement|null>(null),restoreFormFocus=useRef(false),titleRef=useRef<HTMLHeadingElement>(null);
  useLayoutEffect(()=>{if(!form&&!busy&&restoreFormFocus.current){restoreFormFocus.current=false;const target=returnFocus.current;if(target?.isConnected)target.focus();else titleRef.current?.focus();}},[form,busy]);
  const refresh=async()=>{const value=unwrap(await api.list());setLibrary(value);setLocale(value.uiLocale);};
  const report=(error:unknown)=>{const e=failure(error);setError(e);setIssues(e.issues);if(e.issues.length)setTimeout(()=>window.document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),0);};
  const perform=async<T,>(operation:()=>Promise<T>):Promise<T|undefined>=>{setBusy(true);setError(null);setIssues([]);const task=Promise.resolve().then(operation);activeAction.current=task.then(()=>undefined,()=>undefined);try{return await task;}catch(error){report(error);return undefined;}finally{setBusy(false);}};
  useEffect(()=>{void refresh().catch(report);const timer=setInterval(()=>{if(currentForm.current)void api.status().then(result=>{if(result.ok)setSaveStatus(result.value.error?'Error al guardar el borrador. Puedes volver a intentar Confirmar o Cancelar.':result.value.status==='saved'?'Borrador guardado localmente. Aún no confirmado.':'Guardando borrador…');});},1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    let requested=false;
    const requestClose=()=>{if(requested)return;requested=true;const previousAction=activeAction.current;void perform(async()=>{try{await previousAction;await pending.current;if(currentForm.current)unwrap(await api.stage(currentForm.current));unwrap(await api.flush());unwrap(await api.close());}catch(error){requested=false;throw error;}});};
    closeRequested.current=requestClose;const unsubscribe=api.onCloseRequested(requestClose);
    const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=false;requestClose();};window.addEventListener('beforeunload',beforeUnload);
    return()=>{unsubscribe();window.removeEventListener('beforeunload',beforeUnload);};
  },[]);
  const change:Change=mutate=>{const next=structuredClone(currentForm.current!);mutate(next);currentForm.current=next;setForm(next);setNotice('');setSaveStatus('Cambios en borrador…');pending.current=pending.current.then(async()=>{unwrap(await api.stage(next));}).catch(report);};
  const opened=(value:EditorDocumentView)=>{
    setDocument(value);setPhoto(value.photo);setIssues([]);
    setLibrary(previous=>previous?{...previous,cvs:previous.cvs.map(item=>item.id===value.cv.id?{...item,name:value.cv.name,revision:value.cv.revision,documentLocale:value.cv.documentLocale}:item)}:previous);
  };
  const closeForm=(value:EditorDocumentView,confirmed:boolean)=>{restoreFormFocus.current=true;opened(value);currentForm.current=null;setForm(null);setSaveStatus('');setNotice(confirmed?'Guardado localmente.':'Cambios cancelados.');void refresh();};
  const begin=(target:BeginEditorTarget)=>{returnFocus.current=window.document.activeElement as HTMLElement;void perform(async()=>{const value=unwrap(await api.begin(document!.cv.id,document!.cv.revision,target));currentForm.current=value;setForm(value);setPhoto(document!.photo);setSaveStatus('Borrador abierto.');});};
  const confirm=(event:FormEvent)=>{event.preventDefault();void perform(async()=>{await pending.current;const result=await api.confirm(currentForm.current!);if(!result.ok){setTimeout(()=>window.document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),0);throw result.error;}closeForm(result.value,true);});};
  const cancel=()=>{if(busy)return;void perform(async()=>{await pending.current;closeForm(unwrap(await api.cancel()),false);});};
  const selectPhoto=(file:File)=>{void perform(async()=>{if(file.size>10*1024*1024||!['image/png','image/jpeg'].includes(file.type))throw {code:'PHOTO_SIZE_OR_TYPE',issues:[]};await pending.current;const value=unwrap(await api.photo(new Uint8Array(await file.arrayBuffer()),file.type as 'image/png'|'image/jpeg'));currentForm.current=value.form;setForm(value.form);setPhoto(value.photo);});};
  const cv=document?.cv,blocked=!!cv&&!!library?.recovery.some(d=>d.cvId===cv.id);
  const toggleCollapse=(id:string)=>setCollapsed(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const showError=()=>error&&<div role="alert" className="error-banner"><p>{errorText(error,t)}</p>{issues.length>0&&<ul>{[...new Set(issues.map(i=>i.message))].map(key=><li key={key}>{t(key)}</li>)}</ul>}</div>;
  return <div className="app-shell"><header className="app-header"><div className="brand">CVForge</div><span>{t('Biblioteca local · Editor')}</span>
    <label className="ui-language">{t('Idioma de interfaz')}<select aria-label={t('Idioma de interfaz')} value={locale} disabled={busy||!library} onChange={event=>{const next=event.target.value as 'es'|'en';void perform(async()=>{await pending.current;const value=unwrap(await api.setUiLocale(next));setLibrary(value);setLocale(value.uiLocale);});}}><option value="es">Español</option><option value="en">English</option></select></label>
    <button onClick={()=>closeRequested.current()}>{t('Guardar borrador y salir')}</button></header>
    <div className="app-layout"><aside className="library" aria-label={t('Biblioteca de CV')}><h1>{t('Tu biblioteca')}</h1><p className="hint">{t('CV independientes, guardados en este equipo.')}</p>
      <button className="primary" disabled={busy||!!form} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setCreating(true);setCvName('');setPersonName('');setError(null);setIssues([]);}}>{t('Crear CV')}</button>
      <button disabled={busy||!!form||!library||!!library.recovery.length} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setImporting(true);setError(null);}}>{t('Importar archivo')}</button>
      {!library?<p>{t('Cargando biblioteca…')}</p>:!library.cvs.length?<p>{t('No hay CV todavía. Crea el primero para empezar.')}</p>:<ul className="cv-list">{library.cvs.map(item=><li key={item.id}><button disabled={busy||!!form} aria-current={cv?.id===item.id?'page':undefined} onClick={()=>{void perform(async()=>{opened(unwrap(await api.open(item.id)));setNotice('');setCollapsed(new Set());requestAnimationFrame(()=>titleRef.current?.focus());});}}>{item.name}<small>{item.hasDraft?t('Borrador pendiente'):t('Revisión {n}',{n:item.revision})}</small></button></li>)}</ul>}
    </aside><main id="main" className="editor-area">
      {!form&&showError()}<p className="status" role="status">{t(notice)}</p>
      {!!library?.recovery.length&&<section className="recovery" aria-label={t('Recuperación de borradores')}><h2>{t('Trabajo sin confirmar')}</h2><p>{t('El contenido confirmado sigue disponible. Elige recuperar o descartar cada borrador.')}</p>{library.recovery.map(item=><div key={item.id} className="repeat"><strong>{item.name}</strong>{item.conflict&&<p>{t('La revisión base ha cambiado. No se aplicará automáticamente.')}</p>}<div className="actions">
        <button disabled={busy||!!form||item.conflict} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;void perform(async()=>{const opened=unwrap(await api.open(item.cvId));setDocument(opened);const recovered=unwrap(await api.recover(item.id));currentForm.current=recovered.form;setForm(recovered.form);setPhoto(recovered.photo);});}}>{t('Recuperar borrador de {name}',{name:item.name})}</button>
        <button disabled={busy||!!form} onClick={()=>{void perform(async()=>{setLibrary(unwrap(await api.discardRecovery(item.id)));setNotice('Borrador descartado.');});}}>{t('Descartar borrador de {name}',{name:item.name})}</button></div></div>)}</section>}
      {!cv?<div className="empty"><h2>{t('Un CV, paso a paso')}</h2><p>{t('Abre un documento de tu biblioteca o crea uno nuevo. Las ocho áreas del MVP se editan por separado.')}</p></div>:<>
        <div className="document-header"><div><span className="eyebrow">CV · {cv.documentLocale.toUpperCase()}</span><h1 ref={titleRef} tabIndex={-1}>{cv.name}</h1><p className="hint">{t('Revisión {n} · Los formularios se confirman por separado.',{n:cv.revision})}</p><p>{t('Idioma del CV')}: {cv.documentLocale==='es'?'Español':'English'}</p></div>
          <div className="actions"><button disabled={busy||blocked} onClick={()=>begin({kind:'order',sectionId:null})}>{t('Reordenar secciones')}</button><button disabled={busy||blocked} onClick={()=>begin({kind:'language',targetLocale:cv.documentLocale==='es'?'en':'es'})}>{t('Preparar cambio de idioma')}</button><button disabled={busy||blocked} onClick={()=>{setDuplicateName(t('Copia de {name}',{name:cv.name}));setDuplicating(true);}}>{t('Duplicar CV')}</button><button disabled={busy||blocked} onClick={()=>{void perform(async()=>setHistory(unwrap(await api.revisions(cv.id))));}}>{t('Revisiones lingüísticas')}</button></div>
        </div>
        <div className="actions"><button disabled={busy||!!form||blocked} onClick={()=>setPresentationOpen(true)}>{t('Presentación')}</button><button aria-expanded={previewOpen} onClick={()=>setPreviewOpen(v=>!v)}>{t(previewOpen?'Cerrar preview':'Vista previa PDF')}</button><button disabled={busy||!!form||blocked} onClick={()=>{void perform(async()=>{const result=unwrap(await api.projectExport(cv.id,cv.revision));if(!result.cancelled)setNotice('Proyecto completo exportado (.cvproj).');});}}>{t('Exportar proyecto (.cvproj)')}</button></div>
        {previewOpen&&<PdfPreview key={cv.id} cv={cv}/>}
        <section className="section-card" aria-labelledby="personal-heading"><header><h2 id="personal-heading">{t('Datos personales')}</h2><div className="actions"><button className="ghost" aria-expanded={!collapsed.has('personal')} aria-controls="personal-content" onClick={()=>toggleCollapse('personal')}>{t(collapsed.has('personal')?'Expandir datos personales':'Contraer datos personales')}</button><button disabled={busy||blocked} onClick={()=>begin({kind:'personal'})}>{t('Editar datos personales')}</button></div></header>
          {!collapsed.has('personal')&&<div id="personal-content" className="personal-summary"><Photo photo={document.photo}/><div><h3>{cv.personalInformation.displayName}</h3>{cv.personalInformation.headline&&<p>{visibleText(cv.personalInformation.headline,cv.sensitiveTranslationMemory)}</p>}{cv.personalInformation.contacts.map(contact=><p key={contact.id}>{contact.kind==='phone'?`${contact.prefix} ${contact.number}`:contact.value}{!cv.presentation.personalFieldVisibility.contacts.includes(contact.id)&&<span className="badge">{t('Excluido del CV')}</span>}</p>)}<small>{t('El resumen del editor también permite reconocer los datos excluidos. Su inclusión se controla en el formulario.')}</small></div></div>}
        </section>
        {cv.sectionOrder.map(sectionId=>{const section=cv.sectionsById[sectionId]!,name=sectionName(section,t,cv.sensitiveTranslationMemory),ids=entryIds(section);return <section key={sectionId} data-section-id={sectionId} className={`section-card ${section.included?'':'excluded'}`} aria-label={name}>
          <header><div><h2>{name}</h2>{!section.included&&<span className="badge">{t('Sección excluida del CV')}</span>}</div><div className="actions" role="group" aria-label={t('Acciones de sección {name}',{name})}>
            <button className="ghost" aria-expanded={!collapsed.has(sectionId)} aria-controls={'content-'+sectionId} onClick={()=>toggleCollapse(sectionId)}>{t(collapsed.has(sectionId)?'Expandir sección':'Contraer sección')}</button>
            <button disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.visibility(cv.id,cv.revision,sectionId,null,!section.included))));}}>{t(section.included?'Ocultar sección':'Mostrar sección')}</button>
            {section.kind==='custom'&&<button disabled={busy||blocked} onClick={()=>begin({kind:'section',sectionId})}>{t('Renombrar sección personalizada')}</button>}
            <button disabled={busy||blocked} onClick={()=>begin(section.kind==='skills'?{kind:'skills',sectionId}:{kind:'order',sectionId})}>{t(section.kind==='skills'?'Editar habilidades y grupos':'Reordenar entradas')}</button>
            <button className="danger-outline" disabled={busy||blocked} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setDeleting({sectionId,entryId:null,label:t('la sección {name} y todas sus entradas',{name})});}}>{t('Eliminar sección')}</button>
          </div></header>
          {!collapsed.has(sectionId)&&<div id={'content-'+sectionId}>
            {!ids.length&&<p className="hint">{t('Todavía no hay entradas.')}</p>}
            {ids.map(entryId=>{const entry=section.entriesById[entryId]!,title=entryTitle(entry,cv);return <article className="entry-summary" key={entryId} data-entry-id={entryId} aria-label={title}>
              <div><h3>{title}</h3><EntryDetails entry={entry} section={section} memory={cv.sensitiveTranslationMemory}/>{!entry.included&&<span className="badge">{t('Entrada excluida del CV')}</span>}</div>
              <div className="actions" role="group" aria-label={t('Acciones de entrada {name}',{name:title})}><button disabled={busy||blocked} onClick={()=>begin(section.kind==='skills'?{kind:'skills',sectionId}:{kind:'entry',sectionId,entryId})}>{t(section.kind==='skills'?'Editar habilidades y grupos':'Editar entrada')}</button><button disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.visibility(cv.id,cv.revision,sectionId,entryId,!entry.included))));}}>{t(entry.included?'Ocultar entrada':'Mostrar entrada')}</button><button className="danger-outline" disabled={busy||blocked} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setDeleting({sectionId,entryId,label:t('la entrada «{name}»',{name:title})});}}>{t('Eliminar entrada')}</button></div>
            </article>;})}
            {section.kind==='skills'?<button disabled={busy||blocked} onClick={()=>begin({kind:'skills',sectionId})}>{t('Añadir habilidades y grupos')}</button>:section.kind==='languages'?<div className="actions"><button disabled={busy||blocked} onClick={()=>begin({kind:'newEntry',sectionId,entryKind:'nativeLanguage'})}>{t('Añadir lengua materna')}</button><button disabled={busy||blocked} onClick={()=>begin({kind:'newEntry',sectionId,entryKind:'foreignLanguage'})}>{t('Añadir lengua extranjera')}</button></div>:<button disabled={busy||blocked} onClick={()=>begin({kind:'newEntry',sectionId})}>{t(entryAddLabel(section.kind))}</button>}
          </div>}
        </section>;})}
        <section className="add-section" aria-label={t('Añadir secciones')}><h2>{t('Añadir sección')}</h2><div className="actions">{(['education','work','skills','languages','certifications','projects'] as const).map(kind=><button key={kind} disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.addSection(cv.id,cv.revision,kind))));}}>{t('Añadir sección de {name}',{name:t(sectionLabel(kind)).toLocaleLowerCase(locale)})}</button>)}<button disabled={busy||blocked} onClick={()=>begin({kind:'newCustomSection'})}>{t('Añadir sección personalizada')}</button></div></section>
      </>}
    </main></div>
    {presentationOpen&&cv&&<PresentationDialog cv={cv} onCancel={()=>setPresentationOpen(false)} onSaved={value=>{opened(value);setPresentationOpen(false);void refresh();}}/>}
    {importing&&<ImportDialog onClose={()=>{setImporting(false);requestAnimationFrame(()=>returnFocus.current?.focus());}} onImported={(cvId,backupName)=>{setImporting(false);void perform(async()=>{await refresh();if(cvId)opened(unwrap(await api.open(cvId)));else{setDocument(null);setPhoto(null);}setNotice(backupName?t('Biblioteca restaurada. Copia de seguridad: {name}',{name:backupName}):'Importación confirmada.');requestAnimationFrame(()=>titleRef.current?.focus());});}}/>}
    {creating&&<Modal title={t('Crear CV')} onCancel={()=>{if(!busy)setCreating(false);}}><form noValidate onSubmit={event=>{event.preventDefault();void perform(async()=>{const required:EditorIssue[]=[];if(!cvName.trim())required.push({path:'name',message:'Escribe un nombre para el CV.'});if(!library?.profileName&&!personName.trim())required.push({path:'displayName',message:'Escribe el nombre que debe aparecer en el CV.'});if(required.length)throw {code:'EDITOR_VALIDATION',issues:required};opened(unwrap(await api.create(cvName,personName)));await refresh();setCreating(false);requestAnimationFrame(()=>titleRef.current?.focus());});}}>
      {showError()}<Field label={t('Nombre del CV en la biblioteca')} required path="name" value={cvName} onChange={setCvName} issues={issues}/>{library?.profileName?<p>{t('Se materializarán los datos personales de tu perfil «{name}». Podrás editarlos en este CV de forma independiente. No se copian secciones.',{name:library.profileName})}</p>:<Field label={t('Nombre para mostrar')} required path="displayName" value={personName} onChange={setPersonName} issues={issues}/>}
      <footer className="form-actions"><button type="button" disabled={busy} onClick={()=>setCreating(false)}>{t('Cancelar')}</button><button className="primary" disabled={busy} type="submit">{t('Crear CV')}</button></footer>
    </form></Modal>}
    {duplicating&&<Modal title={t('Duplicar CV')} onCancel={()=>{if(!busy)setDuplicating(false);}}><form noValidate onSubmit={event=>{event.preventDefault();void perform(async()=>{opened(unwrap(await api.duplicate(cv!.id,cv!.revision,duplicateName)));await refresh();setDuplicating(false);});}}>{showError()}<p>{t('La copia será independiente. Podrás cambiar su idioma conservando el CV de origen.')}</p><Field label={t('Nombre de la copia')} path="duplicateName" required value={duplicateName} onChange={setDuplicateName}/><footer className="form-actions"><button type="button" disabled={busy} onClick={()=>setDuplicating(false)}>{t('Cancelar')}</button><button type="submit" className="primary" disabled={busy}>{t('Crear copia independiente')}</button></footer></form></Modal>}
    {form&&<Modal title={formTitle(form,t)} onCancel={cancel}><form noValidate onSubmit={confirm}><p className="draft-status" role="status">{t(saveStatus)}</p>{showError()}
      <fieldset className="form-body" disabled={busy}><FormContents form={form} change={change} issues={issues} photo={form.cv.personalInformation.photo?photo:null} selectPhoto={selectPhoto}/></fieldset>
      <footer className="form-actions"><button type="button" disabled={busy} onClick={cancel}>{t('Cancelar')}</button><button className="primary" type="submit" disabled={busy}>{t(busy?'Guardando…':'Confirmar')}</button></footer>
    </form></Modal>}
    {deleting&&<Modal title={t('Confirmar eliminación')} onCancel={()=>{if(!busy)setDeleting(null);}} destructive><p>{t('Vas a eliminar {target} de este CV. El historial anterior se conserva. Esta acción se guardará de inmediato.',{target:deleting.label})}</p><footer className="form-actions"><button autoFocus disabled={busy} onClick={()=>setDeleting(null)}>{t('Cancelar')}</button><button className="danger" disabled={busy} onClick={()=>{void perform(async()=>{opened(unwrap(await api.remove(cv!.id,cv!.revision,deleting.sectionId,deleting.entryId,true)));setDeleting(null);setNotice('Eliminación guardada.');requestAnimationFrame(()=>titleRef.current?.focus());});}}>{t('Eliminar definitivamente del CV')}</button></footer>{showError()}</Modal>}
    {history&&<Modal title={t('Revisiones lingüísticas')} onCancel={()=>setHistory(null)}>{!history.length&&<p>{t('No hay checkpoints lingüísticos todavía.')}</p>}{history.map(item=><div className="repeat" key={item.id}><p>{t('Revisión {n}',{n:item.number})} · {t(item.cause==='beforeTranslation'?'Antes de cambiar idioma':'Antes de restaurar')} · {t('Checkpoint fijado')}</p><button disabled={busy} onClick={()=>setRestoring(item)}>{t('Restaurar revisión {n}',{n:item.number})}</button></div>)}<footer className="form-actions"><button onClick={()=>setHistory(null)}>{t('Cerrar revisiones')}</button></footer>{showError()}</Modal>}
    {restoring&&<Modal title={t('Confirmar restauración')} destructive onCancel={()=>{if(!busy)setRestoring(null);}}><p>{t('Restaurar crea una nueva revisión y conserva un checkpoint del estado sustituido.')}</p><footer className="form-actions"><button autoFocus disabled={busy} onClick={()=>setRestoring(null)}>{t('Cancelar')}</button><button className="primary" disabled={busy} onClick={()=>{void perform(async()=>{opened(unwrap(await api.restore(cv!.id,cv!.revision,restoring.id)));setRestoring(null);setHistory(null);setNotice('Revisión restaurada.');});}}>{t('Restaurar como nueva revisión')}</button></footer>{showError()}</Modal>}
  </div>;
}
function FormContents({form,change,issues,photo,selectPhoto}:{form:EditorForm;change:Change;issues:EditorIssue[];photo:PhotoView|null;selectPhoto:(file:File)=>void}){
  const {t}=useMessages();switch(form.target.kind){
    case 'personal':return <PersonalForm form={form} change={change} issues={issues} photo={photo} selectPhoto={selectPhoto}/>;
    case 'entry':{const e=form.cv.sectionsById[form.target.sectionId]!.entriesById[form.target.entryId]!;return e.kind==='education'||e.kind==='work'?<EntryForm form={form} change={change} issues={issues}/>:<MvpEntryForm form={form} change={change} issues={issues}/>;}
    case 'skills':return <SkillsForm form={form} change={change}/>;
    case 'language':return <LanguagePlanForm form={form} change={change}/>;
    case 'order':return <OrderForm form={form} change={change}/>;
    case 'section':{const sectionId=form.target.sectionId,section=form.cv.sectionsById[sectionId]!;return <><p>{t('El nombre de sección es independiente del título de sus entradas.')}</p><ClassifiedField label={t('Nombre de sección')} path={`sectionsById.${sectionId}.title`} value={section.title!} memory={form.cv.sensitiveTranslationMemory} locale={form.cv.documentLocale} fieldKind="sectionTitle" issues={issues} onChange={value=>change(f=>{f.cv.sectionsById[sectionId]!.title=value;})} onMemory={(value,memory)=>change(f=>{f.cv.sectionsById[sectionId]!.title=value;f.cv.sensitiveTranslationMemory=memory;})}/></>;}
  }
}
function EntryDetails({entry,section,memory}:{entry:CvEntry;section:CvSection;memory:CvDocument['sensitiveTranslationMemory']}){
  const {t}=useMessages();return <>
    {entry.kind==='education'&&<p>{entry.fields.organization?.value}</p>}{entry.kind==='work'&&<p>{entry.fields.employer?.value}</p>}{entry.kind==='certification'&&<><p>{entry.fields.issuer?.value}</p><p>{dateInput(entry.fields.issued)}</p></>}
    {'period' in entry.fields&&<p className="hint">{localizedPeriod(entry.fields.period,t)}</p>}
    {entry.kind==='skill'&&<p className="hint">{entry.fields.groupId?visibleText(section.groupsById[entry.fields.groupId]!.name,memory):t('Sin agrupar')}</p>}
    {entry.kind==='nativeLanguage'&&<p className="hint">{t('Lengua materna')}</p>}
    {entry.kind==='foreignLanguage'&&<dl className="cefr-summary">{([['listening','Comprensión oral / Listening'],['reading','Lectura / Reading'],['spokenInteraction','Interacción oral / Spoken interaction'],['spokenProduction','Expresión oral / Spoken production'],['writing','Escritura / Writing']] as const).map(([key,label])=><div key={key}><dt>{t(label)}</dt><dd>{entry.fields.proficiency[key]??t('Sin evaluar')}</dd></div>)}</dl>}
  </>;
}
function localizedPeriod(period:Parameters<typeof periodLabel>[0],t:Translate):string{return period.ongoing?[periodLabel({...period,ongoing:false}),t('Actualmente')].filter(x=>x!=='Periodo no indicado').join(' → '):t(periodLabel(period));}
function OrderForm({form,change}:{form:EditorForm;change:Change}){
  const {t}=useMessages();if(form.target.kind!=='order')return null;
  const sectionId=form.target.sectionId,order=sectionId?form.cv.sectionsById[sectionId]!.entryOrder!:form.cv.sectionOrder;
  const name=(id:string)=>sectionId?entryTitle(form.cv.sectionsById[sectionId]!.entriesById[id]!,form.cv):sectionName(form.cv.sectionsById[id]!,t,form.cv.sensitiveTranslationMemory);
  const move=(index:number,delta:number)=>change(f=>{const list=sectionId?f.cv.sectionsById[sectionId]!.entryOrder!:f.cv.sectionOrder;const [id]=list.splice(index,1);list.splice(index+delta,0,id!);});
  return <><p>{t('Usa Tab para enfocar los botones y Enter o Espacio para mover. Confirma para guardar el orden; Cancelar conserva el anterior.')}</p><ol className="order-list">{order.map((id,index)=><li key={id}><strong>{name(id)}</strong><div className="actions"><button type="button" disabled={index===0} aria-label={t('Subir {name}',{name:name(id)})} onClick={()=>move(index,-1)}>{t('Subir')}</button><button type="button" disabled={index===order.length-1} aria-label={t('Bajar {name}',{name:name(id)})} onClick={()=>move(index,1)}>{t('Bajar')}</button></div></li>)}</ol><p role="status">{t('Orden')}: {order.map(name).join(', ')}</p></>;
}
