import { z } from 'zod';
import { A, B, parse, richText, sensitiveFromVisible, createSection, canonical } from '../../domain/index.js';
import type { CvEntry, CvSection, DomainContext, ExportProjection, ImportIssue, RichNarrative, TextField } from '../../domain/index.js';
import { newMvpEntry } from '../../application/editor-model.js';
import { emptyImportDraft } from '../../application/import-draft.js';
import { importFail, importTemplate } from '../../application/import-contract.js';
import type { ImportDraft } from '../../application/import-contract.js';
import type { ProjectData } from '../../application/contracts.js';
import { decodeExportPayload, encodeExportPayload } from '../cvproj.js';
import { decodeJson, encodeJson } from '../json.js';
import { makeAsset, sha256 } from '../asset-bytes.js';

// The F2 payload remains unchanged. This optional transport adds a digest of its exact bytes.
const Envelope=z.strictObject({format:z.literal('cvforge-pdf-data'),containerFormatVersion:z.literal(1),byteLength:z.int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/),payloadBase64:z.base64()});
export function encodePdfAttachment(projection:ExportProjection):Uint8Array{
  const bytes=encodeExportPayload(projection);return encodeJson({format:'cvforge-pdf-data',containerFormatVersion:1,byteLength:bytes.length,sha256:sha256(bytes),payloadBase64:Buffer.from(bytes).toString('base64')});
}
export function readPdfPayload(bytes:Uint8Array):{projection:ExportProjection;integrity:'sha256'|'structural'}|null{
  let value:unknown;try{value=decodeJson(bytes);}catch{return null;}
  const format=(value as {format?:unknown})?.format;
  if(format==='cvforge-export-probe')importFail('CVFORGE_TECHNICAL_PROBE_UNSUPPORTED');
  if(format==='cvforge-pdf-data'){
    if((value as {containerFormatVersion?:unknown}).containerFormatVersion!==1)importFail('CVFORGE_CONTAINER_VERSION_UNSUPPORTED');
    const envelope=parse(Envelope,value),payload=new Uint8Array(Buffer.from(envelope.payloadBase64,'base64'));
    if(payload.length!==envelope.byteLength||sha256(payload)!==envelope.sha256||Buffer.from(payload).toString('base64')!==envelope.payloadBase64)importFail('CVFORGE_PAYLOAD_INTEGRITY');
    try{return {projection:decodeExportPayload(payload).projection,integrity:'sha256'};}catch{importFail('CVFORGE_PAYLOAD_INVALID');}
  }
  if(format!=='cvforge-export-payload')return null;
  if((value as {pdfPayloadFormatVersion?:unknown}).pdfPayloadFormatVersion!==1)importFail('CVFORGE_PAYLOAD_VERSION_UNSUPPORTED');
  try{return {projection:decodeExportPayload(bytes).projection,integrity:'structural'};}catch{importFail('CVFORGE_PAYLOAD_INVALID');}
}
type Values=ExportProjection['personal'][number]['values'];
type TextValue=Extract<Values[number],{type:'text'}>;
export function adaptPdfProjection(projection:ExportProjection,ctx:DomainContext,name:string,integrity:'sha256'|'structural'):{draft:ImportDraft;project:ProjectData}{
  const draft=emptyImportDraft(ctx,projection.locale,name),cv=draft.cv,assetsById:ProjectData['snapshot']['assetsById']={},blobs=new Map<string,Uint8Array>();
  draft.localeEvidence='ExportPayload.projection.locale';
  const issue=(code:string,path:string[],value='')=>draft.issues.push({kind:'review',code,sourcePath:'/projection/'+path.join('/'),targetPath:path,valuePreview:value.slice(0,2048),resolution:'pending'});
  const textValues=(values:Values)=>values.filter((v):v is TextValue=>v.type==='text');
  const plain=(values:Values):string=>textValues(values).map(v=>typeof v.value==='string'?v.value:richText(v.value)).join(' ');
  function text(values:Values,fieldKind:string):TextField{
    const texts=textValues(values),sensitive=texts.filter(v=>v.role==='original'||v.role==='translation');
    if(sensitive.length)return sensitiveFromVisible(sensitive.map(v=>({role:v.role as 'original'|'translation',value:typeof v.value==='string'?v.value:richText(v.value),locale:v.locale})),{fieldKind},ctx);
    const first=texts[0];if(!first)return {class:'A',current:{value:'',locale:projection.locale},revision:1,protectedSpans:[]};
    const value=typeof first.value==='string'?first.value:richText(first.value);
    return first.role==='literal'?B(value,'term',first.locale):A(value,first.locale);
  }
  function rich(values:Values):RichNarrative|null{
    const first=textValues(values)[0];if(!first)return null;
    const value=typeof first.value==='string'?{kind:'doc' as const,content:[{kind:'paragraph' as const,content:[{kind:'text' as const,text:first.value,marks:[]}]}]}:first.value;
    return {class:'A',current:{value,locale:first.locale},revision:1,protectedSpans:[]};
  }
  if(integrity==='structural')issue('PAYLOAD_WITHOUT_TRANSPORT_DIGEST',[]);
  const sourceTemplate=projection.presentation.templateRef;
  cv.presentation={...cv.presentation,...projection.presentation,templateRef:{id:importTemplate.id,version:importTemplate.version}};
  if(sourceTemplate.id!==importTemplate.id||sourceTemplate.version!==importTemplate.version)issue('PDF_TEMPLATE_NOT_AVAILABLE',['presentation','templateRef'],canonical(sourceTemplate));
  if(projection.documentTitle)cv.documentTitle=text(projection.documentTitle,'documentTitle');
  const p=cv.personalInformation,v=cv.presentation.personalFieldVisibility;
  // A PDF contains only included fields. No hidden values are reconstructed.
  for(const key of ['displayName','givenName','familyName','otherNames','headline','about','birthDate','nationalities','gender','identifiers'] as const)v[key]=false;
  for(const field of projection.personal){
    const value=plain(field.values),path=['personalInformation',field.field];draft.mappings.push({sourcePath:'/projection/personal/'+field.field,targetPath:path});
    if(['displayName','givenName','familyName','gender'].includes(field.field)){(p as unknown as Record<string,unknown>)[field.field]=value;v[field.field as 'displayName']=true;}
    else if(field.field==='otherNames'||field.field==='nationalities'){p[field.field]=textValues(field.values).map(v=>typeof v.value==='string'?v.value:richText(v.value));v[field.field]=true;}
    else if(field.field==='headline'){p.headline=text(field.values,'headline');v.headline=true;}
    else if(field.field==='about'){p.about=rich(field.values);v.about=true;}
    else if(field.field==='birthDate'){const date=field.values.find(v=>v.type==='date');if(date?.type==='date')p.birthDate=date.value;v.birthDate=true;}
    else if(field.field==='addresses')for(const value of textValues(field.values)){const original=typeof value.value==='string'?value.value:richText(value.value);p.addresses.push({id:ctx.newId(),lines:[],locality:null,region:null,countryCode:null,postalCode:null,original});}
    else if(field.field==='contacts')for(const item of textValues(field.values)){
      const value=typeof item.value==='string'?item.value:richText(item.value),id=ctx.newId();
      if(z.email().safeParse(value).success)p.contacts.push({id,kind:'email',label:null,value});
      else if(/^https?:\/\//i.test(value))p.contacts.push({id,kind:'website',label:null,value});
      else if(/^\+?[\d ()-]+$/.test(value))p.contacts.push({id,kind:'phone',label:null,prefix:'',number:value});
      else issue('CONTACT_KIND_REQUIRES_REVIEW',path,value);
    }
    else if(field.field==='identifiers')for(const item of textValues(field.values)){p.identifiers.push({id:ctx.newId(),label:'',value:typeof item.value==='string'?item.value:richText(item.value)});v.identifiers=true;issue('IDENTIFIER_PARTS_REQUIRE_REVIEW',path,value);}
    else if(field.field==='photo'){
      const imageRef=field.values.find(v=>v.type==='image'),image=imageRef?.type==='image'?projection.images.find(i=>i.sha256===imageRef.sha256):null;
      if(image){const bytes=new Uint8Array(Buffer.from(image.dataBase64,'base64')),asset=makeAsset(ctx.newId(),bytes,'photo','image/png');assetsById[asset.id]=asset;blobs.set(asset.sha256,bytes);p.photo={assetId:asset.id,crop:{x:0,y:0,width:1,height:1},visible:true};}
    }
  }
  v.contacts=p.contacts.map(c=>c.id);v.addresses=p.addresses.map(a=>a.id);
  if(!p.displayName){issue('DISPLAY_NAME_REQUIRED',['personalInformation','displayName']);}
  for(const [si,source] of projection.sections.entries()){
    const title=source.title?text(source.title,'sectionTitle'):source.kind==='custom'?{class:'A' as const,current:{value:'',locale:projection.locale},revision:1,protectedSpans:[]}:null;
    const s:CvSection={...createSection(source.kind,ctx,title),entriesById:{},included:true};cv.sectionsById[s.id]=s;cv.sectionOrder.push(s.id);
    const ids:string[]=[];
    for(const [ei,input] of source.entries.entries()){
      const e=newMvpEntry(input.kind,ctx,projection.locale),base=['sectionsById',s.id,'entriesById',e.id,'fields'];ids.push(e.id);s.entriesById[e.id]=e;if(s.entryOrder)s.entryOrder.push(e.id);
      for(const field of input.fields){
        const key=field.field,first=field.values[0]!,path=[...base,key];draft.mappings.push({sourcePath:`/projection/sections/${si}/entries/${ei}/${key}`,targetPath:path});
        if(key==='description'&&'description' in e.fields)e.fields.description=rich(field.values);
        else if(key==='links'&&'links' in e.fields)e.fields.links=field.values.flatMap(v=>v.type==='link'?[{id:ctx.newId(),label:v.label,url:v.url}]:[]);
        else if(key==='period'&&'period' in e.fields&&first.type==='period')e.fields.period=first.value;
        else if(key==='validity'&&e.kind==='education'&&first.type==='period')e.fields.validity=first.value;
        else if(key==='issued'&&e.kind==='certification'&&first.type==='date')e.fields.issued=first.value;
        else if(key==='proficiency'&&e.kind==='foreignLanguage'&&first.type==='cefr'){const {type,...levels}=first;e.fields.proficiency=levels;}
        else if(key==='language'&&(e.kind==='nativeLanguage'||e.kind==='foreignLanguage'))e.fields.language={code:null,name:plain(field.values)};
        else if(key==='title'&&e.kind==='education'){
          const f=text(field.values,'qualification');e.fields.title=f.class==='C'?f:sensitiveFromVisible([{role:'original',value:plain(field.values),locale:textValues(field.values)[0]?.locale??projection.locale}],{fieldKind:'qualification'},ctx);
        }
        else if(key==='position'&&e.kind==='work'){const f=text(field.values,'position');e.fields.position=f.class==='B'?A(f.value,f.locale):f;}
        else if(key==='label'&&e.kind==='skill')e.fields.label=text(field.values,'skill');
        else if(key==='title'&&['certification','project','custom'].includes(e.kind)&&'title' in e.fields)e.fields.title=text(field.values,e.kind);
        else if((key==='organization'&&e.kind==='education')||(key==='employer'&&e.kind==='work')||(key==='issuer'&&e.kind==='certification'))(e.fields as unknown as Record<string,unknown>)[key]=B(plain(field.values),'organization',textValues(field.values)[0]?.locale??'und');
        else if(['fieldOfStudy','thesis','sector','department'].includes(key))(e.fields as unknown as Record<string,unknown>)[key]=text(field.values,key);
        else if(key==='subjects'&&e.kind==='education')e.fields.subjects=field.values.map(v=>text([v],'subject'));
        else if(key==='eqf'&&e.kind==='education'&&first.type==='number')e.fields.eqf=first.value;
        else if(key==='credits'&&e.kind==='education'){const amount=field.values.find(v=>v.type==='number');if(amount?.type==='number')e.fields.credits={system:plain(field.values),amount:amount.value};}
        else if(key==='address'&&e.kind==='education')e.fields.address={id:ctx.newId(),lines:[],locality:null,region:null,postalCode:null,countryCode:null,original:plain(field.values)};
        else if(['location','grade','nationalClassification','web','contact','learningMode'].includes(key))(e.fields as unknown as Record<string,unknown>)[key]=plain(field.values);
        else issue('PAYLOAD_FIELD_REQUIRES_REVIEW',path,canonical(field.values));
      }
    }
    if(s.kind==='skills'){
      const grouped=new Set<number>();for(const group of source.groups){const gid=ctx.newId(),skillIds=group.entryIndices.map(i=>ids[i]!);s.groupsById[gid]={id:gid,name:text(group.name,'skillGroup'),skillIds};s.groupOrder.push(gid);for(const index of group.entryIndices){grouped.add(index);const e=s.entriesById[ids[index]!]!;if(e.kind==='skill')e.fields.groupId=gid;}}
      s.ungroupedSkillIds=ids.filter((_,i)=>!grouped.has(i));
    }
  }
  return {draft,project:{snapshot:{scope:'cv',cv,revisions:[],assetsById,templates:[importTemplate]},blobs}};
}
