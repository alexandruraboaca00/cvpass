import {canonical,createSection,emptyPersonal,parse,NonBlank,referencedAssets,validateProfile} from '../domain/index.js';
import type {Asset,DomainContext,Entity,MasterProfile,SectionKind,TemplateDefinition} from '../domain/index.js';
import {DraftAutosaver} from './autosave.js';
import type {FormDraft,Resources} from './contracts.js';
import {reject} from './contracts.js';
import type {LibraryService} from './library.js';
import {assertContentScope,candidateFromContent,makeContentForm,newMvpEntry} from './editor-model.js';
import type {ProfileEditorForm} from './editor-model.js';
import type {BeginEditorTarget} from './editor-contract.js';
import type {EditorDocumentView,PhotoView} from './editor.js';
import type {ProfileSelection} from './profile-selection.js';
export interface EditorProfileView {profile:MasterProfile;photo:PhotoView|null}
interface Active {form:ProfileEditorForm;draft:FormDraft;autosaver:DraftAutosaver;resources:Resources;lastStaged?:string}
// Same content forms and autosaver as CV editing, with a real MasterProfile.
// No presentation, visibility flags, documentLocale or PDF operation is added to it.
export class ProfileEditorService {
  private active:Active|null=null;
  constructor(private readonly library:LibraryService,private readonly ctx:DomainContext,private readonly photo:(entity:Entity)=>Promise<PhotoView|null>,private readonly resources:()=>Promise<{template:TemplateDefinition;resources:Resources}>){}
  hasActiveForm():boolean{return !!this.active;}
  private idle():void{if(this.active)reject('EDITOR_FORM_OPEN');}
  private async profile():Promise<MasterProfile>{return (await this.library.snapshot()).content.workspace.profile??reject('PROFILE_NOT_FOUND');}
  async profileOpen():Promise<EditorProfileView>{this.idle();const profile=await this.profile();return {profile,photo:await this.photo(profile)};}
  async profileCreate(name:string):Promise<EditorProfileView>{this.idle();await this.library.createProfile(emptyPersonal(parse(NonBlank,name)));return this.profileOpen();}
  async profileMaterialize(name:string,locale:'es'|'en',revision:number,selection:ProfileSelection):Promise<EditorDocumentView>{
    this.idle();
    const profile=await this.profile();if((await this.library.recoverableDrafts()).some(x=>x.draft.entityId===profile.id))reject('DRAFTS_PENDING');
    const catalog=await this.resources(),cv=await this.library.createCv({name,documentLocale:locale,template:catalog.template,sectionIds:selection.sections.map(s=>s.sectionId),contentSelection:selection},revision,catalog.resources);
    return {cv,photo:await this.photo(cv)};
  }
  async profileAddSection(revision:number,kind:Exclude<SectionKind,'custom'>):Promise<EditorProfileView>{
    this.idle();const profile=await this.profile(),section=createSection(kind,this.ctx);profile.sectionsById[section.id]=section;profile.sectionOrder.push(section.id);await this.library.confirmEntity(profile,revision);return this.profileOpen();
  }
  async profileBegin(revision:number,target:BeginEditorTarget,textLocale:'es'|'en'):Promise<ProfileEditorForm>{
    this.idle();const base=await this.profile(),profile=structuredClone(base);if(profile.revision!==revision)reject('REVISION_CONFLICT');
    if((await this.library.recoverableDrafts()).some(x=>x.draft.entityId===profile.id))reject('DRAFTS_PENDING');
    let actual;
    if(target.kind==='language')reject('EDITOR_PROFILE_TARGET');
    if(target.kind==='newEntry'){
      const section=profile.sectionsById[target.sectionId]??reject('SECTION_NOT_FOUND');if(section.kind==='skills')reject('EDITOR_SECTION_UNSUPPORTED');
      const kind=section.kind==='languages'?target.entryKind:section.kind==='certifications'?'certification':section.kind==='projects'?'project':section.kind;
      if(!kind||section.kind!=='languages'&&target.entryKind)reject('EDITOR_ENTRY_UNSUPPORTED');
      const {included,...entry}=newMvpEntry(kind,this.ctx,textLocale);section.entriesById[entry.id]=entry;section.entryOrder!.push(entry.id);actual={kind:'entry' as const,sectionId:section.id,entryId:entry.id};
    }else if(target.kind==='newCustomSection'){
      const section=createSection('custom',this.ctx,{class:'A',current:{value:'',locale:textLocale},revision:1,protectedSpans:[]});profile.sectionsById[section.id]=section;profile.sectionOrder.push(section.id);actual={kind:'section' as const,sectionId:section.id};
    }else actual=target;
    const form=makeContentForm(this.ctx.newId(),actual,profile,textLocale) as ProfileEditorForm;
    assertContentScope(base,form);
    const draft=await this.library.beginDraft(profile.id,revision,['profileEditor',actual.kind]);form.draftId=draft.id;
    this.active={form,draft,autosaver:new DraftAutosaver(this.library,draft),resources:{}};this.profileStage(form);await this.profileFlush();return structuredClone(form);
  }
  profileStage(form:ProfileEditorForm):void{
    const a=this.active??reject('EDITOR_NO_FORM');if(form.draftId!==a.draft.id||canonical(form.target)!==canonical(a.form.target)||form.textLocale!==a.form.textLocale)reject('EDITOR_DRAFT_MISMATCH');
    assertContentScope(validateProfile(a.draft.baseSnapshot),form);const fingerprint=canonical(form);if(fingerprint===a.lastStaged)return;
    a.form=structuredClone(form);a.lastStaged=fingerprint;const ids=[...referencedAssets(form.entity)],resources:Resources={assetsById:{},blobs:new Map()};
    for(const id of ids){const asset=a.resources.assetsById?.[id];if(asset){resources.assetsById![id]=asset;resources.blobs!.set(asset.sha256,a.resources.blobs!.get(asset.sha256)!);}}
    a.autosaver.schedule({values:form,rawDateInputs:form.rawDates,assetIds:ids,templateRefs:[]},resources);
  }
  async profileConfirm(form:ProfileEditorForm):Promise<EditorProfileView>{
    this.profileStage(form);const a=this.active!;await a.autosaver.flush();const candidate=candidateFromContent(validateProfile(a.draft.baseSnapshot),a.form,this.ctx);
    const profile=validateProfile(await this.library.confirmDraft(a.draft.id,a.autosaver.durableVersion,candidate));await a.autosaver.finish();this.active=null;return {profile,photo:await this.photo(profile)};
  }
  async profileCancel():Promise<EditorProfileView>{const a=this.active??reject('EDITOR_NO_FORM');await a.autosaver.cancel();this.active=null;return this.profileOpen();}
  async profilePhoto(asset:Asset,bytes:Uint8Array):Promise<{form:ProfileEditorForm;photo:PhotoView}>{
    const a=this.active??reject('EDITOR_NO_FORM');if(a.form.target.kind!=='personal')reject('EDITOR_PHOTO_TARGET');a.resources.assetsById??={};a.resources.blobs??=new Map();a.resources.assetsById[asset.id]=asset;a.resources.blobs.set(asset.sha256,new Uint8Array(bytes));
    a.form.entity.personalInformation.photo={assetId:asset.id,crop:{x:0,y:0,width:1,height:1},visible:true};this.profileStage(a.form);await a.autosaver.flush();return {form:structuredClone(a.form),photo:(await this.photo(a.form.entity))!};
  }
  async profileRecover(id:string):Promise<{form:ProfileEditorForm;photo:PhotoView|null}>{
    this.idle();const draft=await this.library.acceptRecovery(id);if(draft.targetPath[0]!=='profileEditor')reject('EDITOR_RECOVERY_UNSUPPORTED');const form=draft.values as ProfileEditorForm;
    if(form.draftId!==draft.id)reject('EDITOR_RECOVERY_INVALID');assertContentScope(validateProfile(draft.baseSnapshot),form);this.active={form,draft,autosaver:new DraftAutosaver(this.library,draft),resources:{}};return {form,photo:await this.photo(form.entity)};
  }
  async profileRemove(revision:number,sectionId:string,entryId:string|null,confirm:true):Promise<EditorProfileView>{
    this.idle();if(confirm!==true)reject('DELETE_CONFIRMATION_REQUIRED');const p=await this.profile(),s=p.sectionsById[sectionId]??reject('SECTION_NOT_FOUND');
    if(entryId){if(!s.entriesById[entryId])reject('ENTRY_NOT_FOUND');delete s.entriesById[entryId];if(s.kind==='skills'){s.ungroupedSkillIds=s.ungroupedSkillIds.filter(id=>id!==entryId);for(const g of Object.values(s.groupsById))g.skillIds=g.skillIds.filter(id=>id!==entryId);}else s.entryOrder=s.entryOrder!.filter(id=>id!==entryId);}
    else {delete p.sectionsById[sectionId];p.sectionOrder=p.sectionOrder.filter(id=>id!==sectionId);}
    await this.library.confirmEntity(p,revision);return this.profileOpen();
  }
  async profileRevisions(){const p=await this.profile();return (await this.library.listRevisions(p.id)).map(r=>({id:r.id,number:r.number,cause:r.cause,pinned:r.retention==='pinned'}));}
  async profileRestore(revision:number,id:string):Promise<EditorProfileView>{this.idle();const p=await this.profile();await this.library.restoreCheckpoint(p.id,id,revision);return this.profileOpen();}
  profileStatus(){return {status:this.active?.autosaver.status??'idle',error:!!this.active?.autosaver.lastError};}
  async profileFlush():Promise<void>{await this.active?.autosaver.flush();}
  async finish():Promise<void>{await this.active?.autosaver.finish();}
}
