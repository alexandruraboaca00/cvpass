import { measure, measureAsync } from './timing.js';
import { z } from 'zod';
import { createSection, emptyPersonal, parse, NonBlank, validateCv, referencedAssets, SectionKindSchema, canonical } from '../domain/index.js';
import type { Asset, Entity, CvDocument, DomainContext, SectionKind, TemplateDefinition } from '../domain/index.js';
import { DraftAutosaver } from './autosave.js';
import type { AutosaveStatus } from './autosave.js';
import type { FormDraft, Resources } from './contracts.js';
import { reject } from './contracts.js';
import type { LibraryService, CvSummary } from './library.js';
import { assertEditorScope, candidateFromForm, EditorTargetSchema, makeForm, newMvpEntry } from './editor-model.js';
import type { EditorForm, EditorTarget } from './editor-model.js';
import type { BuiltinResources } from './render-contract.js';

// This is an editable document reference, not a final PDF template (F7).
const editorTemplate:TemplateDefinition = {id:'cvforge-core',version:2,rendererContractVersion:1,layout:'singleColumn',capabilities:[...SectionKindSchema.options],resourceRefs:[]};
export interface EditorLibraryView {
  cvs:CvSummary[];
  profileName:string|null;
  profileId:string|null;
  uiLocale:'es'|'en';
  recovery:{id:string;cvId:string;name:string;conflict:boolean}[];
}
export interface EditorDocumentView {cv:CvDocument;photo:PhotoView|null}
export interface PhotoView {mediaType:string;bytes:Uint8Array;dimensions:{width:number;height:number};crop:{x:number;y:number;width:number;height:number}}
interface ActiveForm { form:EditorForm; draft:FormDraft; autosaver:DraftAutosaver; resources:Resources;photo:PhotoView|null;photoAssetId:string|null;lastStaged?:string }
export class CoreEditorService {
  private active:ActiveForm|null = null;
  constructor(private readonly library:LibraryService,private readonly ctx:DomainContext,private readonly initialTemplate?:()=>Promise<BuiltinResources>) {}
  async start():Promise<EditorLibraryView> {
    try { await this.library.snapshot(); } catch (error) {
      if ((error as {code?:string}).code !== 'LIBRARY_NOT_INITIALIZED') throw error;
      await this.library.initialize();
    }
    return this.list();
  }
  private idle():void { if (this.active) reject('EDITOR_FORM_OPEN'); }
  hasActiveForm():boolean{return this.active!==null;}
  async list():Promise<EditorLibraryView> {
    const {content} = await this.library.snapshot();
    const pending=new Set(content.drafts.map(d=>d.entityId));
    return {cvs:content.workspace.cvOrder.map(id=>{const cv=content.workspace.cvsById[id]!;return {id,name:cv.name,revision:cv.revision,documentLocale:cv.documentLocale,hasDraft:pending.has(id)};}),profileName:content.workspace.profile?.personalInformation.displayName ?? null,profileId:content.workspace.profile?.id??null,uiLocale:content.workspace.settings.uiLocale,
      recovery:content.drafts.map(draft=>({id:draft.id,cvId:draft.entityId,name:content.workspace.cvsById[draft.entityId]?.name??'Perfil',conflict:(content.workspace.profile?.id===draft.entityId?content.workspace.profile:content.workspace.cvsById[draft.entityId])!.revision!==draft.baseRevision}))};
  }
  async setUiLocale(locale:'es'|'en'):Promise<EditorLibraryView> {
    await this.active?.autosaver.flush();await this.library.setUiLocale(locale);return this.list();
  }
  async duplicate(cvId:string,revision:number,name:string):Promise<EditorDocumentView> {
    this.idle();const copy=await this.library.duplicateCv(cvId,name,revision);return this.open(copy.id);
  }
  async revisions(cvId:string):Promise<{id:string;number:number;cause:string;pinned:boolean}[]> {
    return (await this.library.listRevisions(cvId)).filter(r=>r.cause==='beforeTranslation'||r.cause==='restore').map(r=>({id:r.id,number:r.number,cause:r.cause,pinned:r.retention==='pinned'}));
  }
  async restore(cvId:string,revision:number,checkpointId:string):Promise<EditorDocumentView> {
    this.idle();await this.library.restoreCheckpoint(cvId,checkpointId,revision);return this.open(cvId);
  }
  async create(name:string,displayName:string):Promise<EditorDocumentView> {
    this.idle(); parse(NonBlank,name); const {content} = await this.library.snapshot();
    const catalog=await this.initialTemplate?.();
    if (!content.workspace.profile) await this.library.createProfile(emptyPersonal(parse(NonBlank,displayName)));
    const profile = (await this.library.snapshot()).content.workspace.profile!;
    const cv = await this.library.createCv({name,documentLocale:'es',template:catalog?.template??editorTemplate,sectionIds:[]},profile.revision,catalog?.resources);
    return this.open(cv.id);
  }
  async open(id:string):Promise<EditorDocumentView> {
    this.idle(); const cv = await this.library.openCv(id);
    return {cv,photo:await this.photo(cv)};
  }
  async photo(cv:Entity):Promise<PhotoView|null> {
    const placement = cv.personalInformation.photo;
    if (!placement) return null;
    const {content} = await this.library.snapshot();
    const asset = content.assetsById[placement.assetId] ?? this.active?.resources.assetsById?.[placement.assetId];
    if (!asset) reject('ASSET_NOT_FOUND');
    const bytes = content.blobs.get(asset.sha256) ?? this.active?.resources.blobs?.get(asset.sha256);
    if (!bytes) reject('ASSET_BYTES_MISSING');
    return {mediaType:asset.mediaType,bytes:new Uint8Array(bytes),dimensions:asset.dimensions!,crop:placement.crop};
  }
  private prepareTemplate(cv:CvDocument):Resources {
    if(cv.presentation.templateRef.id==='cvforge-core'&&cv.presentation.templateRef.version===1&&Object.values(cv.sectionsById).some(s=>!['education','work'].includes(s.kind))){cv.presentation.templateRef={id:editorTemplate.id,version:editorTemplate.version};return {templates:[editorTemplate]};}
    return {};
  }
  async addSection(cvId:string,expectedRevision:number,kind:Exclude<SectionKind,'custom'>):Promise<EditorDocumentView> {
    this.idle(); parse(SectionKindSchema.exclude(['custom']),kind);
    const cv = await this.library.openCv(cvId), section = {...createSection(kind,this.ctx),entriesById:{},included:true};
    cv.sectionsById[section.id] = section; cv.sectionOrder.push(section.id);
    await this.library.confirmEntity(cv,expectedRevision,this.prepareTemplate(cv)); return this.open(cvId);
  }
  async begin(cvId:string,expectedRevision:number,target:EditorTarget|{kind:'newEntry';sectionId:string;entryKind?:'nativeLanguage'|'foreignLanguage'}|{kind:'newCustomSection'}):Promise<EditorForm> {
    this.idle();
    if ((await this.library.recoverableDrafts()).some(x=>x.draft.entityId===cvId)) reject('DRAFTS_PENDING');
    const cv = await this.library.openCv(cvId);
    let actual:EditorTarget;
    if (target.kind === 'newEntry') {
      const section = cv.sectionsById[target.sectionId];
      if (!section || section.kind==='skills') reject('EDITOR_SECTION_UNSUPPORTED');
      const kind=section.kind==='languages'?parse(z.enum(['nativeLanguage','foreignLanguage']),target.entryKind):section.kind==='certifications'?'certification':section.kind==='projects'?'project':section.kind;
      if(section.kind!=='languages'&&target.entryKind)reject('EDITOR_ENTRY_UNSUPPORTED');
      const entry = newMvpEntry(kind,this.ctx,cv.documentLocale);
      section.entriesById[entry.id] = entry; section.entryOrder!.push(entry.id);
      actual = {kind:'entry',sectionId:target.sectionId,entryId:entry.id};
    } else if(target.kind==='newCustomSection'){
      const section={...createSection('custom',this.ctx,{class:'A',current:{value:'',locale:cv.documentLocale},revision:1,protectedSpans:[]}),entriesById:{},included:true};
      cv.sectionsById[section.id]=section;cv.sectionOrder.push(section.id);actual={kind:'section',sectionId:section.id};
    } else actual = parse(EditorTargetSchema,target);
    // Build before writing: an unsupported target must not leave an empty recovery item.
    const initial = makeForm(this.ctx.newId(),actual,cv);
    const draft = await this.library.beginDraft(cvId,expectedRevision,['f5',actual.kind]);
    initial.draftId = draft.id;
    const autosaver = new DraftAutosaver(this.library,draft);
    this.active = {form:initial,draft,autosaver,resources:{},photo:await this.photo(cv),photoAssetId:cv.personalInformation.photo?.assetId??null};
    this.stage(initial); await autosaver.flush();
    return structuredClone(initial);
  }
  stage(input:EditorForm):void {
    const active = this.active ?? reject('EDITOR_NO_FORM');
    if (input.draftId !== active.draft.id || JSON.stringify(input.target) !== JSON.stringify(active.form.target)) reject('EDITOR_DRAFT_MISMATCH');
    assertEditorScope(validateCv(active.draft.baseSnapshot),input);
    const fingerprint=canonical(input);
    if(active.lastStaged===fingerprint)return;
    active.lastStaged=fingerprint;
    active.form = structuredClone(input);
    // Explicit resource references keep only the current draft photo reachable.
    const ids = [...referencedAssets(input.cv)];
    const resources:Resources = {assetsById:{},blobs:new Map()};
    for (const id of ids) {
      const asset = active.resources.assetsById?.[id];
      if (asset) { resources.assetsById![id] = asset; resources.blobs!.set(asset.sha256,active.resources.blobs!.get(asset.sha256)!); }
    }
    active.autosaver.schedule({values:input,rawDateInputs:input.rawDates,assetIds:ids,templateRefs:[]},resources);
  }
  async stagePhoto(asset:Asset,bytes:Uint8Array):Promise<{form:EditorForm;photo:PhotoView}> {
    const active = this.active ?? reject('EDITOR_NO_FORM');
    if (active.form.target.kind !== 'personal') reject('EDITOR_PHOTO_TARGET');
    active.resources.assetsById ??= {}; active.resources.blobs ??= new Map();
    active.resources.assetsById[asset.id] = asset; active.resources.blobs.set(asset.sha256,new Uint8Array(bytes));
    active.form.cv.personalInformation.photo = {assetId:asset.id,crop:{x:0,y:0,width:1,height:1},visible:true};
    this.stage(active.form); await active.autosaver.flush();
    active.photo=(await this.photo(active.form.cv))!;active.photoAssetId=asset.id;
    return {form:structuredClone(active.form),photo:active.photo};
  }
  status():{status:AutosaveStatus;error:boolean} {
    return {status:this.active?.autosaver.status ?? 'idle',error:!!this.active?.autosaver.lastError};
  }
  async flush():Promise<void> { await this.active?.autosaver.flush(); }
  async confirm(input:EditorForm):Promise<EditorDocumentView> {
    measure('editor.stageAndScope',()=>this.stage(input)); const active = this.active!;
    await measureAsync('editor.flushDraft',()=>active.autosaver.flush());
    const candidate = measure('editor.candidateValidation',()=>candidateFromForm(validateCv(active.draft.baseSnapshot),active.form,this.ctx));
    const confirmed=validateCv(await measureAsync('editor.durableConfirm',()=>this.library.confirmDraft(active.draft.id,active.autosaver.durableVersion,candidate,this.prepareTemplate(candidate),active.form.target.kind==='language'?'beforeTranslation':'edit')));
    await active.autosaver.finish(); this.active = null;
    // Return the exact durable result rather than re-reading all 100 documents.
    // Reuse only the immutable asset bytes captured by this form session.
    return measureAsync('editor.confirmResponse',async()=>({cv:confirmed,photo:!confirmed.personalInformation.photo?null:confirmed.personalInformation.photo.assetId===active.photoAssetId&&active.photo?{...active.photo,crop:confirmed.personalInformation.photo.crop}:await this.photo(confirmed)}));
  }
  async cancel():Promise<EditorDocumentView> {
    const active = this.active ?? reject('EDITOR_NO_FORM');
    await active.autosaver.cancel(); this.active = null;
    return this.open(active.form.cv.id);
  }
  async recover(id:string):Promise<{form:EditorForm;photo:PhotoView|null}> {
    this.idle(); const draft = await this.library.acceptRecovery(id);
    if (!['f4','f5'].includes(draft.targetPath[0]!)) reject('EDITOR_RECOVERY_UNSUPPORTED');
    const form = draft.values as EditorForm;
    if (form.draftId !== draft.id) reject('EDITOR_RECOVERY_INVALID');
    assertEditorScope(validateCv(draft.baseSnapshot),form);
    this.active = {form,draft,autosaver:new DraftAutosaver(this.library,draft),resources:{},photo:await this.photo(form.cv),photoAssetId:form.cv.personalInformation.photo?.assetId??null};
    return {form:structuredClone(form),photo:await this.photo(form.cv)};
  }
  async discardRecovery(id:string):Promise<EditorLibraryView> {
    this.idle(); const draft = (await this.library.recoverableDrafts()).find(x => x.draft.id === id)?.draft ?? reject('DRAFT_NOT_FOUND');
    await this.library.discardDraft(draft.id,draft.version); return this.list();
  }
  async visibility(cvId:string,expectedRevision:number,sectionId:string,entryId:string|null,included:boolean):Promise<EditorDocumentView> {
    this.idle(); const cv = await this.library.openCv(cvId), section = cv.sectionsById[sectionId];
    if (!section) reject('EDITOR_SECTION_UNSUPPORTED');
    if (entryId) { const entry = section.entriesById[entryId] ?? reject('ENTRY_NOT_FOUND'); entry.included = included; }
    else section.included = included;
    await this.library.confirmEntity(cv,expectedRevision); return this.open(cvId);
  }
  async remove(cvId:string,expectedRevision:number,sectionId:string,entryId:string|null,confirm:true):Promise<EditorDocumentView> {
    this.idle(); if (confirm !== true) reject('DELETE_CONFIRMATION_REQUIRED');
    const cv = await this.library.openCv(cvId), section = cv.sectionsById[sectionId];
    if (!section) reject('EDITOR_SECTION_UNSUPPORTED');
    if (entryId) await this.library.deleteEntry(cvId,sectionId,entryId,expectedRevision,{confirm:true});
    else await this.library.deleteSection(cvId,sectionId,expectedRevision,{confirm:true});
    return this.open(cvId);
  }
  async close():Promise<void> { await this.active?.autosaver.finish(); await this.library.saveAndClose('preserveForRecovery'); }
}
