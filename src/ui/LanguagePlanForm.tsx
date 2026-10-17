import { plainText, richText } from '../domain/index.js';
import type { LanguageItem } from '../domain/index.js';
import { sectionLabel } from '../application/editor-model.js';
import type { EditorForm } from '../application/editor-model.js';
import { DisplayModes, reviewLabel } from './ClassifiedField.js';
import { Check, Field, SelectField } from './fields.js';
import type { Change } from './fields.js';
import { useMessages } from './i18n.js';
import type { Translate } from './i18n.js';

export function planFieldLabel(form:EditorForm,item:LanguageItem,t:Translate):string {
  const path=item.path,last=path.at(-1)!,labels:Record<string,string>={headline:'Titular profesional',about:'Presentación personal',documentTitle:'Título del documento',title:'Título',position:'Puesto',description:'Descripción',fieldOfStudy:'Área de estudio',thesis:'Tesis',subjects:'Materias',sector:'Sector',department:'Departamento',name:'Nombre del grupo',label:'Texto de la habilidad'};
  const label=t(labels[last]??(path.includes('subjects')?'Materias':'Texto traducible'));
  if(path[0]!=='sectionsById')return label;
  const section=form.cv.sectionsById[path[1]!]!,owner=section.title?plainText(section.title):t(sectionLabel(section.kind));
  if(path[2]==='entriesById'){
    const e=section.entriesById[path[3]!]!,title='title' in e.fields?plainText(e.fields.title):e.kind==='work'?plainText(e.fields.position):e.kind==='skill'?plainText(e.fields.label):'';
    return `${owner} · ${title} · ${label}`;
  }
  return `${owner} · ${label}`;
}
export function LanguagePlanForm({form,change}:{form:EditorForm;change:Change}){
  const {t}=useMessages(),plan=form.languagePlan;if(!plan)return null;
  const locale=(value:string)=>value==='es'?'Español':'English';
  const update=(index:number,mutate:(item:LanguageItem)=>void)=>change(f=>mutate(f.languagePlan!.fields[index]!));
  return <><p>{t('Cambiar CV de {source} a {target}',{source:locale(plan.sourceLocale),target:locale(plan.targetLocale)})}</p>
    <p className="hint">{t('No hay un proveedor automático instalado. Introduce y revisa las traducciones manualmente. El CV confirmado no cambia hasta Confirmar.')}</p>
    <p>{t('Al confirmar se conservará un checkpoint fijado del estado anterior. Puedes cancelar el plan completo.')}</p>
    <p className="hint">{t('El plan incluye también el contenido oculto del proyecto; eso no lo incluye en el PDF.')}</p>
    <h3>{t('Traducir y revisar')}</h3>{!plan.fields.length&&<p>{t('No hay textos traducibles en este CV.')}</p>}
    {plan.fields.map((item,index)=>{const label=planFieldLabel(form,item,t);return <fieldset key={item.path.join('/')} data-plan-class={item.class}><legend>{label}</legend>
      {item.class==='A'?<><p className="plan-original">{t('Original')}: {typeof item.source.current.value==='string'?item.source.current.value:richText(item.source.current.value)}</p>
        <SelectField label={t('Tratamiento de esta narrativa')} value={item.decision} onChange={value=>update(index,next=>{if(next.class==='A'){next.decision=value as typeof next.decision;next.reviewed=false;}})}><option value="translate">{t('Traducir al idioma destino')}</option><option value="keepOriginal">{t('Conservar texto e idioma de origen explícitamente')}</option></SelectField>
        {item.decision==='keepOriginal'?<p className="hint">{t('Esta narrativa conservará el idioma {locale}; aceptas explícitamente esa mezcla.',{locale:item.source.current.locale})}</p>:item.segments.map((segment,i)=>segment.protected?<p key={i} className="protected-term">{t('Conservar')}: <strong>{segment.source}</strong></p>:<Field key={i} label={t('Traducción de {label}, fragmento {n}',{label,n:i+1})} path={item.path.join('.')} value={segment.translation} multiline required onChange={value=>update(index,next=>{if(next.class==='A'){next.segments[i]!.translation=value;next.reviewed=false;}})}/>)}
        <Check label={t('He revisado esta narrativa y acepto el resultado (incluidos textos que decida conservar)')} checked={item.reviewed} onChange={value=>update(index,next=>{if(next.class==='A')next.reviewed=value;})}/>
      </>:<><p>{t('Original')}: <strong>{item.source.original?.value??t('Original desconocido')}</strong></p><p role="status" className={item.status==='stale'?'error':'hint'}>{t(reviewLabel(item.status))}</p>
        {item.source.original&&<Field label={t('Traducción sensible de {label}',{label})} path={item.path.join('.')} value={item.proposal} onChange={value=>update(index,next=>{if(next.class==='C'){next.proposal=value;next.decision='unreviewed';}})}/>}
        <SelectField label={t('Decisión para {label}',{label})} value={item.decision} onChange={value=>update(index,next=>{if(next.class==='C'){next.decision=value as typeof next.decision;if(next.decision==='keepOriginal')next.mode='original';else if(next.mode==='original')next.mode='translationAndOriginal';}})}>
          <option value="unreviewed">{t('Revisar antes de confirmar')}</option>
          {item.source.original?<><option value="keepOriginal">{t('Conservar original explícitamente')}</option><option value="approve">{t('Aprobar esta traducción revisada')}</option>{item.approvalId&&<option value="reuse">{t('Reutilizar aprobación existente')}</option>}</>:<option value="keepImported">{t('Conservar lo visible importado sin inventar original')}</option>}
        </SelectField>
        {item.decision!=='keepImported'&&<DisplayModes mode={item.mode} onChange={mode=>update(index,next=>{if(next.class==='C'){next.mode=mode;if(mode==='original')next.decision='keepOriginal';else if(next.decision==='keepOriginal')next.decision='unreviewed';}})}/>}
      </>}
    </fieldset>;})}
    <details open><summary>{t('Conservar literalmente ({n})',{n:plan.preserved.length})}</summary><ul className="preserved-list">{plan.preserved.map((item,index)=><li key={index}>{item.value}</li>)}</ul></details>
  </>;
}
