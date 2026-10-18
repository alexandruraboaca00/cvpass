import { useId, useState } from 'react';
import { addSkill, moveSkill, plainText, removeSkillGroup, reorderSkillGroups, TextFieldSchema } from '../domain/index.js';
import type { CvDocument, CvEntry, TextField } from '../domain/index.js';
import { newMvpEntry } from '../application/editor-model.js';
import type { EditorForm } from '../application/editor-model.js';
import { ClassifiedField, visibleText } from './ClassifiedField.js';
import { SelectField } from './fields.js';
import type { Change } from './fields.js';
import { Modal } from './Modal.js';
import { useMessages } from './i18n.js';
type Skill=Extract<CvEntry,{kind:'skill'}>;
type Child={kind:'group';id:string;name:TextField;memory:CvDocument['sensitiveTranslationMemory']}|{kind:'skill';entry:Skill;memory:CvDocument['sensitiveTranslationMemory']};
const ctx={newId:()=>crypto.randomUUID(),now:()=>new Date().toISOString()};
export function SkillsForm({form,change}:{form:EditorForm;change:Change}){
  const {t}=useMessages(),[child,setChild]=useState<Child|null>(null),[deleting,setDeleting]=useState<{kind:'group'|'skill';id:string;name:string}|null>(null),[childError,setChildError]=useState('');
  if(form.target.kind!=='skills')return null;const sectionId=form.target.sectionId,section=form.cv.sectionsById[sectionId]!;
  const memory=form.cv.sensitiveTranslationMemory;
  const groupName=(id:string|null)=>id===null?t('Sin agrupar'):visibleText(section.groupsById[id]!.name,memory);
  const editGroup=(id:string|null)=>{setChildError('');setChild({kind:'group',id:id??ctx.newId(),name:id?structuredClone(section.groupsById[id]!.name):{class:'A',current:{value:'',locale:form.cv.documentLocale},revision:1,protectedSpans:[]},memory:structuredClone(memory)});};
  const editSkill=(id:string|null,groupId:string|null)=>{setChildError('');const entry=id?structuredClone(section.entriesById[id]!) as Skill:newMvpEntry('skill',ctx,form.cv.documentLocale) as Skill;entry.fields.groupId=groupId;setChild({kind:'skill',entry,memory:structuredClone(memory)});};
  const confirmChild=()=>{if(!child)return;try{
    TextFieldSchema.parse(child.kind==='group'?child.name:child.entry.fields.label);
    change(f=>{let s=f.cv.sectionsById[sectionId]!;f.cv.sensitiveTranslationMemory=child.memory;
      if(child.kind==='group'){
        if(s.groupsById[child.id])s.groupsById[child.id]!.name=child.name;
        else {s.groupsById[child.id]={id:child.id,name:child.name,skillIds:[]};s.groupOrder.push(child.id);}
      }else if(s.entriesById[child.entry.id]){
        const previous=s.entriesById[child.entry.id] as Skill;
        if(previous.fields.groupId!==child.entry.fields.groupId){const ids=child.entry.fields.groupId===null?s.ungroupedSkillIds:s.groupsById[child.entry.fields.groupId]!.skillIds;s=moveSkill(s,previous.id,child.entry.fields.groupId,ids.length);}
        s.entriesById[child.entry.id]={...child.entry,fields:{...child.entry.fields}};f.cv.sectionsById[sectionId]=s;
      }else f.cv.sectionsById[sectionId]=addSkill(s,child.entry);
    });setChild(null);
  }catch{setChildError('Indica un texto no vacío y revisa sus datos lingüísticos.');}};
  const moveGroup=(index:number,delta:number)=>change(f=>{const s=f.cv.sectionsById[sectionId]!,order=[...s.groupOrder],[id]=order.splice(index,1);order.splice(index+delta,0,id!);f.cv.sectionsById[sectionId]=reorderSkillGroups(s,order);});
  const move=(id:string,groupId:string|null,index:number)=>change(f=>{f.cv.sectionsById[sectionId]=moveSkill(f.cv.sectionsById[sectionId]!,id,groupId,index);});
  const remove=()=>{if(!deleting)return;change(f=>{const s=f.cv.sectionsById[sectionId]!;
    if(deleting.kind==='group')f.cv.sectionsById[sectionId]=removeSkillGroup(s,deleting.id);
    else {delete s.entriesById[deleting.id];s.ungroupedSkillIds=s.ungroupedSkillIds.filter(id=>id!==deleting.id);Object.values(s.groupsById).forEach(g=>{g.skillIds=g.skillIds.filter(id=>id!==deleting.id);});}
  });setDeleting(null);};
  return <><p>{t('Los grupos y habilidades se guardan al confirmar este formulario. Cancelar descarta también los cambios confirmados en sus modales.')}</p>
    <button type="button" onClick={()=>editGroup(null)}>{t('Crear grupo')}</button>
    {([null,...section.groupOrder] as (string|null)[]).map((groupId,groupIndex)=>{
      const ids=groupId===null?section.ungroupedSkillIds:section.groupsById[groupId]!.skillIds,name=groupName(groupId);
      return <fieldset key={groupId??'ungrouped'} data-skill-group={groupId??'ungrouped'}><legend>{name}</legend>
        {groupId!==null&&<div className="actions"><button type="button" onClick={()=>editGroup(groupId)}>{t('Renombrar grupo')}</button><button type="button" disabled={groupIndex===1} aria-label={t('Subir grupo {name}',{name})} onClick={()=>moveGroup(groupIndex-1,-1)}>{t('Subir grupo')}</button><button type="button" disabled={groupIndex===section.groupOrder.length} aria-label={t('Bajar grupo {name}',{name})} onClick={()=>moveGroup(groupIndex-1,1)}>{t('Bajar grupo')}</button><button className="danger-outline" type="button" onClick={()=>setDeleting({kind:'group',id:groupId,name})}>{t('Eliminar grupo')}</button></div>}
        {!ids.length&&<p className="hint">{t('No hay habilidades en esta lista.')}</p>}
        <ol className="skill-list">{ids.map((id,index)=>{const e=section.entriesById[id] as Skill,label=visibleText(e.fields.label,memory);return <li key={id} data-skill-id={id}>
          <strong>{label}</strong>{!e.included&&<span className="badge">{t('Entrada excluida del CV')}</span>}
          <div className="actions"><button type="button" onClick={()=>editSkill(id,groupId)}>{t('Editar habilidad')}</button><button type="button" disabled={index===0} aria-label={t('Subir {name}',{name:label})} onClick={()=>move(id,groupId,index-1)}>{t('Subir')}</button><button type="button" disabled={index===ids.length-1} aria-label={t('Bajar {name}',{name:label})} onClick={()=>move(id,groupId,index+1)}>{t('Bajar')}</button><button type="button" onClick={()=>change(f=>{f.cv.sectionsById[sectionId]!.entriesById[id]!.included=!e.included;})}>{t(e.included?'Ocultar habilidad':'Mostrar habilidad')}</button><button className="danger-outline" type="button" onClick={()=>setDeleting({kind:'skill',id,name:label})}>{t('Eliminar habilidad')}</button></div>
          <SkillDestination value={groupId} label={t('Grupo de {name}',{name:label})} groups={section.groupOrder.map(g=>({id:g,name:groupName(g)}))} onChange={destination=>{if(destination!==groupId){const to=destination===null?section.ungroupedSkillIds:section.groupsById[destination]!.skillIds;move(id,destination,to.length);}}}/>
        </li>;})}</ol><button type="button" onClick={()=>editSkill(null,groupId)}>{t('Añadir habilidad a {name}',{name})}</button>
      </fieldset>;
    })}
    {child&&<Modal title={t(child.kind==='group'?'Editar grupo':'Editar habilidad')} onCancel={()=>setChild(null)}><form noValidate onSubmit={event=>{event.preventDefault();event.stopPropagation();confirmChild();}}>
      <ClassifiedField label={t(child.kind==='group'?'Nombre del grupo':'Texto de la habilidad')} path="skillChild.text" required value={child.kind==='group'?child.name:child.entry.fields.label} locale={form.cv.documentLocale} memory={child.memory} fieldKind={child.kind==='group'?'skillGroup':'skill'} onChange={value=>setChild(child.kind==='group'?{...child,name:value}:{...child,entry:{...child.entry,fields:{...child.entry.fields,label:value}}})} onMemory={(field,memory)=>setChild(child.kind==='group'?{...child,name:field,memory}:{...child,entry:{...child.entry,fields:{...child.entry.fields,label:field}},memory})}/>
      {child.kind==='skill'&&<SkillDestination value={child.entry.fields.groupId} label={t('Grupo de la habilidad')} groups={section.groupOrder.map(id=>({id,name:groupName(id)}))} onChange={groupId=>setChild({...child,entry:{...child.entry,fields:{...child.entry.fields,groupId}}})}/>}
      <p className="hint">{t('Confirmar aquí solo actualiza el borrador padre.')}</p>{childError&&<p role="alert" className="error">{t(childError)}</p>}
      <footer className="form-actions"><button type="button" onClick={()=>setChild(null)}>{t('Cancelar hijo')}</button><button className="primary" type="submit">{t('Confirmar hijo en borrador')}</button></footer>
    </form></Modal>}
    {deleting&&<Modal title={t(deleting.kind==='group'?'Eliminar grupo conservando habilidades':'Eliminar habilidad del borrador')} destructive onCancel={()=>setDeleting(null)}><p>{t('Objetivo')}: {deleting.name}</p><p>{t(deleting.kind==='group'?'Sus habilidades pasarán al final de Sin agrupar, conservando su orden relativo.':'La habilidad se eliminará al confirmar el formulario padre. El historial se conserva.')}</p><footer className="form-actions"><button type="button" autoFocus onClick={()=>setDeleting(null)}>{t('Cancelar eliminación')}</button><button type="button" className="danger" onClick={remove}>{t(deleting.kind==='group'?'Eliminar grupo y conservar habilidades':'Eliminar habilidad del borrador')}</button></footer></Modal>}
  </>;
}
function SkillDestination({label,value,groups,onChange}:{label:string;value:string|null;groups:{id:string;name:string}[];onChange:(id:string|null)=>void}){const {t}=useMessages();return <SelectField label={label} value={value??''} onChange={value=>onChange(value||null)}><option value="">{t('Sin agrupar')}</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</SelectField>;}
