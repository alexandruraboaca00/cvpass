import { useMessages } from './i18n.js';
import { useId } from 'react';
import type { ReactNode } from 'react';
import type { EditorIssue, EditorForm } from '../application/editor-model.js';
import type { AddressSchema, Period } from '../domain/index.js';
import type { z } from 'zod';
export type Change = (mutate:(form:EditorForm)=>void)=>void;
export const nullable = (value:string):string|null => value === '' ? null : value;
export function Field({label,path,value,onChange,issues=[],required=false,multiline=false,type='text',hint}:{label:string;path:string;value:string;onChange:(v:string)=>void;issues?:EditorIssue[];required?:boolean;multiline?:boolean;type?:string;hint?:string}) {
  const {t}=useMessages();
  const id = useId(), message = issues.filter(i=>i.path === path || i.path.startsWith(path+'.')).map(i=>t(i.message)).join(' ');
  const props = {id,value,required,'aria-invalid':!!message,'aria-describedby':message ? id+'-error' : hint ? id+'-hint' : undefined,onChange:(event:{target:{value:string}})=>onChange(event.target.value)};
  return <div className="field"><label htmlFor={id}>{label} <small>({t(required ? 'obligatorio' : 'opcional')})</small></label>
    {multiline ? <textarea {...props} rows={3}/> : <input {...props} type={type}/>}
    {hint && <small id={id+'-hint'}>{hint}</small>}{message && <p id={id+'-error'} className="error">{message}</p>}
  </div>;
}
export function Check({label,checked,onChange}:{label:ReactNode;checked:boolean;onChange:(v:boolean)=>void}) {
  return <label className="check"><input type="checkbox" checked={checked} onChange={event=>onChange(event.target.checked)}/>{label}</label>;}
export function PeriodFields({label,path,period,form,change,issues,setOngoing}:{label:string;path:string;period:Period;form:EditorForm;change:Change;issues:EditorIssue[];setOngoing:(form:EditorForm,value:boolean)=>void}) {
  const {t}=useMessages();
  const error = issues.filter(i=>i.path === path || i.path.includes('period.inverted')).map(i=>t(i.message)).join(' ');
  return <fieldset><legend>{label}</legend><p className="hint">{t("Fechas opcionales. Escribe AAAA, AAAA-MM o AAAA-MM-DD. También puedes indicar solo la fecha final.")}</p>
    <div className="grid"><Field label={t("Fecha de inicio")} path={path+'.start'} value={form.rawDates[path+'.start'] ?? ''} issues={issues} onChange={v=>change(f=>{f.rawDates[path+'.start']=v;})}/>
      <Field label={t("Fecha final")} path={path+'.end'} value={form.rawDates[path+'.end'] ?? ''} issues={issues} onChange={v=>change(f=>{f.rawDates[path+'.end']=v;})}/></div>
    <Check label={t("Actualmente / Ongoing")} checked={period.ongoing} onChange={v=>change(f=>setOngoing(f,v))}/>
    {period.ongoing && <small>{t("Deja la fecha final vacía. El texto introducido se conserva hasta que lo retires.")}</small>}
    {error && <p className="error">{t(error)}</p>}
  </fieldset>;
}
export function SelectField({label,value,onChange,children}:{label:string;value:string;onChange:(value:string)=>void;children:ReactNode}){
  const id=useId();return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event=>onChange(event.target.value)}>{children}</select></div>;
}
export type Address = z.infer<typeof AddressSchema>;
export const newAddress = ():Address=>({id:crypto.randomUUID(),lines:[],locality:null,region:null,postalCode:null,countryCode:null,original:null});
export function AddressFields({address,path,issues,update}:{address:Address;path:string;issues:EditorIssue[];update:(change:(address:Address)=>void)=>void}) {
  const {t}=useMessages();
  return <div className="grid"><Field label={t("Dirección (una línea por fila)")} path={path+'.lines'} value={address.lines.join('\n')} issues={issues} multiline onChange={v=>update(a=>{a.lines=v === '' ? [] : v.split('\n');})}/>
    {([['locality','Localidad'],['region','Región'],['postalCode','Código postal'],['countryCode','País (código de dos letras mayúsculas)'],['original','Dirección original']] as const).map(([key,label])=><Field key={key} label={t(label)} path={path+'.'+key} value={address[key] ?? ''} issues={issues} onChange={v=>update(a=>{a[key]=nullable(v);})}/>)}
  </div>;
}
