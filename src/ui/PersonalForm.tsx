import type { EditorForm, EditorIssue } from '../application/editor-model.js';
import { editRich, editText } from '../application/editor-model.js';
import type { ContactSchema, PersonalInformation } from '../domain/index.js';
import { plainText } from '../domain/index.js';
import type { z } from 'zod';
import type { PhotoView } from '../application/editor.js';
import { AddressFields, Check, Field, newAddress, nullable } from './fields.js';
import type { Change } from './fields.js';
import { RichEditor } from './RichEditor.js';
import { Photo } from './Photo.js';
export function PersonalForm({form,change,issues,photo,selectPhoto}:{form:EditorForm;change:Change;issues:EditorIssue[];photo:PhotoView|null;selectPhoto:(file:File)=>void}) {
  const p=form.cv.personalInformation, visibility=form.cv.presentation.personalFieldVisibility, path='personalInformation';
  const optional = (key:'givenName'|'familyName'|'gender',label:string)=><Field label={label} path={path+'.'+key} value={p[key] ?? ''} issues={issues} onChange={v=>change(f=>{f.cv.personalInformation[key]=nullable(v);})}/>;
  return <>
    <p>Solo el nombre para mostrar es obligatorio. Los campos vacíos permanecen vacíos. La selección de inclusión se confirma junto con los datos.</p>
    <fieldset><legend>Identidad</legend><div className="grid">
      <Field label="Nombre para mostrar" required path={path+'.displayName'} value={p.displayName} issues={issues} onChange={v=>change(f=>{f.cv.personalInformation.displayName=v;})}/>
      {optional('givenName','Nombre')}{optional('familyName','Apellidos')}
      <Field label="Otros nombres (uno por línea)" path={path+'.otherNames'} value={p.otherNames.join('\n')} issues={issues} multiline onChange={v=>change(f=>{f.cv.personalInformation.otherNames=v === '' ? [] : v.split('\n');})}/>
      <Field label="Titular profesional" path={path+'.headline'} value={p.headline ? plainText(p.headline) : ''} issues={issues} onChange={v=>change(f=>{f.cv.personalInformation.headline=editText(p.headline,v,form.cv.documentLocale);})}/>
    </div><RichEditor label="Presentación personal" value={p.about?.current.value ?? null} onChange={v=>change(f=>{f.cv.personalInformation.about=editRich(p.about,v,form.cv.documentLocale);})}/></fieldset>
    <fieldset><legend>Contacto</legend><p className="hint">Puedes añadir varios emails, teléfonos y enlaces. Retirar un contacto del formulario elimina ese dato al confirmar. Desmarcar «Incluir» conserva su valor.</p>
      {p.contacts.map((contact,index)=><ContactRow key={contact.id} contact={contact} path={`${path}.contacts.${index}`} issues={issues} included={visibility.contacts.includes(contact.id)} update={fn=>change(f=>fn(f.cv.personalInformation.contacts[index]!))}
        include={value=>change(f=>{const ids=f.cv.presentation.personalFieldVisibility.contacts;f.cv.presentation.personalFieldVisibility.contacts=value ? [...ids,contact.id] : ids.filter(id=>id!==contact.id);})}
        remove={()=>change(f=>{f.cv.personalInformation.contacts.splice(index,1);f.cv.presentation.personalFieldVisibility.contacts=f.cv.presentation.personalFieldVisibility.contacts.filter(id=>id!==contact.id);})}/>)}
      <div className="actions">{(['email','phone','website','social'] as const).map(kind=><button type="button" key={kind} onClick={()=>change(f=>{const id=crypto.randomUUID();f.cv.personalInformation.contacts.push(kind === 'phone' ? {id,kind,label:null,prefix:'',number:''} : {id,kind,label:null,value:''});f.cv.presentation.personalFieldVisibility.contacts.push(id);})}>Añadir {({email:'email',phone:'teléfono',website:'web',social:'red social'})[kind]}</button>)}</div>
    </fieldset>
    <fieldset><legend>Ubicación y direcciones</legend>
      {p.addresses.map((address,index)=><div className="repeat" key={address.id}><AddressFields address={address} path={`${path}.addresses.${index}`} issues={issues} update={fn=>change(f=>fn(f.cv.personalInformation.addresses[index]!))}/>
        <Check label={`Incluir dirección ${index+1} en el CV`} checked={visibility.addresses.includes(address.id)} onChange={value=>change(f=>{const ids=f.cv.presentation.personalFieldVisibility.addresses;f.cv.presentation.personalFieldVisibility.addresses=value ? [...ids,address.id] : ids.filter(id=>id!==address.id);})}/>
        <button type="button" onClick={()=>change(f=>{f.cv.personalInformation.addresses.splice(index,1);f.cv.presentation.personalFieldVisibility.addresses=f.cv.presentation.personalFieldVisibility.addresses.filter(id=>id!==address.id);})}>Retirar dirección {index+1}</button></div>)}
      <button type="button" onClick={()=>change(f=>{const address=newAddress();f.cv.personalInformation.addresses.push(address);f.cv.presentation.personalFieldVisibility.addresses.push(address.id);})}>Añadir dirección</button>
    </fieldset>
    <fieldset><legend>Foto</legend><Photo photo={photo}/>
      <label className="field">Seleccionar o sustituir imagen (PNG o JPEG, hasta 10 MiB)<input type="file" accept="image/png,image/jpeg" onChange={event=>{const file=event.target.files?.[0];if(file) selectPhoto(file);event.target.value='';}}/></label>
      {p.photo && <><Check label="Incluir foto en el CV" checked={p.photo.visible} onChange={v=>change(f=>{f.cv.personalInformation.photo!.visible=v;})}/><button type="button" onClick={()=>change(f=>{f.cv.personalInformation.photo=null;})}>Retirar foto del CV</button></>}
      <small>La imagen se guarda con el proyecto. Cancelar conserva la foto anterior.</small>
    </fieldset>
    <fieldset><legend>Otros datos personales opcionales</legend><div className="grid">
      <Field label="Fecha de nacimiento" path={path+'.birthDate'} value={form.rawDates[path+'.birthDate'] ?? ''} issues={issues} hint="AAAA, AAAA-MM o AAAA-MM-DD" onChange={v=>change(f=>{f.rawDates[path+'.birthDate']=v;})}/>
      <Field label="Nacionalidades (una por línea)" path={path+'.nationalities'} value={p.nationalities.join('\n')} issues={issues} multiline onChange={v=>change(f=>{f.cv.personalInformation.nationalities=v === '' ? [] : v.split('\n');})}/>{optional('gender','Género')}
    </div>{p.identifiers.map((identifier,index)=><div className="repeat grid" key={identifier.id}>
      <Field label={`Tipo de identificador ${index+1}`} path={`${path}.identifiers.${index}.label`} value={identifier.label} required issues={issues} onChange={v=>change(f=>{f.cv.personalInformation.identifiers[index]!.label=v;})}/>
      <Field label={`Identificador ${index+1}`} path={`${path}.identifiers.${index}.value`} value={identifier.value} required issues={issues} onChange={v=>change(f=>{f.cv.personalInformation.identifiers[index]!.value=v;})}/>
      <button type="button" onClick={()=>change(f=>{f.cv.personalInformation.identifiers.splice(index,1);})}>Retirar identificador {index+1}</button>
    </div>)}<button type="button" onClick={()=>change(f=>{f.cv.personalInformation.identifiers.push({id:crypto.randomUUID(),label:'',value:''});})}>Añadir identificador</button></fieldset>
    <fieldset><legend>Campos personales incluidos en el CV</legend><p className="hint">Desmarcar conserva el dato dentro del proyecto. Contactos, direcciones y foto tienen sus propios controles.</p><div className="grid">
      {([['displayName','Nombre para mostrar'],['givenName','Nombre'],['familyName','Apellidos'],['otherNames','Otros nombres'],['headline','Titular profesional'],['about','Presentación personal'],['birthDate','Fecha de nacimiento'],['nationalities','Nacionalidades'],['gender','Género'],['identifiers','Identificadores']] as const).map(([key,label])=><Check key={key} label={`Incluir ${label.toLowerCase()}`} checked={visibility[key]} onChange={v=>change(f=>{f.cv.presentation.personalFieldVisibility[key]=v;})}/>)}</div>
    </fieldset>
  </>;
}
function ContactRow({contact,path,issues,included,update,include,remove}:{contact:z.infer<typeof ContactSchema>;path:string;issues:EditorIssue[];included:boolean;update:(fn:(c:z.infer<typeof ContactSchema>)=>void)=>void;include:(v:boolean)=>void;remove:()=>void}) {
  const name={email:'Email',phone:'Teléfono',website:'Web',social:'Red social'}[contact.kind];
  return <div className="repeat"><div className="grid"><Field label="Etiqueta del contacto" path={path+'.label'} value={contact.label ?? ''} issues={issues} onChange={v=>update(c=>{c.label=nullable(v);})}/>
    {contact.kind === 'phone' ? <><Field label="Prefijo telefónico" path={path+'.prefix'} value={contact.prefix} issues={issues} onChange={v=>update(c=>{if(c.kind === 'phone') c.prefix=v;})}/><Field label={name} required path={path+'.number'} value={contact.number} issues={issues} type="tel" onChange={v=>update(c=>{if(c.kind === 'phone')c.number=v;})}/></>
      : <Field label={name} required path={path+'.value'} value={contact.value} issues={issues} type={contact.kind === 'email' ? 'email' : 'url'} onChange={v=>update(c=>{if(c.kind !== 'phone') c.value=v;})}/>}</div>
    <div className="actions"><Check label={`Incluir ${name.toLowerCase()} en el CV`} checked={included} onChange={include}/><button type="button" onClick={remove}>Retirar {name.toLowerCase()}</button></div>
  </div>;
}
