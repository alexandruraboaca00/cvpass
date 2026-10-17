import { A, B, CefrSchema, Locale, createSection, canonical } from '../../domain/index.js';
import type { Asset, CvDocument, CvEntry, CvSection, DomainContext, ImportIssue, RichNarrative, SensitiveField } from '../../domain/index.js';
import { newMvpEntry, parseDateInput } from '../../application/editor-model.js';
import { emptyImportDraft } from '../../application/import-draft.js';
import { importFail, importTemplate } from '../../application/import-contract.js';
import type { ImportDraft } from '../../application/import-contract.js';
import type { ProjectData } from '../../application/contracts.js';
import { makeAsset } from '../asset-bytes.js';
import { importRichText } from './rich-text.js';
import { attribute, child, children, parseXml, XML_NAMESPACES as NS } from './xml.js';
import type { XmlNode } from './xml.js';

export interface EuropassData {draft:ImportDraft;project:ProjectData}
const dateNamespaces=[NS.eu,NS.eures],descriptionNamespaces=[NS.eu,NS.oa];
export function adaptEuropass(bytes:Uint8Array,ctx:DomainContext,name:string):EuropassData{
  const root=parseXml(bytes);
  if(root.local!=='Candidate'||root.uri!==NS.eu)importFail('EUROPASS_STRUCTURE_UNSUPPORTED');
  const documentId=child(root,'DocumentID',[NS.hr]);
  if(!documentId||attribute(documentId,'schemeVersionID')!=='4.0')importFail('EUROPASS_VERSION_UNSUPPORTED');
  const profile=child(root,'CandidateProfile'),person=child(root,'CandidatePerson');
  if(!profile)importFail('EUROPASS_PROFILE_MISSING');
  const localeSource=attribute(profile,'languageCode')??'',canonicalLocale=Locale.safeParse(localeSource).success?Intl.getCanonicalLocales(localeSource)[0]!:null;
  const locale=canonicalLocale?.split('-')[0],draft=emptyImportDraft(ctx,locale==='es'||locale==='en'?locale:null,name),cv=draft.cv;
  const contentLocale=canonicalLocale??'und';draft.localeEvidence=localeSource?`CandidateProfile@languageCode=${localeSource}`:'';
  const used=new Set<XmlNode>(),usedAttributes=new Map<XmlNode,Set<string>>(),assetsById:Record<string,Asset>={},blobs=new Map<string,Uint8Array>();
  const markAttribute=(node:XmlNode,key:string,uri='')=>{const keys=usedAttributes.get(node)??new Set<string>();keys.add(uri+'|'+key);usedAttributes.set(node,keys);};
  const markTree=(node:XmlNode)=>{used.add(node);node.attributes.forEach(a=>markAttribute(node,a.local,a.uri));node.children.forEach(markTree);};
  const issue=(kind:ImportIssue['kind'],code:string,node:XmlNode|undefined,targetPath:string[]=[],preview?:string)=>{
    if(draft.issues.length>=1000)importFail('IMPORT_REPORT_LIMIT');
    draft.issues.push({kind,code,sourcePath:node?.path??root.path,targetPath,valuePreview:(preview??node?.text??'').slice(0,2048),resolution:kind==='ignored'?'informational':'pending'});
  };
  const text=(node:XmlNode|undefined,targetPath?:string[]):string|null=>{
    if(!node)return null;used.add(node);
    const value=node.text.trim();if(targetPath&&value)draft.mappings.push({sourcePath:node.path,targetPath});
    return value||null;
  };
  const attr=(node:XmlNode,key:string)=>{markAttribute(node,key);return attribute(node,key);};
  const scalar=(parent:XmlNode|undefined,tag:string,targetPath?:string[],uris:readonly string[]=[NS.eu])=>text(child(parent,tag,uris),targetPath);
  const literal=(node:XmlNode|undefined,path:string[],protection:'organization'|'term'='organization')=>{const value=text(node,path);return value?B(value,protection,contentLocale):null;};
  const sensitive=(value:string,fieldKind:string):SensitiveField=>({class:'C',id:ctx.newId(),original:{value,locale:contentLocale,revision:1},context:{fieldKind},outputLocale:contentLocale,displayMode:'original',decision:'keepOriginal',approvalId:null,importedVisibleVariants:[]});
  const rich=(node:XmlNode|undefined,path:string[]):RichNarrative|null=>{
    const value=text(node,path);if(!value)return null;
    const parsed=importRichText(value);if(parsed.degraded)issue('unsupported','HTML_FORMAT_REDUCED',node,path);
    return {class:'A',current:{value:parsed.doc,locale:contentLocale},revision:1,protectedSpans:[]};
  };
  const date=(node:XmlNode|undefined,path:string[]):ReturnType<typeof parseDateInput>=>{
    const formatted=child(node,'FormattedDateTime',[NS.hr])??node,value=text(formatted,path);
    if(!value)return null;draft.rawDates[path.join('.')]=value;
    try{return parseDateInput(value);}catch{issue('invalid','DATE_INVALID',formatted,path);return null;}
  };
  const period=(node:XmlNode|undefined,path:string[])=>{
    const start=date(child(node,'StartDate',dateNamespaces),[...path,'start']),end=date(child(node,'EndDate',dateNamespaces),[...path,'end']);
    const ongoingNode=child(node,'Ongoing')??child(node,'CurrentIndicator',[NS.hr]),flag=text(ongoingNode,[...path,'ongoing']);
    if(flag&&!['true','false','1','0'].includes(flag))issue('invalid','ONGOING_INVALID',ongoingNode,[...path,'ongoing']);
    const ongoing=flag==='true'||flag==='1';if(ongoing&&end)issue('invalid','ONGOING_WITH_END',node,path);
    return {start,end:ongoing?null:end,ongoing};
  };
  const links=(node:XmlNode,path:string[])=>children(node,'Link').flatMap((link,index)=>{
    const value=text(link,[...path,'links',String(index),'url']);if(!value)return [];
    try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw new Error();return [{id:ctx.newId(),label:null,url:value}];}
    catch{issue('invalid','LINK_INVALID',link,[...path,'links']);return [];}
  });
  const section=(kind:CvSection['kind'],title:CvSection['title']=null):CvSection=>{
    const result:CvSection={...createSection(kind,ctx,title),entriesById:{},included:true};cv.sectionsById[result.id]=result;cv.sectionOrder.push(result.id);return result;
  };
  const add=(section:CvSection,entry:CvEntry)=>{section.entriesById[entry.id]=entry;if(section.entryOrder)section.entryOrder.push(entry.id);};
  const path=(section:CvSection,entry:CvEntry)=>['sectionsById',section.id,'entriesById',entry.id,'fields'];
  used.add(root);markTree(documentId);markAttribute(profile,'languageCode');
  const supplier=child(root,'CandidateSupplier');if(supplier){markTree(supplier);issue('ignored','SOURCE_SUPPLIER_METADATA',supplier);}
  const sourceId=child(profile,'ID',[NS.hr]);if(sourceId){markTree(sourceId);issue('ignored','SOURCE_DOCUMENT_ID',sourceId);}
  if(!draft.documentLocale)issue('review','DOCUMENT_LOCALE_REQUIRED',profile,['documentLocale'],localeSource);
  if(person){
    const personName=child(person,'PersonName'),given=scalar(personName,'GivenName',['personalInformation','givenName'],[NS.oa]),family=scalar(personName,'FamilyName',['personalInformation','familyName'],[NS.hr]);
    cv.personalInformation.givenName=given;cv.personalInformation.familyName=family;cv.personalInformation.displayName=[given,family].filter(Boolean).join(' ');
    if(personName)draft.mappings.push({sourcePath:personName.path,targetPath:['personalInformation','displayName']});
    cv.personalInformation.birthDate=date(child(person,'BirthDate',[NS.hr]),['personalInformation','birthDate']);
    const p=cv.personalInformation,visible=cv.presentation.personalFieldVisibility;
    for(const node of children(person,'Communication')){
      const channel=scalar(node,'ChannelCode'),uri=scalar(node,'URI',undefined,[NS.oa]),label=scalar(node,'UseCode');
      if(channel==='Email'&&uri)p.contacts.push({id:ctx.newId(),kind:'email',label,value:uri});
      else if(channel==='Telephone'){
        const number=scalar(node,'DialNumber',undefined,[NS.oa]),prefix=scalar(node,'CountryDialing')??'';
        if(number)p.contacts.push({id:ctx.newId(),kind:'phone',label,prefix,number});
      }else if((channel==='Web'||channel==='Social Media')&&uri){
        const index=p.contacts.length;p.contacts.push({id:ctx.newId(),kind:channel==='Web'?'website':'social',label,value:uri});
        try{if(!['http:','https:'].includes(new URL(uri).protocol))throw new Error();}catch{issue('review','CONTACT_URL_REQUIRES_CORRECTION',child(node,'URI',[NS.oa]),['personalInformation','contacts',String(index),'value'],uri);}
      }
      const address=child(node,'Address');if(address){
        const id=ctx.newId(),addressPath=['personalInformation','addresses',String(p.addresses.length)];
        const lines=children(address,'AddressLine',[NS.oa]).flatMap(n=>{const t=text(n,[...addressPath,'lines']);return t?[t]:[];});
        const locality=scalar(address,'CityName',[...addressPath,'locality'],[NS.oa]),countryCode=scalar(address,'CountryCode',[...addressPath,'countryCode']),postalCode=scalar(address,'PostalCode',[...addressPath,'postalCode'],[NS.oa]);
        attr(address,'type');p.addresses.push({id,lines,locality,region:null,countryCode:countryCode?.toUpperCase()??null,postalCode,original:null});
      }
      // Contact mappings identify the source row even when its value needs correction.
      draft.mappings.push({sourcePath:node.path,targetPath:['personalInformation','contacts']});
    }
    visible.contacts=p.contacts.map(c=>c.id);visible.addresses=p.addresses.map(a=>a.id);
  }
  if(!cv.personalInformation.displayName)issue('review','DISPLAY_NAME_REQUIRED',person,['personalInformation','displayName']);

  const educations=children(child(profile,'EducationHistory'),'EducationOrganizationAttendance');
  if(educations.length){const s=section('education');for(const node of educations){
    const e=newMvpEntry('education',ctx,contentLocale);if(e.kind!=='education')throw new Error();const p=path(s,e),degree=child(node,'EducationDegree');
    const title=scalar(degree,'DegreeName',[...p,'title'],[NS.hr])??'';e.fields.title=sensitive(title,'qualification');if(!title)issue('review','TITLE_REQUIRED',node,[...p,'title']);
    e.fields.organization=literal(child(node,'OrganizationName',[NS.hr]),[...p,'organization']);e.fields.period=period(child(node,'AttendancePeriod'),[...p,'period']);
    const communications=children(child(node,'OrganizationContact'),'Communication'),comm=communications.find(c=>child(c,'Address'))??communications[0],address=child(comm,'Address');
    const city=scalar(address,'CityName',[...p,'location'],[NS.oa]),country=scalar(address,'CountryCode',[...p,'location']);e.fields.location=[city,country].filter(Boolean).join(', ')||null;
    for(const communication of communications){
      const uriNode=child(communication,'URI',[NS.oa]),uri=uriNode?.text.trim();
      if(uri){
        const target=!e.fields.web?[...p,'web']:[...p,'links',String(e.fields.links.length),'url'],value=text(uriNode,target)!;
        if(!e.fields.web)e.fields.web=value;else e.fields.links.push({id:ctx.newId(),label:null,url:value});
        scalar(communication,'ChannelCode');
        try{if(!['http:','https:'].includes(new URL(uri).protocol))throw new Error();}catch{issue('invalid','LINK_INVALID',uriNode,target);}
      }
      else scalar(communication,'ChannelCode');
    }
    const eqf=scalar(node,'EducationLevelCode',[...p,'eqf']);if(eqf){draft.rawNumbers[[...p,'eqf'].join('.')]=eqf;e.fields.eqf=/^[1-8]$/.test(eqf)?Number(eqf):null;if(e.fields.eqf===null)issue('invalid','EQF_INVALID',child(node,'EducationLevelCode'),[...p,'eqf']);}
    const study=child(child(child(degree,'FieldOfStudy'),'MainFieldOfStudy'),'ProgramConcentration');const studyText=text(study,[...p,'fieldOfStudy']);if(studyText)e.fields.fieldOfStudy=sensitive(studyText,'fieldOfStudy');
    const fields=child(degree,'FieldOfStudy');if(fields)attr(fields,'typeCode');
    e.fields.nationalClassification=scalar(degree,'NationalClassification',[...p,'nationalClassification']);
    const system=scalar(degree,'CreditType',[...p,'credits','system']),amount=scalar(degree,'NumberOfCredit',[...p,'credits','amount']);
    if(system&&amount&&/^\d+(?:\.\d+)?$/.test(amount))e.fields.credits={system,amount:Number(amount)};else if(system||amount)issue('invalid','CREDITS_INCOMPLETE',degree,[...p,'credits'],canonical({system,amount}));
    e.fields.description=rich(child(degree,'OccupationalSkillsCovered'),[...p,'description']);e.fields.links.push(...links(node,p));add(s,e);
  }}
  const employers=children(child(profile,'EmploymentHistory'),'EmployerHistory');
  if(employers.length){const s=section('work');for(const employer of employers)for(const node of children(employer,'PositionHistory')){
    const e=newMvpEntry('work',ctx,contentLocale);if(e.kind!=='work')throw new Error();const p=path(s,e),position=child(node,'PositionTitle');
    const title=text(position,[...p,'position'])??'';e.fields.position={class:'A',current:{value:title,locale:contentLocale},revision:1,protectedSpans:[]};if(!title)issue('review','TITLE_REQUIRED',node,[...p,'position']);
    if(position){attr(position,'languageID');attr(position,'typeCode');}
    e.fields.employer=literal(child(employer,'OrganizationName',[NS.hr]),[...p,'employer']);e.fields.period=period(child(node,'EmploymentPeriod',[NS.eures]),[...p,'period']);
    const organizationAddress=child(child(child(employer,'OrganizationContact'),'Communication'),'Address');
    const city=scalar(node,'City',[...p,'location'])??scalar(organizationAddress,'CityName',[...p,'location'],[NS.oa]);
    const country=scalar(node,'Country',[...p,'location'])??scalar(organizationAddress,'CountryCode',[...p,'location']);e.fields.location=[city,country].filter(Boolean).join(', ')||null;
    e.fields.description=rich(child(node,'Description',descriptionNamespaces),[...p,'description']);e.fields.links=links(node,p);add(s,e);
  }}
  const groups=children(child(profile,'Skills'),'SkillsGroup');
  if(groups.length){const s=section('skills');for(const node of groups){
    const title=scalar(node,'Title'),gid=title?ctx.newId():null;
    if(gid){s.groupsById[gid]={id:gid,name:A(title!,contentLocale),skillIds:[]};s.groupOrder.push(gid);draft.mappings.push({sourcePath:node.path,targetPath:['sectionsById',s.id,'groupsById',gid]});}
    for(const competency of children(node,'PersonCompetency')){
      const e=newMvpEntry('skill',ctx,contentLocale);if(e.kind!=='skill')throw new Error();const p=path(s,e),value=scalar(competency,'CompetencyName',[...p,'label'],[NS.hr])??'';
      e.fields.label={class:'B',value,locale:contentLocale,protection:'term'};e.fields.groupId=gid;add(s,e);
      if(gid)s.groupsById[gid]!.skillIds.push(e.id);else s.ungroupedSkillIds.push(e.id);
      const taxonomy=child(competency,'TaxonomyID',[NS.hr]);if(taxonomy){markTree(taxonomy);issue('ignored','SOURCE_TAXONOMY_RETAINED',taxonomy);}
      if(!value)issue('review','SKILL_REQUIRED',competency,[...p,'label']);
    }
  }}
  const native=children(person,'PrimaryLanguageCode'),foreign=children(child(profile,'PersonQualifications'),'PersonCompetency');
  const languageCode=(node:XmlNode|undefined,p:string[])=>{const value=text(node,p);if(!value)return {code:null,name:null};return Locale.safeParse(value).success?{code:Intl.getCanonicalLocales(value)[0]!,name:null}:{code:null,name:value};};
  if(native.length||foreign.length){const s=section('languages');
    for(const node of native){const e=newMvpEntry('nativeLanguage',ctx,contentLocale);if(e.kind!=='nativeLanguage')throw new Error();e.fields.language=languageCode(node,[...path(s,e),'language']);attr(node,'name');add(s,e);}
    const dimensions:Record<string,keyof Extract<CvEntry,{kind:'foreignLanguage'}>['fields']['proficiency']>={'CEF-Understanding-Listening':'listening','CEF-Understanding-Reading':'reading','CEF-Speaking-Interaction':'spokenInteraction','CEF-Speaking-Production':'spokenProduction','CEF-Writing-Production':'writing'};
    for(const node of foreign){
      const taxonomy=scalar(node,'TaxonomyID',undefined,[NS.hr]);if(taxonomy!=='language'){issue('unsupported','COMPETENCY_KIND_UNSUPPORTED',node);continue;}
      const e=newMvpEntry('foreignLanguage',ctx,contentLocale);if(e.kind!=='foreignLanguage')throw new Error();const p=path(s,e),identifier=child(node,'CompetencyID');e.fields.language=languageCode(identifier,[...p,'language']);if(identifier)attr(identifier,'schemeName');
      for(const dimension of children(node,'CompetencyDimension',[NS.eures])){
        const type=scalar(dimension,'CompetencyDimensionTypeCode',undefined,[NS.hr]),key=type?dimensions[type]:null,score=scalar(child(dimension,'Score',[NS.eures]),'ScoreText',undefined,[NS.hr]);
        if(!key){issue('unsupported','CEFR_DIMENSION_UNSUPPORTED',dimension);continue;}
        if(score&&!CefrSchema.safeParse(score).success){issue('invalid','CEFR_VALUE_INVALID',dimension,[...p,'proficiency',key]);continue;}
        if(e.fields.proficiency[key]!==null){issue('invalid','CEFR_DIMENSION_DUPLICATE',dimension,[...p,'proficiency',key]);continue;}
        e.fields.proficiency[key]=(score??null) as typeof e.fields.proficiency[typeof key];draft.mappings.push({sourcePath:dimension.path,targetPath:[...p,'proficiency',key]});
      }add(s,e);
    }
  }
  const certificates=children(child(profile,'CourseCertifications'),'CourseCertification');
  if(certificates.length){const s=section('certifications');for(const node of certificates){const e=newMvpEntry('certification',ctx,contentLocale);if(e.kind!=='certification')throw new Error();const p=path(s,e),title=scalar(node,'Title',[...p,'title'])??'';e.fields.title=sensitive(title,'certification');if(!title)issue('review','TITLE_REQUIRED',node,[...p,'title']);
    e.fields.issuer=literal(child(node,'IssuingOrganisation'),[...p,'issuer']);e.fields.learningMode=scalar(node,'ModeOfLearning',[...p,'learningMode']);e.fields.issued=date(child(node,'Date'),[...p,'issued']);e.fields.description=rich(child(node,'Description',descriptionNamespaces),[...p,'description']);e.fields.links=links(node,p);add(s,e);
  }}
  const projects=children(child(profile,'Projects'),'Project');
  if(projects.length){const s=section('projects');for(const node of projects){const e=newMvpEntry('project',ctx,contentLocale);if(e.kind!=='project')throw new Error();const p=path(s,e),title=scalar(node,'Title',[...p,'title'])??'';e.fields.title={class:'A',current:{value:title,locale:contentLocale},revision:1,protectedSpans:[]};e.fields.period=period(child(node,'Date'),[...p,'period']);e.fields.description=rich(child(node,'Description',descriptionNamespaces),[...p,'description']);e.fields.links=links(node,p);if(!title)issue('review','TITLE_REQUIRED',node,[...p,'title']);add(s,e);}}
  for(const node of children(profile,'Others')){
    const title=scalar(node,'Title')??'',s=section('custom',{class:'A',current:{value:title,locale:contentLocale},revision:1,protectedSpans:[]});draft.mappings.push({sourcePath:node.path,targetPath:['sectionsById',s.id,'title']});if(!title)issue('review','SECTION_TITLE_REQUIRED',node,['sectionsById',s.id,'title']);
    for(const other of children(node,'Other')){const e=newMvpEntry('custom',ctx,contentLocale);if(e.kind!=='custom')throw new Error();const p=path(s,e),entryTitle=scalar(other,'Title',[...p,'title'])??'';e.fields.title={class:'A',current:{value:entryTitle,locale:contentLocale},revision:1,protectedSpans:[]};e.fields.period=period(child(other,'Date'),[...p,'period']);e.fields.description=rich(child(other,'Description',descriptionNamespaces),[...p,'description']);e.fields.links=links(other,p);if(!entryTitle)issue('review','TITLE_REQUIRED',other,[...p,'title']);add(s,e);}
  }
  // Respect declared section sequence; unknown/non-MVP keys remain private report data.
  const design=child(child(root,'RenderingInformation'),'Design'),order=child(design,'SectionsOrder');
  const kinds:Record<string,CvSection['kind']>={'education-training':'education','work-experience':'work','profile-skills':'skills',language:'languages',certifications:'certifications',projects:'projects'};
  const ordered:string[]=[];for(const node of children(order,'Section')){const key=scalar(node,'Title');if(key&&kinds[key])for(const id of cv.sectionOrder)if(cv.sectionsById[id]!.kind===kinds[key]&&!ordered.includes(id))ordered.push(id);}
  cv.sectionOrder=[...ordered,...cv.sectionOrder.filter(id=>!ordered.includes(id))];
  if(design)issue('unsupported','ORIGINAL_LAYOUT_NOT_REPRODUCED',design,[], '');
  for(const node of children(profile,'Attachment',[NS.eures])){
    const type=scalar(node,'FileType',undefined,[NS.oa]),instructions=scalar(node,'Instructions',undefined,[NS.hr]),embedded=child(node,'EmbeddedData',[NS.oa]);
    if(type!=='photo'||instructions!=='ProfilePicture'){issue('unsupported','ATTACHMENT_ROLE_UNSUPPORTED',node);continue;}
    const value=text(embedded,['personalInformation','photo']);if(!value)continue;
    try{
      if(value.length>15*1024*1024)importFail('IMAGE_SIZE_LIMIT');
      let dataUri=value;if(!dataUri.startsWith('data:')){if(!/^[A-Za-z0-9+/=\s]+$/.test(value))throw new Error();dataUri=Buffer.from(value.replace(/\s/g,''),'base64').toString('utf8');}
      const match=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUri);if(!match)throw new Error();
      const normalized=match[2]!.replace(/\s/g,''),image=new Uint8Array(Buffer.from(normalized,'base64'));if(image.length>10*1024*1024||Buffer.from(image).toString('base64')!==normalized)throw new Error();
      if(cv.personalInformation.photo){issue('review','PHOTO_MULTIPLE',node,['personalInformation','photo']);continue;}
      const asset=makeAsset(ctx.newId(),image,'photo',match[1] as 'image/png'|'image/jpeg');assetsById[asset.id]=asset;blobs.set(asset.sha256,image);
      cv.personalInformation.photo={assetId:asset.id,crop:{x:0,y:0,width:1,height:1},visible:true};
    }catch{issue('invalid','PHOTO_INVALID',node,['personalInformation','photo'],'');}
  }
  // Every unconsumed meaningful leaf/attribute is reported, with its full original in the source asset.
  function remaining(node:XmlNode):void{
    if(node.text.trim()&&!used.has(node))issue('unsupported','FIELD_UNMAPPED',node);
    const attributes=node.attributes.filter(a=>!usedAttributes.get(node)?.has(a.uri+'|'+a.local));
    if(attributes.length)issue('unsupported','ATTRIBUTE_UNMAPPED',node,[],canonical(attributes));
    node.children.forEach(remaining);
  }remaining(root);
  if(draft.mappings.length>5000)importFail('IMPORT_REPORT_LIMIT');
  return {draft,project:{snapshot:{scope:'cv',cv,revisions:[],assetsById,templates:[importTemplate]},blobs}};
}
