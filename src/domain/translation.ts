import { z } from 'zod';
import { assertDataTree, canonical, DocumentLocale, fail, NonBlank, parse } from './primitives.js';
import type { DomainContext } from './primitives.js';
import { NarrativeSchema, RichNarrativeSchema, SensitiveSchema, plainText, richText } from './content.js';
import type { NarrativeField, RichNarrative, RichTextDoc, SensitiveField, TextField } from './content.js';
import { approvalMatches, approveSensitive, keepOriginal, sensitiveReviewState } from './language.js';
import { entryIds, validateCv } from './model.js';
import type { CvDocument } from './model.js';

const Path=z.array(z.string().min(1)).min(1);
const Segment=z.strictObject({start:z.int().nonnegative(),end:z.int().positive(),source:z.string(),protected:z.boolean(),translation:z.string().max(100_000)});
const NarrativeItem=z.strictObject({class:z.literal('A'),path:Path,source:z.union([NarrativeSchema,RichNarrativeSchema]),segments:z.array(Segment),reviewed:z.boolean(),decision:z.enum(['translate','keepOriginal'])});
const SensitiveItem=z.strictObject({class:z.literal('C'),path:Path,source:SensitiveSchema,status:z.enum(['missing','stale','reused','original','unknown']),
  decision:z.enum(['unreviewed','keepOriginal','approve','reuse','keepImported']),proposal:z.string().max(100_000),
  approvalId:z.uuid().nullable(),mode:z.enum(['original','translation','translationAndOriginal'])});
const Preserved=z.strictObject({path:Path,value:z.string(),reason:z.enum(['literal','contact','identifier','location','language'])});
export const LanguagePlanSchema=z.strictObject({cvId:z.uuid(),baseRevision:z.int().nonnegative(),sourceLocale:DocumentLocale,targetLocale:DocumentLocale,
  fields:z.array(z.discriminatedUnion('class',[NarrativeItem,SensitiveItem])),preserved:z.array(Preserved)});
export type LanguagePlan=z.infer<typeof LanguagePlanSchema>;
export type LanguageItem=LanguagePlan['fields'][number];
export type SensitivePlanItem=Extract<LanguageItem,{class:'C'}>;

interface Leaf {start:number;end:number;path:(string|number)[];text:string}
// Offsets agree with richText(), including its paragraph/list separators.
function leaves(value:string|RichTextDoc):Leaf[] {
  if(typeof value==='string')return value ? [{start:0,end:value.length,path:[],text:value}] : [];
  const result:Leaf[]=[];let offset=0;
  const paragraph=(p:RichTextDoc['content'][number] & {kind:'paragraph'},path:(string|number)[])=>{
    p.content.forEach((inline,index)=>{if(inline.kind==='break'){offset++;return;}const start=offset;offset+=inline.text.length;if(inline.text)result.push({start,end:offset,path:[...path,'content',index,'text'],text:inline.text});});
  };
  value.content.forEach((block,index)=>{
    if(index)offset++;
    if(block.kind==='paragraph')paragraph(block,['content',index]);
    else block.items.forEach((item,i)=>{if(i)offset++;item.content.forEach((p,j)=>{if(j)offset++;paragraph(p,['content',index,'items',i,'content',j]);});});
  });return result;
}
function get(object:unknown,path:readonly(string|number)[]):unknown {
  let cursor=object;for(const key of path){if(!cursor||typeof cursor!=='object'||!Object.hasOwn(cursor,key))fail('translation.pathInvalid');cursor=(cursor as Record<string,unknown>)[key];}return cursor;
}
function set(object:unknown,path:readonly(string|number)[],value:unknown):void {
  const parent=get(object,path.slice(0,-1)) as Record<string,unknown>;parent[path.at(-1)!]=value;
}
function protectedRanges(field:NarrativeField|RichNarrative,terms:string[]):{start:number;end:number}[] {
  const text=typeof field.current.value==='string'?field.current.value:richText(field.current.value);
  const ranges=field.protectedSpans.map(s=>({start:s.start,end:s.end}));
  const word=(s:string|undefined)=>!!s&&/[\p{L}\p{N}_]/u.test(s);
  for(const term of new Set(terms.filter(Boolean))){let at=0;while((at=text.indexOf(term,at))>=0){
    const end=at+term.length;
    if(!(word(term[0])&&word(text[at-1]))&&!(word(term.at(-1))&&word(text[end])))ranges.push({start:at,end});
    at=end;
  }}
  // Contacts embedded in narrative are protected even without a contact row.
  for(const match of text.matchAll(/(?:https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\+\d[\d ()-]{5,}\d)/g))ranges.push({start:match.index,end:match.index+match[0].length});
  return ranges;
}
function segments(field:NarrativeField|RichNarrative,terms:string[]):LanguagePlan['fields'][number] & {class:'A'} {
  const ranges=protectedRanges(field,terms),result:z.infer<typeof Segment>[]=[];
  for(const leaf of leaves(field.current.value)){
    const cuts=[...new Set([leaf.start,leaf.end,...ranges.flatMap(r=>[Math.max(leaf.start,Math.min(leaf.end,r.start)),Math.max(leaf.start,Math.min(leaf.end,r.end))])])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const start=cuts[i]!,end=cuts[i+1]!,source=leaf.text.slice(start-leaf.start,end-leaf.start),protectedValue=ranges.some(r=>r.start<=start&&r.end>=end)||!source.trim();
      result.push({start,end,source,protected:protectedValue,translation:source});
    }
  }
  return {class:'A',path:[],source:structuredClone(field),segments:result,reviewed:result.every(s=>s.protected),decision:result.every(s=>s.protected)?'keepOriginal':'translate'};
}

export function buildLanguagePlan(input:CvDocument,targetLocale:'es'|'en'):LanguagePlan {
  const cv=validateCv(input);parse(DocumentLocale,targetLocale);if(cv.documentLocale===targetLocale)fail('translation.sameLocale');
  const fields:LanguageItem[]=[],preserved:LanguagePlan['preserved']=[],terms:string[]=[];
  const orderedEntries=(object:Record<string,unknown>,path:string[]):[string,unknown][]=>{
    const order=path.length===1&&path[0]==='sectionsById'?cv.sectionOrder:path.at(-1)==='entriesById'?entryIds(cv.sectionsById[path[1]!]!):path.at(-1)==='groupsById'?cv.sectionsById[path[1]!]!.groupOrder:null;
    return order?order.map(id=>[id,object[id]]):Object.entries(object);
  };
  const preserve=(path:string[],value:string,reason:LanguagePlan['preserved'][number]['reason'],insideNarrative=false)=>{if(value){preserved.push({path,value,reason});if(insideNarrative)terms.push(value);}};
  function collect(value:unknown,path:string[]):void {
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((v,i)=>collect(v,[...path,String(i)]));return;}
    const obj=value as Record<string,unknown>;
    if(obj.class==='A'||obj.class==='C')return;
    if(obj.class==='B'){preserve(path,String(obj.value),'literal',true);return;}
    for(const [key,v] of orderedEntries(obj,path)){
      if(['sensitiveTranslationMemory','presentation','sourceRef','catalog'].includes(key))continue;
      if(typeof v==='string'&&['displayName','givenName','familyName','value','number','url','web','contact','location','name','label','original','locality','region','postalCode','countryCode','code','gender','grade','nationalClassification','system','learningMode'].includes(key)&&!(path.length===0&&key==='name'))preserve([...path,key],v,key==='location'?'location':key==='url'||key==='web'||key==='contact'||key==='number'?'contact':key==='code'?'language':'identifier',['displayName','givenName','familyName','value','number','url','web','contact','location','locality','region'].includes(key));
      else if(Array.isArray(v)&&['otherNames','nationalities','lines'].includes(key))v.forEach((s,i)=>{if(typeof s==='string')preserve([...path,key,String(i)],s,'identifier',key==='otherNames');});
      else collect(v,[...path,key]);
    }
  }
  collect(cv,[]);
  function visit(value:unknown,path:string[]):void {
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((v,i)=>visit(v,[...path,String(i)]));return;}
    const obj=value as Record<string,unknown>;
    if(obj.class==='B')return;
    if(obj.class==='A'){
      const item=segments(obj as unknown as NarrativeField|RichNarrative,terms);if(item.source.current.locale===targetLocale){item.reviewed=true;item.decision='keepOriginal';}
      fields.push({...item,path});return;
    }
    if(obj.class==='C'){
      const source=obj as unknown as SensitiveField,target={...source,outputLocale:targetLocale};
      const approved=Object.values(cv.sensitiveTranslationMemory).filter(a=>approvalMatches(target,a)).sort((a,b)=>b.approvedAt.localeCompare(a.approvedAt)||a.id.localeCompare(b.id))[0];
      const original=source.original?.locale===targetLocale;
      fields.push({class:'C',path,source:structuredClone(source),status:!source.original?'unknown':approved?'reused':original?'original':sensitiveReviewState(source,cv.sensitiveTranslationMemory)==='stale'?'stale':'missing',
        decision:!source.original?'unreviewed':original?'keepOriginal':approved?'reuse':'unreviewed',proposal:approved?.value ?? (source.approvalId?cv.sensitiveTranslationMemory[source.approvalId]?.value:'') ?? '',
        approvalId:approved?.id ?? null,mode:original?'original':approved?(source.displayMode==='original'?'translation':source.displayMode):'translationAndOriginal'});return;
    }
    for(const [key,v] of orderedEntries(obj,path))if(!['sensitiveTranslationMemory','presentation','sourceRef','catalog'].includes(key))visit(v,[...path,key]);
  }
  visit(cv,[]);return parse(LanguagePlanSchema,{cvId:cv.id,baseRevision:cv.revision,sourceLocale:cv.documentLocale,targetLocale,fields,preserved});
}
export function validateLanguagePlan(base:CvDocument,input:unknown):LanguagePlan {
  assertDataTree(input);const plan=parse(LanguagePlanSchema,input),expected=buildLanguagePlan(base,plan.targetLocale);
  const immutable=(p:LanguagePlan)=>({...p,fields:p.fields.map(f=>f.class==='A'?{...f,reviewed:false,decision:'translate',segments:f.segments.map(s=>({...s,translation:s.source}))}:{...f,decision:'unreviewed',proposal:'',mode:'original'})});
  if(canonical(immutable(plan))!==canonical(immutable(expected)))fail('translation.planChanged');
  for(const item of plan.fields)if(item.class==='A'&&item.segments.some(s=>s.protected&&s.translation!==s.source))fail('translation.protectedChanged',item.path);
  return plan;
}
function applyNarrative(item:Extract<LanguageItem,{class:'A'}>,locale:'es'|'en'):NarrativeField|RichNarrative {
  if(!item.reviewed)fail('translation.reviewRequired',item.path);
  if(item.decision==='keepOriginal')return structuredClone(item.source);
  if(item.segments.some(s=>!s.protected&&!s.translation.trim()))fail('translation.missingText',item.path);
  const field=structuredClone(item.source),value=structuredClone(field.current.value),sourceText=typeof value==='string'?value:richText(value);
  const output=(start:number,end:number)=>item.segments.filter(s=>s.start>=start&&s.end<=end).map(s=>s.translation).join('');
  if(typeof value==='string')field.current.value=output(0,value.length) as never;
  else {for(const leaf of leaves(value))set(value,leaf.path,output(leaf.start,leaf.end));field.current.value=value as never;}
  // Map explicit span boundaries through translations. Protected text is never sent away or edited.
  const position=(offset:number)=>offset+item.segments.filter(s=>s.end<=offset).reduce((n,s)=>n+s.translation.length-s.source.length,0);
  field.protectedSpans=field.protectedSpans.map(s=>({...s,start:position(s.start),end:position(s.end)}));
  const nextText=typeof field.current.value==='string'?field.current.value:richText(field.current.value);
  for(const span of field.protectedSpans)if(nextText.slice(span.start,span.end)!==span.value)fail('translation.protectedChanged',item.path);
  // sourceText is also checked by the source snapshot equality in validateLanguagePlan.
  if(!sourceText.trim()||!nextText.trim())fail('translation.missingText',item.path);
  field.current.locale=locale;field.revision++;return field;
}
export function applyLanguagePlan(base:CvDocument,input:unknown,ctx:DomainContext):CvDocument {
  const plan=validateLanguagePlan(base,input),cv=structuredClone(base);
  for(const item of plan.fields){
    if(item.class==='A'){
      set(cv,item.path,applyNarrative(item,plan.targetLocale));
    }else{
      const field={...item.source,outputLocale:plan.targetLocale};let next:SensitiveField;
      if(item.decision==='keepOriginal')next=sensitiveReviewState(item.source,cv.sensitiveTranslationMemory)==='approved'?{...item.source,displayMode:'original'}:keepOriginal(field);
      else if(item.decision==='keepImported'&&!field.original)next=structuredClone(item.source);
      else if(item.decision==='approve'){
        if(item.mode==='original')fail('translation.invalidMode',item.path);
        const approved=approveSensitive(field,item.proposal,plan.targetLocale,ctx,item.mode);cv.sensitiveTranslationMemory[approved.approval.id]=approved.approval;next=approved.field;
      }else if(item.decision==='reuse'){
        const approval=item.approvalId?cv.sensitiveTranslationMemory[item.approvalId]:null;
        if(!approval||!approvalMatches(field,approval)||item.mode==='original'||item.proposal!==approval.value)fail('translation.approvalInvalid',item.path);
        next={...field,decision:'useApproval',approvalId:approval.id,displayMode:item.mode};
      }else fail('translation.reviewRequired',item.path);
      set(cv,item.path,next);
    }
  }
  cv.documentLocale=plan.targetLocale;return validateCv(cv);
}

export function classifyText(field:TextField,classification:'A'|'B'|'C',locale:string,ctx:DomainContext,fieldKind:string):TextField {
  if(field.class===classification)return structuredClone(field);
  // Reclassification is explicit; an imported unknown original must first be reviewed by import.
  if(field.class==='C'&&!field.original)fail('translation.classificationHasApproval');
  const value=plainText(field),sourceLocale=field.class==='A'?field.current.locale:field.class==='B'?field.locale:field.original!.locale;
  if(classification==='A')return {class:'A',current:{value,locale:sourceLocale},revision:1,protectedSpans:[]};
  if(classification==='B')return {class:'B',value,locale:sourceLocale,protection:'term'};
  return {class:'C',id:ctx.newId(),original:{value,locale:sourceLocale,revision:1},context:{fieldKind},outputLocale:locale,displayMode:'original',decision:'keepOriginal',approvalId:null,importedVisibleVariants:[]};
}
