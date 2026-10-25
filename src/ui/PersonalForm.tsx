import { useMessages } from './i18n.js';
import type { ContentForm, EditorIssue } from '../application/editor-model.js';
import { editRich, editText } from '../application/editor-model.js';
import type { ContactSchema, PersonalInformation } from '../domain/index.js';
import { plainText } from '../domain/index.js';
import type { z } from 'zod';
import type { PhotoView } from '../application/editor.js';
import { AddressFields, Check, Field, newAddress, nullable } from './fields.js';
import type { ContentChange as Change } from './fields.js';
import { RichEditor } from './RichEditor.js';
import { Photo } from './Photo.js';
import { OptionalClassifiedField } from './ClassifiedField.js';
export function PersonalForm({form,change,issues,photo,selectPhoto}:{form:ContentForm;change:Change;issues:EditorIssue[];photo:PhotoView|null;selectPhoto:(file:File)=>void}) {
  const {t}=useMessages();
  const p=form.entity.personalInformation, visibility=form.entity.kind==='cv'?form.entity.presentation.personalFieldVisibility:null, path='personalInformation';
  const optional = (key:'givenName'|'familyName'|'gender',label:string)=><Field label={t(label)} path={path+'.'+key} value={p[key] ?? ''} issues={issues} onChange={v=>change(f=>{f.entity.personalInformation[key]=nullable(v);})}/>;
  return <>
    <p>{t(visibility?"Solo el nombre para mostrar es obligatorio. Los campos vacíos permanecen vacíos. La selección de inclusión se confirma junto con los datos.":"Solo el nombre para mostrar es obligatorio. El perfil guarda información reutilizable; la inclusión se elige al crear cada CV.")}</p>
    <fieldset><legend>{t("Identidad")}</legend><div className="grid">
      <Field label={t("Nombre para mostrar")} required path={path+'.displayName'} value={p.displayName} issues={issues} onChange={v=>change(f=>{f.entity.personalInformation.displayName=v;})}/>
      {optional('givenName','Nombre')}{optional('familyName','Apellidos')}
      <Field label={t("Otros nombres (uno por línea)")} path={path+'.otherNames'} value={p.otherNames.join('\n')} issues={issues} multiline onChange={v=>change(f=>{f.entity.personalInformation.otherNames=v === '' ? [] : v.split('\n');})}/>
      <OptionalClassifiedField label={t('Titular profesional')} path={path+'.headline'} value={p.headline} locale={form.textLocale} memory={form.entity.sensitiveTranslationMemory} fieldKind="headline" issues={issues} onChange={value=>change(f=>{f.entity.personalInformation.headline=value;})} onMemory={(value,memory)=>change(f=>{f.entity.personalInformation.headline=value;f.entity.sensitiveTranslationMemory=memory;})}/>
    </div><RichEditor field={p.about} onProtectionChange={value=>change(f=>{f.entity.personalInformation.about=value;})} label={t("Presentación personal")} value={p.about?.current.value ?? null} onChange={v=>change(f=>{f.entity.personalInformation.about=editRich(f.entity.personalInformation.about,v,f.textLocale);})}/></fieldset>
    <fieldset><legend>{t("Contacto")}</legend><p className="hint">{t(visibility?"Puedes añadir varios emails, teléfonos y enlaces. Retirar un contacto del formulario elimina ese dato al confirmar. Desmarcar «Incluir» conserva su valor.":"Puedes añadir varios emails, teléfonos y enlaces. Retirar un contacto lo elimina del perfil al confirmar; los CV existentes no cambian.")}</p>
      {p.contacts.map((contact,index)=><ContactRow key={contact.id} contact={contact} path={`${path}.contacts.${index}`} issues={issues} included={visibility?.contacts.includes(contact.id)} update={fn=>change(f=>fn(f.entity.personalInformation.contacts[index]!))}
        include={value=>change(f=>{if(f.entity.kind!=='cv')return;const ids=f.entity.presentation.personalFieldVisibility.contacts;f.entity.presentation.personalFieldVisibility.contacts=value ? [...ids,contact.id] : ids.filter(id=>id!==contact.id);})}
        remove={()=>change(f=>{f.entity.personalInformation.contacts.splice(index,1);if(f.entity.kind==='cv')f.entity.presentation.personalFieldVisibility.contacts=f.entity.presentation.personalFieldVisibility.contacts.filter(id=>id!==contact.id);})}/>)}
      <div className="actions">{(['email','phone','website','social'] as const).map(kind=><button type="button" key={kind} onClick={()=>change(f=>{const id=crypto.randomUUID();f.entity.personalInformation.contacts.push(kind === 'phone' ? {id,kind,label:null,prefix:'',number:''} : {id,kind,label:null,value:''});if(f.entity.kind==='cv')f.entity.presentation.personalFieldVisibility.contacts.push(id);})}>{t(({email:'Añadir email',phone:'Añadir teléfono',website:'Añadir web',social:'Añadir red social'})[kind])}</button>)}</div>
    </fieldset>
    <fieldset><legend>{t("Ubicación y direcciones")}</legend>
      {p.addresses.map((address,index)=><div className="repeat" key={address.id}><AddressFields address={address} path={`${path}.addresses.${index}`} issues={issues} update={fn=>change(f=>fn(f.entity.personalInformation.addresses[index]!))}/>
        {visibility&&<Check label={t("Incluir dirección {n} en el CV",{n:index+1})} checked={visibility.addresses.includes(address.id)} onChange={value=>change(f=>{if(f.entity.kind!=='cv')return;const ids=f.entity.presentation.personalFieldVisibility.addresses;f.entity.presentation.personalFieldVisibility.addresses=value ? [...ids,address.id] : ids.filter(id=>id!==address.id);})}/> }
        <button type="button" onClick={()=>change(f=>{f.entity.personalInformation.addresses.splice(index,1);if(f.entity.kind==='cv')f.entity.presentation.personalFieldVisibility.addresses=f.entity.presentation.personalFieldVisibility.addresses.filter(id=>id!==address.id);})}>{t("Retirar dirección {n}",{n:index+1})}</button></div>)}
      <button type="button" onClick={()=>change(f=>{const address=newAddress();f.entity.personalInformation.addresses.push(address);if(f.entity.kind==='cv')f.entity.presentation.personalFieldVisibility.addresses.push(address.id);})}>{t("Añadir dirección")}</button>
    </fieldset>
    <fieldset className="photo-fields"><legend>{t("Foto")}</legend><Photo photo={photo} label={t(visibility?'Foto del CV':'Foto del perfil')}/>
      <label className="field">{t("Seleccionar o sustituir imagen (PNG o JPEG, hasta 10 MiB)")}<input type="file" accept="image/png,image/jpeg" onChange={event=>{const file=event.target.files?.[0];if(file) selectPhoto(file);event.target.value='';}}/></label>
      {p.photo && <>{visibility&&<Check label={t("Incluir foto en el CV")} checked={p.photo.visible} onChange={v=>change(f=>{f.entity.personalInformation.photo!.visible=v;})}/>}<button type="button" onClick={()=>change(f=>{f.entity.personalInformation.photo=null;})}>{t(visibility?"Retirar foto del CV":"Retirar foto del perfil")}</button></>}
      <small>{t("La imagen se guarda con el proyecto. Cancelar conserva la foto anterior.")}</small>
    </fieldset>
    <fieldset><legend>{t("Otros datos personales opcionales")}</legend><div className="grid">
      <Field label={t("Fecha de nacimiento")} path={path+'.birthDate'} value={form.rawDates[path+'.birthDate'] ?? ''} issues={issues} hint={t("AAAA, AAAA-MM o AAAA-MM-DD")} onChange={v=>change(f=>{f.rawDates[path+'.birthDate']=v;})}/>
      <Field label={t("Nacionalidades (una por línea)")} path={path+'.nationalities'} value={p.nationalities.join('\n')} issues={issues} multiline onChange={v=>change(f=>{f.entity.personalInformation.nationalities=v === '' ? [] : v.split('\n');})}/>{optional('gender','Género')}
    </div>{p.identifiers.map((identifier,index)=><div className="repeat grid" key={identifier.id}>
      <Field label={t("Tipo de identificador {n}",{n:index+1})} path={`${path}.identifiers.${index}.label`} value={identifier.label} required issues={issues} onChange={v=>change(f=>{f.entity.personalInformation.identifiers[index]!.label=v;})}/>
      <Field label={t("Identificador {n}",{n:index+1})} path={`${path}.identifiers.${index}.value`} value={identifier.value} required issues={issues} onChange={v=>change(f=>{f.entity.personalInformation.identifiers[index]!.value=v;})}/>
      <button type="button" onClick={()=>change(f=>{f.entity.personalInformation.identifiers.splice(index,1);})}>{t("Retirar identificador {n}",{n:index+1})}</button>
    </div>)}<button type="button" onClick={()=>change(f=>{f.entity.personalInformation.identifiers.push({id:crypto.randomUUID(),label:'',value:''});})}>{t("Añadir identificador")}</button></fieldset>
    {visibility&&<fieldset><legend>{t("Campos personales incluidos en el CV")}</legend><p className="hint">{t("Desmarcar conserva el dato dentro del proyecto. Contactos, direcciones y foto tienen sus propios controles.")}</p><div className="grid">
      {([['displayName','Nombre para mostrar'],['givenName','Nombre'],['familyName','Apellidos'],['otherNames','Otros nombres'],['headline','Titular profesional'],['about','Presentación personal'],['birthDate','Fecha de nacimiento'],['nationalities','Nacionalidades'],['gender','Género'],['identifiers','Identificadores']] as const).map(([key,label])=><Check key={key} label={t("Incluir {name}",{name:t(label).toLocaleLowerCase()})} checked={visibility[key]} onChange={v=>change(f=>{if(f.entity.kind==='cv')f.entity.presentation.personalFieldVisibility[key]=v;})}/>)}</div>
    </fieldset>}
  </>;
}
function ContactRow({contact,path,issues,included,update,include,remove}:{contact:z.infer<typeof ContactSchema>;path:string;issues:EditorIssue[];included:boolean|undefined;update:(fn:(c:z.infer<typeof ContactSchema>)=>void)=>void;include:(v:boolean)=>void;remove:()=>void}) {
  const {t}=useMessages();
  const name={email:'Email',phone:'Teléfono',website:'Web',social:'Red social'}[contact.kind];
  return <div className="repeat"><div className="grid"><Field label={t("Etiqueta del contacto")} path={path+'.label'} value={contact.label ?? ''} issues={issues} onChange={v=>update(c=>{c.label=nullable(v);})}/>
    {contact.kind === 'phone' ? <><Field label={t("Prefijo telefónico")} path={path+'.prefix'} value={contact.prefix} issues={issues} onChange={v=>update(c=>{if(c.kind === 'phone') c.prefix=v;})}/><Field label={t(name)} required path={path+'.number'} value={contact.number} issues={issues} type="tel" onChange={v=>update(c=>{if(c.kind === 'phone')c.number=v;})}/></>
      : <Field label={t(name)} required path={path+'.value'} value={contact.value} issues={issues} type={contact.kind === 'email' ? 'email' : 'url'} onChange={v=>update(c=>{if(c.kind !== 'phone') c.value=v;})}/>}</div>
    <div className="actions">{included!==undefined&&<Check label={t("Incluir {name} en el CV",{name:t(name).toLocaleLowerCase()})} checked={included} onChange={include}/>}<button type="button" onClick={remove}>{t('Retirar {name}',{name:t(name).toLocaleLowerCase()})}</button></div>
  </div>;
}
