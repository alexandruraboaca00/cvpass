import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { CvDocument, CvEntry } from '../domain/index.js';
import { plainText } from '../domain/index.js';
import { periodLabel, sectionLabel } from '../application/editor-model.js';
import type { EditorForm, EditorIssue, EditorTarget } from '../application/editor-model.js';
import type { EditorDocumentView, EditorLibraryView, PhotoView } from '../application/editor.js';
import type { EditorFailure, EditorResult } from '../application/editor-contract.js';
import { EntryForm } from './EntryForm.js';
import { PersonalForm } from './PersonalForm.js';
import { Photo } from './Photo.js';
import { Field } from './fields.js';
import type { Change } from './fields.js';

const api=window.cvforge;
function unwrap<T>(result:EditorResult<T>):T {if(!result.ok)throw result.error;return result.value;}
export function entryTitle(entry:CvEntry):string {return entry.kind === 'education' ? plainText(entry.fields.title) : entry.kind === 'work' ? plainText(entry.fields.position) : 'Entrada de otra fase';}
function failure(error:unknown):EditorFailure {return error && typeof error === 'object' && 'code' in error ? error as EditorFailure : {code:'LOCAL_OPERATION_FAILED',issues:[]};}
function message(code:string):string {
  return ({EDITOR_VALIDATION:'No se puede confirmar. Revisa los campos indicados.',EDITOR_FORM_OPEN:'Confirma o cancela el formulario abierto.',DRAFTS_PENDING:'Recupera o descarta primero el borrador pendiente.',REVISION_CONFLICT:'La revisión ha cambiado. Cancela y vuelve a abrir el documento.',DRAFT_BASE_CONFLICT:'La base del borrador ha cambiado; no se puede aplicar automáticamente.',IPC_INPUT_INVALID:'Los datos enviados no son válidos.',PHOTO_DECODE_FAILED:'No se ha podido leer la imagen.',PHOTO_SIZE_OR_TYPE:'Selecciona una imagen PNG o JPEG de hasta 10 MiB.',PHOTO_FORMAT_UNSUPPORTED:'Esta imagen no es compatible o está dañada. Prueba a guardarla como PNG RGB de 8 bits sin entrelazado, o JPEG.',ASSET_NOT_FOUND:'La imagen no está disponible.'})[code] ?? `No se ha completado la operación (${code}). Los cambios confirmados se conservan.`;
}
export function App() {
  const [library,setLibrary]=useState<EditorLibraryView|null>(null),[document,setDocument]=useState<EditorDocumentView|null>(null),[form,setForm]=useState<EditorForm|null>(null);
  const [photo,setPhoto]=useState<PhotoView|null>(null),[issues,setIssues]=useState<EditorIssue[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false),[collapsed,setCollapsed]=useState<Set<string>>(new Set()),[creating,setCreating]=useState(false),[cvName,setCvName]=useState(''),[personName,setPersonName]=useState('');
  const [deleting,setDeleting]=useState<{sectionId:string;entryId:string|null;label:string}|null>(null),[saveStatus,setSaveStatus]=useState('');
  const currentForm=useRef<EditorForm|null>(null),pending=useRef<Promise<void>>(Promise.resolve()),activeAction=useRef<Promise<unknown>>(Promise.resolve()),closeRequested=useRef<()=>void>(()=>{}),returnFocus=useRef<HTMLElement|null>(null),titleRef=useRef<HTMLHeadingElement>(null);
  const refresh=async()=>setLibrary(unwrap(await api.list()));
  const report=(error:unknown)=>{const e=failure(error);setError(message(e.code));setIssues(e.issues);};
  const perform=async<T,>(operation:()=>Promise<T>):Promise<T|undefined>=>{setBusy(true);setError('');setIssues([]);const task=Promise.resolve().then(operation);activeAction.current=task.then(()=>undefined,()=>undefined);try{return await task;}catch(error){report(error);return undefined;}finally{setBusy(false);}};
  useEffect(()=>{void refresh().catch(report);const timer=setInterval(()=>{if(currentForm.current)void api.status().then(result=>{if(result.ok)setSaveStatus(result.value.error ? 'Error al guardar el borrador. Puedes volver a intentar Confirmar o Cancelar.' : result.value.status === 'saved' ? 'Borrador guardado localmente. Aún no confirmado.' : 'Guardando borrador…');});},1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    let requested=false;
    const requestClose=()=>{if(requested)return;requested=true;const previousAction=activeAction.current;void perform(async()=>{try{await previousAction;await pending.current;if(currentForm.current)unwrap(await api.stage(currentForm.current));unwrap(await api.flush());unwrap(await api.close());}catch(error){requested=false;throw error;}});};
    closeRequested.current=requestClose;
    const unsubscribe=api.onCloseRequested(requestClose);
    // Renderer-initiated window.close() can unload before the native close event.
    // Keep the renderer alive until its latest raw form has been acknowledged.
    const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=false;requestClose();};
    window.addEventListener('beforeunload',beforeUnload);
    return()=>{unsubscribe();window.removeEventListener('beforeunload',beforeUnload);};
  },[]);
  const change:Change = mutate=>{
    const next=structuredClone(currentForm.current!);mutate(next);currentForm.current=next;setForm(next);setNotice('');setSaveStatus('Cambios en borrador…');
    pending.current=pending.current.then(async()=>{unwrap(await api.stage(next));}).catch(report);
  };
  const opened=(value:EditorDocumentView)=>{setDocument(value);setPhoto(value.photo);setIssues([]);};
  const closeForm=(value:EditorDocumentView,confirmed:boolean)=>{
    opened(value);currentForm.current=null;setForm(null);setSaveStatus('');setNotice(confirmed ? 'Guardado localmente.' : 'Cambios cancelados.');
    void refresh();requestAnimationFrame(()=>{if(returnFocus.current?.isConnected)returnFocus.current.focus();else titleRef.current?.focus();});
  };
  const begin=(target:EditorTarget|{kind:'newEntry';sectionId:string})=>{returnFocus.current=window.document.activeElement as HTMLElement;void perform(async()=>{const value=unwrap(await api.begin(document!.cv.id,document!.cv.revision,target));currentForm.current=value;setForm(value);setPhoto(document!.photo);setSaveStatus('Borrador abierto.');});};
  const confirm=(event:FormEvent)=>{event.preventDefault();void perform(async()=>{await pending.current;const result=await api.confirm(currentForm.current!);if(!result.ok){setTimeout(()=>window.document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),0);throw result.error;}closeForm(result.value,true);});};
  const cancel=()=>{if(busy)return;void perform(async()=>{await pending.current;closeForm(unwrap(await api.cancel()),false);});};
  const selectPhoto=(file:File)=>{void perform(async()=>{if(file.size>10*1024*1024||!['image/png','image/jpeg'].includes(file.type))throw {code:'PHOTO_SIZE_OR_TYPE',issues:[]};await pending.current;const value=unwrap(await api.photo(new Uint8Array(await file.arrayBuffer()),file.type as 'image/png'|'image/jpeg'));currentForm.current=value.form;setForm(value.form);setPhoto(value.photo);});};
  const cv=document?.cv;
  const blocked=!!cv && !!library?.recovery.some(d=>d.cvId===cv.id);
  const toggleCollapse=(id:string)=>setCollapsed(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});
  return <div className="app-shell"><header className="app-header"><div className="brand">CVForge</div><span>Biblioteca local · Editor</span><button onClick={()=>closeRequested.current()}>Guardar borrador y salir</button></header>
    <div className="app-layout"><aside className="library" aria-label="Biblioteca de CV"><h1>Tu biblioteca</h1><p className="hint">CV independientes, guardados en este equipo.</p>
      <button className="primary" disabled={busy||!!form} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setCreating(true);setCvName('');setPersonName('');setError('');}}>Crear CV</button>
      {!library ? <p>Cargando biblioteca…</p> : !library.cvs.length ? <p>No hay CV todavía. Crea el primero para empezar.</p> : <ul className="cv-list">{library.cvs.map(item=><li key={item.id}><button disabled={busy||!!form} aria-current={cv?.id===item.id ? 'page' : undefined} onClick={()=>{void perform(async()=>{opened(unwrap(await api.open(item.id)));setNotice('');setCollapsed(new Set());requestAnimationFrame(()=>titleRef.current?.focus());});}}>{item.name}<small>{item.hasDraft ? 'Borrador pendiente' : `Revisión ${item.revision}`}</small></button></li>)}</ul>}
    </aside><main id="main" className="editor-area">
      {!form && error && <div role="alert" className="error-banner">{error}</div>}<p className="status" role="status">{notice}</p>
      {!!library?.recovery.length && <section className="recovery" aria-label="Recuperación de borradores"><h2>Trabajo sin confirmar</h2><p>El contenido confirmado sigue disponible. Elige recuperar o descartar cada borrador.</p>{library.recovery.map(item=><div key={item.id} className="repeat"><strong>{item.name}</strong>{item.conflict && <p>La revisión base ha cambiado. No se aplicará automáticamente.</p>}<div className="actions">
        <button disabled={busy||!!form||item.conflict} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;void perform(async()=>{const opened=unwrap(await api.open(item.cvId));setDocument(opened);const recovered=unwrap(await api.recover(item.id));currentForm.current=recovered.form;setForm(recovered.form);setPhoto(recovered.photo);});}}>Recuperar borrador de {item.name}</button>
        <button disabled={busy||!!form} onClick={()=>{void perform(async()=>{setLibrary(unwrap(await api.discardRecovery(item.id)));setNotice('Borrador descartado.');});}}>Descartar borrador de {item.name}</button></div></div>)}</section>}
      {!cv ? <div className="empty"><h2>Un CV, paso a paso</h2><p>Abre un documento de tu biblioteca o crea uno nuevo. Edita tus datos personales, educación y experiencia.</p></div> : <>
        <div className="document-header"><div><span className="eyebrow">CV · {cv.documentLocale.toUpperCase()}</span><h1 ref={titleRef} tabIndex={-1}>{cv.name}</h1><p className="hint">Revisión {cv.revision} · Los formularios se confirman por separado.</p></div><button disabled={busy||blocked} onClick={()=>begin({kind:'order',sectionId:null})}>Reordenar secciones</button></div>
        <section className="section-card" aria-labelledby="personal-heading"><header><h2 id="personal-heading">Datos personales</h2><div className="actions"><button aria-expanded={!collapsed.has('personal')} aria-controls="personal-content" onClick={()=>toggleCollapse('personal')}>{collapsed.has('personal') ? 'Expandir datos personales' : 'Contraer datos personales'}</button><button disabled={busy||blocked} onClick={()=>begin({kind:'personal'})}>Editar datos personales</button></div></header>
          {!collapsed.has('personal') && <div id="personal-content" className="personal-summary"><Photo photo={document.photo}/><div><h3>{cv.personalInformation.displayName}</h3>{cv.personalInformation.headline && <p>{plainText(cv.personalInformation.headline)}</p>}{cv.personalInformation.contacts.map(contact=><p key={contact.id}>{contact.kind === 'phone' ? `${contact.prefix} ${contact.number}` : contact.value}{!cv.presentation.personalFieldVisibility.contacts.includes(contact.id) && <span className="badge">Excluido del CV</span>}</p>)}<small>El resumen del editor también permite reconocer los datos excluidos. Su inclusión se controla en el formulario.</small></div></div>}
        </section>
        {cv.sectionOrder.map(sectionId=>{const section=cv.sectionsById[sectionId]!,supported=section.kind==='education'||section.kind==='work',name=section.title ? plainText(section.title) : sectionLabel(section.kind);return <section key={sectionId} data-section-id={sectionId} className={`section-card ${section.included ? '' : 'excluded'}`} aria-label={name}>
          <header><div><h2>{name}</h2>{!section.included && <span className="badge">Sección excluida del CV</span>}</div><div className="actions" role="group" aria-label={`Acciones de sección ${name}`}>
            <button aria-expanded={!collapsed.has(sectionId)} aria-controls={'content-'+sectionId} onClick={()=>toggleCollapse(sectionId)}>{collapsed.has(sectionId) ? 'Expandir sección' : 'Contraer sección'}</button>
            {supported && <><button disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.visibility(cv.id,cv.revision,sectionId,null,!section.included))));}}>{section.included ? 'Ocultar sección' : 'Mostrar sección'}</button>
              <button disabled={busy||blocked} onClick={()=>begin({kind:'order',sectionId})}>Reordenar entradas</button><button disabled={busy||blocked} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setDeleting({sectionId,entryId:null,label:`la sección ${name} y todas sus entradas`});}}>Eliminar sección</button></>}
          </div></header>
          {!collapsed.has(sectionId) && <div id={'content-'+sectionId}>{supported ? <>
            {!section.entryOrder!.length && <p className="hint">Todavía no hay entradas.</p>}
            {section.entryOrder!.map(entryId=>{const entry=section.entriesById[entryId]!;if(entry.kind!=='education'&&entry.kind!=='work')return null;return <article className="entry-summary" key={entryId} data-entry-id={entryId} aria-label={entryTitle(entry)}>
              <div><h3>{entryTitle(entry)}</h3><p>{(entry.kind==='education' ? entry.fields.organization : entry.fields.employer)?.value}</p><p className="hint">{periodLabel(entry.fields.period)}</p>{!entry.included && <span className="badge">Entrada excluida del CV</span>}</div>
              <div className="actions" role="group" aria-label={`Acciones de entrada ${entryTitle(entry)}`}><button disabled={busy||blocked} onClick={()=>begin({kind:'entry',sectionId,entryId})}>Editar entrada</button><button disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.visibility(cv.id,cv.revision,sectionId,entryId,!entry.included))));}}>{entry.included ? 'Ocultar entrada' : 'Mostrar entrada'}</button><button disabled={busy||blocked} onClick={()=>{returnFocus.current=window.document.activeElement as HTMLElement;setDeleting({sectionId,entryId,label:`la entrada «${entryTitle(entry)}»`});}}>Eliminar entrada</button></div>
            </article>;})}
            <button disabled={busy||blocked} onClick={()=>begin({kind:'newEntry',sectionId})}>{section.kind==='education' ? 'Añadir educación' : 'Añadir experiencia'}</button>
          </> : <p>Esta sección se conserva en el proyecto. Su editor corresponde a una fase posterior.</p>}</div>}
        </section>;})}
        <section className="add-section" aria-label="Añadir secciones"><h2>Añadir sección</h2><div className="actions">{(['education','work'] as const).map(kind=><button key={kind} disabled={busy||blocked} onClick={()=>{void perform(async()=>opened(unwrap(await api.addSection(cv.id,cv.revision,kind))));}}>Añadir sección de {sectionLabel(kind).toLowerCase()}</button>)}</div></section>
      </>}
    </main></div>
    {creating && <Modal title="Crear CV" onCancel={()=>{if(!busy)setCreating(false);}}><form noValidate onSubmit={event=>{event.preventDefault();void perform(async()=>{opened(unwrap(await api.create(cvName,personName)));await refresh();setCreating(false);requestAnimationFrame(()=>titleRef.current?.focus());});}}>
      {error && <p role="alert" className="error">{error}</p>}<Field label="Nombre del CV en la biblioteca" required path="name" value={cvName} onChange={setCvName}/>
      {library?.profileName ? <p>Se materializarán los datos personales de tu perfil «{library.profileName}». Podrás editarlos en este CV de forma independiente. No se copian secciones.</p> : <Field label="Nombre para mostrar" required path="displayName" value={personName} onChange={setPersonName}/>}
      <footer className="form-actions"><button type="button" disabled={busy} onClick={()=>setCreating(false)}>Cancelar</button><button className="primary" disabled={busy} type="submit">Crear CV</button></footer>
    </form></Modal>}
    {form && <Modal title={form.target.kind==='personal' ? 'Editar datos personales' : form.target.kind==='order' ? form.target.sectionId ? 'Orden de entradas' : 'Orden de secciones' : form.target.kind==='language' ? 'Plan de cambio de idioma' : form.target.kind==='entry' && form.cv.sectionsById[form.target.sectionId]!.kind==='education' ? 'Editar educación' : 'Editar experiencia'} onCancel={cancel}>
      <form noValidate onSubmit={confirm}><p className="draft-status" role="status">{saveStatus}</p>{error && <div role="alert" className="error-banner"><p>{error}</p>{issues.length>0 && <ul>{[...new Set(issues.map(issue=>issue.message))].map(text=><li key={text}>{text}</li>)}</ul>}</div>}
        <fieldset className="form-body" disabled={busy}>{form.target.kind==='personal' ? <PersonalForm form={form} change={change} issues={issues} photo={form.cv.personalInformation.photo ? photo : null} selectPhoto={selectPhoto}/> : form.target.kind==='entry' ? <EntryForm form={form} change={change} issues={issues}/> : <OrderForm form={form} change={change}/>}</fieldset>
        <footer className="form-actions"><button type="button" disabled={busy} onClick={cancel}>Cancelar</button><button className="primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Confirmar'}</button></footer>
      </form>
    </Modal>}
    {deleting && <Modal title="Confirmar eliminación" onCancel={()=>{if(!busy)setDeleting(null);}} destructive><p>Vas a eliminar {deleting.label} de este CV. El historial anterior se conserva. Esta acción se guardará de inmediato.</p><footer className="form-actions"><button autoFocus disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button><button className="danger" disabled={busy} onClick={()=>{void perform(async()=>{opened(unwrap(await api.remove(cv!.id,cv!.revision,deleting.sectionId,deleting.entryId,true)));setDeleting(null);setNotice('Eliminación guardada.');requestAnimationFrame(()=>titleRef.current?.focus());});}}>Eliminar definitivamente del CV</button></footer>{error && <p role="alert" className="error">{error}</p>}</Modal>}
  </div>;
}
function Modal({title,onCancel,children,destructive=false}:{title:string;onCancel:()=>void;children:ReactNode;destructive?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null),id=useRef(crypto.randomUUID());
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} aria-labelledby={id.current} role={destructive ? 'alertdialog' : 'dialog'} onCancel={event=>{event.preventDefault();onCancel();}}><h2 id={id.current}>{title}</h2>{children}</dialog>;
}
function OrderForm({form,change}:{form:EditorForm;change:Change}) {
  if(form.target.kind!=='order')return null;
  const sectionId=form.target.sectionId,order=sectionId ? form.cv.sectionsById[sectionId]!.entryOrder! : form.cv.sectionOrder;
  const move=(index:number,delta:number)=>change(f=>{const list=sectionId ? f.cv.sectionsById[sectionId]!.entryOrder! : f.cv.sectionOrder;const [id]=list.splice(index,1);list.splice(index+delta,0,id!);});
  return <><p>Usa Tab para enfocar los botones y Enter o Espacio para mover. Confirma para guardar el orden; Cancelar conserva el anterior.</p><ol className="order-list">{order.map((id,index)=>{const name=sectionId ? entryTitle(form.cv.sectionsById[sectionId]!.entriesById[id]!) : sectionLabel(form.cv.sectionsById[id]!.kind);return <li key={id}><strong>{name}</strong><div className="actions"><button type="button" disabled={index===0} aria-label={`Subir ${name}`} onClick={()=>move(index,-1)}>Subir</button><button type="button" disabled={index===order.length-1} aria-label={`Bajar ${name}`} onClick={()=>move(index,1)}>Bajar</button></div></li>;})}</ol><p role="status">Orden: {order.map(id=>sectionId ? entryTitle(form.cv.sectionsById[sectionId]!.entriesById[id]!) : sectionLabel(form.cv.sectionsById[id]!.kind)).join(', ')}</p></>;
}
