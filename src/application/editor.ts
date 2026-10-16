import { z } from 'zod';
import { createSection, emptyPersonal, parse, NonBlank, validateCv, referencedAssets } from '../domain/index.js';
import type { Asset, CvDocument, DomainContext, TemplateDefinition } from '../domain/index.js';
import { DraftAutosaver } from './autosave.js';
import type { AutosaveStatus } from './autosave.js';
import type { FormDraft, Resources } from './contracts.js';
import { reject } from './contracts.js';
import type { LibraryService, CvSummary } from './library.js';
import { assertEditorScope, candidateFromForm, EditorTargetSchema, makeForm, newCoreEntry } from './editor-model.js';
import type { EditorForm, EditorTarget } from './editor-model.js';

// This is an editable document reference, not a final PDF template (F7).
const editorTemplate:TemplateDefinition = {id:'cvforge-core',version:1,rendererContractVersion:1,layout:'singleColumn',capabilities:['education','work'],resourceRefs:[]};
export interface EditorLibraryView {
  cvs:CvSummary[];
  profileName:string|null;
  recovery:{id:string;cvId:string;name:string;conflict:boolean}[];
}
export interface EditorDocumentView {cv:CvDocument;photo:PhotoView|null}
export interface PhotoView {mediaType:string;bytes:Uint8Array;crop:{x:number;y:number;width:number;height:number}}
interface ActiveForm { form:EditorForm; draft:FormDraft; autosaver:DraftAutosaver; resources:Resources }
export class CoreEditorService {
  private active:ActiveForm|null = null;
  constructor(private readonly library:LibraryService,private readonly ctx:DomainContext) {}
  async start():Promise<EditorLibraryView> {
    try { await this.library.snapshot(); } catch (error) {
      if ((error as {code?:string}).code !== 'LIBRARY_NOT_INITIALIZED') throw error;
      await this.library.initialize();
    }
    return this.list();
  }
  private idle():void { if (this.active) reject('EDITOR_FORM_OPEN'); }
  async list():Promise<EditorLibraryView> {
    const {content} = await this.library.snapshot();
    return {cvs:await this.library.listCvs(),profileName:content.workspace.profile?.personalInformation.displayName ?? null,
      recovery:(await this.library.recoverableDrafts()).map(({draft,conflict}) => ({id:draft.id,cvId:draft.entityId,name:content.workspace.cvsById[draft.entityId]?.name ?? 'Perfil',conflict}))};
  }
  async create(name:string,displayName:string):Promise<EditorDocumentView> {
    this.idle(); parse(NonBlank,name); const {content} = await this.library.snapshot();
    if (!content.workspace.profile) await this.library.createProfile(emptyPersonal(parse(NonBlank,displayName)));
    const profile = (await this.library.snapshot()).content.workspace.profile!;
    const cv = await this.library.createCv({name,documentLocale:'es',template:editorTemplate,sectionIds:[]},profile.revision);
    return this.open(cv.id);
  }
  async open(id:string):Promise<EditorDocumentView> {
    this.idle(); const cv = await this.library.openCv(id);
    return {cv,photo:await this.photo(cv)};
  }
  async photo(cv:CvDocument):Promise<PhotoView|null> {
    const placement = cv.personalInformation.photo;
    if (!placement) return null;
    const {content} = await this.library.snapshot();
    const asset = content.assetsById[placement.assetId] ?? this.active?.resources.assetsById?.[placement.assetId];
    if (!asset) reject('ASSET_NOT_FOUND');
    const bytes = content.blobs.get(asset.sha256) ?? this.active?.resources.blobs?.get(asset.sha256);
    if (!bytes) reject('ASSET_BYTES_MISSING');
    return {mediaType:asset.mediaType,bytes:new Uint8Array(bytes),crop:placement.crop};
  }
  async addSection(cvId:string,expectedRevision:number,kind:'education'|'work'):Promise<EditorDocumentView> {
    this.idle(); parse(z.enum(['education','work']),kind);
    const cv = await this.library.openCv(cvId), section = {...createSection(kind,this.ctx),entriesById:{},included:true};
    cv.sectionsById[section.id] = section; cv.sectionOrder.push(section.id);
    await this.library.confirmEntity(cv,expectedRevision); return this.open(cvId);
  }
  async begin(cvId:string,expectedRevision:number,target:EditorTarget|{kind:'newEntry';sectionId:string}):Promise<EditorForm> {
    this.idle();
    if ((await this.library.recoverableDrafts()).some(x=>x.draft.entityId===cvId)) reject('DRAFTS_PENDING');
    const cv = await this.library.openCv(cvId);
    let actual:EditorTarget;
    if (target.kind === 'newEntry') {
      const section = cv.sectionsById[target.sectionId];
      if (!section || (section.kind !== 'education' && section.kind !== 'work')) reject('EDITOR_SECTION_UNSUPPORTED');
      const entry = newCoreEntry(section.kind,this.ctx,cv.documentLocale);
      section.entriesById[entry.id] = entry; section.entryOrder!.push(entry.id);
      actual = {kind:'entry',sectionId:target.sectionId,entryId:entry.id};
    } else actual = parse(EditorTargetSchema,target);
    // Build before writing: an unsupported target must not leave an empty recovery item.
    const initial = makeForm(this.ctx.newId(),actual,cv);
    const draft = await this.library.beginDraft(cvId,expectedRevision,['f4',actual.kind]);
    initial.draftId = draft.id;
    const autosaver = new DraftAutosaver(this.library,draft);
    this.active = {form:initial,draft,autosaver,resources:{}};
    this.stage(initial); await autosaver.flush();
    return structuredClone(initial);
  }
  stage(input:EditorForm):void {
    const active = this.active ?? reject('EDITOR_NO_FORM');
    if (input.draftId !== active.draft.id || JSON.stringify(input.target) !== JSON.stringify(active.form.target)) reject('EDITOR_DRAFT_MISMATCH');
    assertEditorScope(validateCv(active.draft.baseSnapshot),input);
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
    return {form:structuredClone(active.form),photo:(await this.photo(active.form.cv))!};
  }
  status():{status:AutosaveStatus;error:boolean} {
    return {status:this.active?.autosaver.status ?? 'idle',error:!!this.active?.autosaver.lastError};
  }
  async flush():Promise<void> { await this.active?.autosaver.flush(); }
  async confirm(input:EditorForm):Promise<EditorDocumentView> {
    this.stage(input); const active = this.active!;
    await active.autosaver.flush();
    const candidate = candidateFromForm(validateCv(active.draft.baseSnapshot),active.form,this.ctx);
    const draft = (await this.library.recoverableDrafts()).find(x => x.draft.id === input.draftId)!.draft;
    await this.library.confirmDraft(draft.id,draft.version,candidate);
    await active.autosaver.finish(); this.active = null;
    return this.open(candidate.id);
  }
  async cancel():Promise<EditorDocumentView> {
    const active = this.active ?? reject('EDITOR_NO_FORM');
    await active.autosaver.cancel(); this.active = null;
    return this.open(active.form.cv.id);
  }
  async recover(id:string):Promise<{form:EditorForm;photo:PhotoView|null}> {
    this.idle(); const draft = await this.library.acceptRecovery(id);
    if (draft.targetPath[0] !== 'f4') reject('EDITOR_RECOVERY_UNSUPPORTED');
    const form = draft.values as EditorForm;
    if (form.draftId !== draft.id) reject('EDITOR_RECOVERY_INVALID');
    assertEditorScope(validateCv(draft.baseSnapshot),form);
    this.active = {form,draft,autosaver:new DraftAutosaver(this.library,draft),resources:{}};
    return {form:structuredClone(form),photo:await this.photo(form.cv)};
  }
  async discardRecovery(id:string):Promise<EditorLibraryView> {
    this.idle(); const draft = (await this.library.recoverableDrafts()).find(x => x.draft.id === id)?.draft ?? reject('DRAFT_NOT_FOUND');
    await this.library.discardDraft(draft.id,draft.version); return this.list();
  }
  async visibility(cvId:string,expectedRevision:number,sectionId:string,entryId:string|null,included:boolean):Promise<EditorDocumentView> {
    this.idle(); const cv = await this.library.openCv(cvId), section = cv.sectionsById[sectionId];
    if (!section || !['education','work'].includes(section.kind)) reject('EDITOR_SECTION_UNSUPPORTED');
    if (entryId) { const entry = section.entriesById[entryId] ?? reject('ENTRY_NOT_FOUND'); entry.included = included; }
    else section.included = included;
    await this.library.confirmEntity(cv,expectedRevision); return this.open(cvId);
  }
  async remove(cvId:string,expectedRevision:number,sectionId:string,entryId:string|null,confirm:true):Promise<EditorDocumentView> {
    this.idle(); if (confirm !== true) reject('DELETE_CONFIRMATION_REQUIRED');
    const cv = await this.library.openCv(cvId), section = cv.sectionsById[sectionId];
    if (!section || !['education','work'].includes(section.kind)) reject('EDITOR_SECTION_UNSUPPORTED');
    if (entryId) await this.library.deleteEntry(cvId,sectionId,entryId,expectedRevision,{confirm:true});
    else await this.library.deleteSection(cvId,sectionId,expectedRevision,{confirm:true});
    return this.open(cvId);
  }
  async close():Promise<void> { await this.active?.autosaver.finish(); await this.library.saveAndClose('preserveForRecovery'); }
}
