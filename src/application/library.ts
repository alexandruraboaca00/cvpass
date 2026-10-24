import { selectProfileContent } from './profile-selection.js';
import type { ProfileSelection } from './profile-selection.js';
import { measure, measureAsync } from './timing.js';
import {
  checkpoint, createCvFromProfile, createProfile, parse, IdSchema, NonBlank,
  validateCv, validateEntity, validateProject, restoreCv,
} from '../domain/index.js';
import type { CvDocument, DomainContext, Entity, PersonalInformation, Revision, TemplateDefinition } from '../domain/index.js';
import type { BackupReceipt, FormDraft, LibraryContent, LibraryRecord, LibraryRepository, ProjectCodec, Resources, ProjectData } from './contracts.js';
import { reject } from './contracts.js';
import { addResources, collectUnused, findEntity, projectFromState, stateFromProject, validateDraft, validateDraftChanges, validateLibrary } from './library-state.js';
import { copyProjectIdentities } from './copies.js';

export type DraftChanges = Pick<FormDraft,'values'|'rawDateInputs'|'assetIds'|'templateRefs'>;
export interface CvSummary { id:string; name:string; revision:number; documentLocale:'es'|'en'; hasDraft:boolean }
export class LibraryService {
  constructor(private readonly repository: LibraryRepository, private readonly ctx: DomainContext, private readonly codec: ProjectCodec) {}
  private async loaded(): Promise<LibraryRecord> { return await this.repository.read() ?? reject('LIBRARY_NOT_INITIALIZED'); }
  async initialize(uiLocale: 'es'|'en' = 'es'): Promise<void> {
    if (await this.repository.read()) reject('LIBRARY_ALREADY_INITIALIZED');
    const content: LibraryContent = { workspace:{id:parse(IdSchema,this.ctx.newId()),profile:null,cvsById:{},cvOrder:[],settings:{uiLocale}},
      revisions:[],assetsById:{},templates:[],blobs:new Map(),drafts:[] };
    await this.repository.commit(null,validateLibrary(content));
  }
  async snapshot(): Promise<LibraryRecord> { return this.loaded(); }
  async setUiLocale(locale:'es'|'en'):Promise<void> {
    if(locale!=='es'&&locale!=='en')reject('UI_LOCALE_INVALID');
    const r=await this.loaded();r.content.workspace.settings.uiLocale=locale;await this.persist(r);
  }
  async health() { return this.repository.health(); }
  async listCvs(): Promise<CvSummary[]> {
    const {content:s} = await this.loaded();
    return s.workspace.cvOrder.map(id => {
      const cv = s.workspace.cvsById[id]!;
      return {id,name:cv.name,revision:cv.revision,documentLocale:cv.documentLocale,hasDraft:s.drafts.some(d => d.entityId === id)};
    });
  }
  async openCv(id: string): Promise<CvDocument> {
    return (await this.loaded()).content.workspace.cvsById[parse(IdSchema,id)] ?? reject('CV_NOT_FOUND');
  }
  async createProfile(personal: PersonalInformation, resources: Resources = {}): Promise<Entity> {
    const r = await this.loaded(), s = r.content;
    if (s.workspace.profile) reject('PROFILE_ALREADY_EXISTS');
    const profile = createProfile(personal,this.ctx); s.workspace.profile = profile; addResources(s,resources);
    await this.persist(r); return profile;
  }
  async createCv(options: {name:string;documentLocale:'es'|'en';template:TemplateDefinition;sectionIds:string[];contentSelection?:ProfileSelection}, expectedProfileRevision: number, resources:Resources = {}): Promise<CvDocument> {
    const r = await this.loaded(), s = r.content, profile = s.workspace.profile ?? reject('PROFILE_NOT_FOUND');
    if (profile.revision !== expectedProfileRevision) reject('REVISION_CONFLICT');
    const cv = createCvFromProfile(options.contentSelection?selectProfileContent(profile,options.contentSelection):profile,options,this.ctx);
    s.workspace.cvsById[cv.id] = cv; s.workspace.cvOrder.push(cv.id); addResources(s,resources);addResources(s,{templates:[options.template]});
    await this.persist(r); return cv;
  }
  private async persist(record: LibraryRecord): Promise<void> {
    measure('application.collectAssetsAndHistory',()=>collectUnused(record.content));
    // The repository validates the complete dependency closure before its atomic
    // commit. Entity edits are already validated above; avoid validating all
    // unchanged CV twice for every draft/save in a 100-document library.
    await measureAsync('application.persist',()=>this.repository.commit(record.generation,record.content));
  }
  private applyEntity(s: LibraryContent, input: unknown, expectedRevision: number, cause: Revision['cause'], resources: Resources, draftId?: string): Entity {
    const candidate = validateEntity(input), current = findEntity(s,candidate.id);
    if (current.revision !== expectedRevision || candidate.revision !== expectedRevision) reject('REVISION_CONFLICT');
    if (candidate.kind !== current.kind || candidate.createdAt !== current.createdAt) reject('ENTITY_IDENTITY_CHANGED');
    const previous = checkpoint(current,this.ctx,cause);
    if (cause === 'restore' || cause === 'import') previous.retention = 'pinned';
    s.revisions.push(previous);
    const next = validateEntity({...candidate,revision:current.revision+1,updatedAt:this.ctx.now()});
    if (next.kind === 'cv') s.workspace.cvsById[next.id] = next; else s.workspace.profile = next;
    if (draftId) s.drafts = s.drafts.filter(d => d.id !== draftId);
    addResources(s,resources); return next;
  }
  async confirmEntity(input: unknown, expectedRevision: number, resources: Resources = {}, cause: 'edit'|'beforeTranslation' = 'edit'): Promise<Entity> {
    const r = await this.loaded(), next = this.applyEntity(r.content,input,expectedRevision,cause,resources);
    await this.persist(r); return next;
  }
  async renameCv(id: string, name: string, expectedRevision: number): Promise<CvDocument> {
    const r = await this.loaded(), cv = r.content.workspace.cvsById[id] ?? reject('CV_NOT_FOUND');
    const next = this.applyEntity(r.content,{...cv,name:parse(NonBlank,name)},expectedRevision,'edit',{});
    await this.persist(r); return validateCv(next);
  }
  async duplicateCv(id: string, name: string, expectedRevision: number): Promise<CvDocument> {
    const r = await this.loaded(), source = r.content.workspace.cvsById[id] ?? reject('CV_NOT_FOUND');
    if (source.revision !== expectedRevision) reject('REVISION_CONFLICT');
    const project = copyProjectIdentities(projectFromState(r.content,id).snapshot,this.ctx);
    if (project.scope !== 'cv') reject('CV_PROJECT_REQUIRED');
    // Preserve historical snapshots exactly; renaming the copy is a new revision.
    const copy = project.cv;
    const before = checkpoint(copy,this.ctx,'import'); before.retention = 'pinned';
    const cv = validateCv({...copy,name:parse(NonBlank,name),revision:copy.revision+1,updatedAt:this.ctx.now()});
    r.content.workspace.cvsById[cv.id] = cv; r.content.workspace.cvOrder.push(cv.id);
    r.content.revisions.push(...project.revisions,before);
    await this.persist(r); return cv;
  }
  async createCheckpoint(id: string, expectedRevision: number, cause: 'checkpoint'|'beforeTranslation' = 'checkpoint'): Promise<Revision> {
    const r = await this.loaded(), entity = findEntity(r.content,id);
    if (entity.revision !== expectedRevision) reject('REVISION_CONFLICT');
    const revision = checkpoint(entity,this.ctx,cause); revision.retention = 'pinned';
    r.content.revisions.push(revision); await this.persist(r); return revision;
  }
  async listRevisions(id: string): Promise<Revision[]> {
    const s = (await this.loaded()).content; findEntity(s,id); return s.revisions.filter(r => r.entityId === id);
  }
  async restoreCheckpoint(id: string, revisionId: string, expectedRevision: number): Promise<Entity> {
    const r = await this.loaded(), current = findEntity(r.content,id);
    if (current.revision !== expectedRevision) reject('REVISION_CONFLICT');
    const revision = r.content.revisions.find(x => x.id === revisionId && x.entityId === id) ?? reject('REVISION_NOT_FOUND');
    const saved = checkpoint(current,this.ctx,'restore'); saved.retention = 'pinned';
    const next = current.kind === 'cv' ? restoreCv(current,revision,this.ctx) : validateEntity({...revision.snapshot,revision:current.revision+1,createdAt:current.createdAt,updatedAt:this.ctx.now()});
    r.content.revisions.push(saved);
    if (next.kind === 'cv') r.content.workspace.cvsById[next.id] = next; else r.content.workspace.profile = next;
    await this.persist(r); return next;
  }
  async deleteRevision(id: string, options: {confirm:true;allowPinned?:true}): Promise<void> {
    const r = await this.loaded(), revision = r.content.revisions.find(x => x.id === id) ?? reject('REVISION_NOT_FOUND');
    if (options.confirm !== true || (revision.retention === 'pinned' && options.allowPinned !== true)) reject('PINNED_REVISION_CONFIRMATION_REQUIRED');
    r.content.revisions = r.content.revisions.filter(x => x.id !== id); await this.persist(r);
  }
  async pruneOrdinaryRevisions(entityId: string, keep = 50): Promise<number> {
    if (!Number.isSafeInteger(keep) || keep < 0) reject('RETENTION_INVALID');
    const r = await this.loaded(); findEntity(r.content,entityId);
    const ordinary = r.content.revisions.filter(x => x.entityId === entityId && x.retention === 'ordinary').sort((a,b) => b.number-a.number || b.createdAt.localeCompare(a.createdAt));
    const removed = new Set(ordinary.slice(keep).map(x => x.id));
    r.content.revisions = r.content.revisions.filter(x => !removed.has(x.id)); await this.persist(r); return removed.size;
  }
  async deleteCv(id: string, expectedRevision: number, options: {confirm:true;deletePinnedHistory?:true;discardDrafts?:true}): Promise<void> {
    const r = await this.loaded(), s = r.content, cv = s.workspace.cvsById[id] ?? reject('CV_NOT_FOUND');
    if (cv.revision !== expectedRevision) reject('REVISION_CONFLICT');
    if (options.confirm !== true) reject('DELETE_CONFIRMATION_REQUIRED');
    if (s.drafts.some(d => d.entityId === id) && options.discardDrafts !== true) reject('DRAFTS_PENDING');
    if (s.revisions.some(x => x.entityId === id && x.retention === 'pinned') && options.deletePinnedHistory !== true) reject('PINNED_REVISION_CONFIRMATION_REQUIRED');
    delete s.workspace.cvsById[id]; s.workspace.cvOrder = s.workspace.cvOrder.filter(x => x !== id);
    s.revisions = s.revisions.filter(x => x.entityId !== id); s.drafts = s.drafts.filter(d => d.entityId !== id); await this.persist(r);
  }
  async deleteSection(cvId: string, sectionId: string, expectedRevision: number, options: {confirm:true}): Promise<CvDocument> {
    if (options.confirm !== true) reject('DELETE_CONFIRMATION_REQUIRED');
    const r = await this.loaded(), cv = structuredClone(r.content.workspace.cvsById[cvId] ?? reject('CV_NOT_FOUND'));
    if (!cv.sectionsById[sectionId]) reject('SECTION_NOT_FOUND');
    delete cv.sectionsById[sectionId]; cv.sectionOrder = cv.sectionOrder.filter(id => id !== sectionId);
    const next = this.applyEntity(r.content,cv,expectedRevision,'edit',{});
    await this.persist(r); return validateCv(next);
  }
  async deleteEntry(cvId: string, sectionId: string, entryId: string, expectedRevision: number, options: {confirm:true}): Promise<CvDocument> {
    if (options.confirm !== true) reject('DELETE_CONFIRMATION_REQUIRED');
    const r = await this.loaded(), cv = structuredClone(r.content.workspace.cvsById[cvId] ?? reject('CV_NOT_FOUND'));
    const section = cv.sectionsById[sectionId] ?? reject('SECTION_NOT_FOUND');
    const entry = section.entriesById[entryId] ?? reject('ENTRY_NOT_FOUND');
    delete section.entriesById[entryId];
    if (entry.kind === 'skill') {
      section.ungroupedSkillIds = section.ungroupedSkillIds.filter(id => id !== entryId);
      Object.values(section.groupsById).forEach(g => { g.skillIds = g.skillIds.filter(id => id !== entryId); });
    } else section.entryOrder = section.entryOrder!.filter(id => id !== entryId);
    const next = this.applyEntity(r.content,cv,expectedRevision,'edit',{}); await this.persist(r); return validateCv(next);
  }
  async deleteAsset(id: string): Promise<void> {
    const r = await this.loaded(); if (!r.content.assetsById[id]) reject('ASSET_NOT_FOUND');
    // Reachable bytes have no independent destructive delete. Remove their explicit references/history first.
    const before = Object.keys(r.content.assetsById).length; collectUnused(r.content);
    if (r.content.assetsById[id] || before === Object.keys(r.content.assetsById).length) reject('ASSET_IN_USE');
    await this.persist(r);
  }
  async beginDraft(entityId: string, expectedRevision: number, targetPath: string[] = []): Promise<FormDraft> {
    const r = await this.loaded(), entity = findEntity(r.content,entityId);
    if (entity.revision !== expectedRevision) reject('REVISION_CONFLICT');
    const at = this.ctx.now();
    const draft = validateDraft({id:this.ctx.newId(),entityId,baseRevision:entity.revision,baseSnapshot:entity,version:0,createdAt:at,updatedAt:at,targetPath,
      values:structuredClone(entity),rawDateInputs:{},assetIds:[],templateRefs:[]});
    r.content.drafts.push(draft); await this.persist(r); return draft;
  }
  async updateDraft(id: string, expectedVersion: number, changes: DraftChanges, resources: Resources = {}): Promise<FormDraft> {
    const validatedChanges = validateDraftChanges(changes);
    const r = await this.loaded(), index = r.content.drafts.findIndex(d => d.id === id);
    const previous = r.content.drafts[index] ?? reject('DRAFT_NOT_FOUND');
    if (previous.version !== expectedVersion) reject('DRAFT_CONFLICT');
    const next = validateDraft({...previous,...validatedChanges,version:previous.version+1,updatedAt:this.ctx.now()});
    r.content.drafts[index] = next; addResources(r.content,resources); await this.persist(r); return next;
  }
  async recoverableDrafts(): Promise<{draft:FormDraft;conflict:boolean}[]> {
    const s = (await this.loaded()).content;
    return s.drafts.map(draft => ({draft,conflict:findEntity(s,draft.entityId).revision !== draft.baseRevision}));
  }
  async acceptRecovery(id: string): Promise<FormDraft> {
    const s = (await this.loaded()).content, draft = s.drafts.find(d => d.id === id) ?? reject('DRAFT_NOT_FOUND');
    if (findEntity(s,draft.entityId).revision !== draft.baseRevision) reject('DRAFT_BASE_CONFLICT');
    return draft; // Explicit acceptance returns form data; it never confirms invalid/raw values.
  }
  async discardDraft(id: string, expectedVersion: number): Promise<void> {
    const r = await this.loaded(), draft = r.content.drafts.find(d => d.id === id) ?? reject('DRAFT_NOT_FOUND');
    if (draft.version !== expectedVersion) reject('DRAFT_CONFLICT');
    r.content.drafts = r.content.drafts.filter(d => d.id !== id); await this.persist(r);
  }
  async confirmDraft(id: string, expectedVersion: number, candidate: unknown, resources: Resources = {}, cause:'edit'|'beforeTranslation'='edit'): Promise<Entity> {
    const r = await this.loaded(), draft = r.content.drafts.find(d => d.id === id) ?? reject('DRAFT_NOT_FOUND');
    if (draft.version !== expectedVersion) reject('DRAFT_CONFLICT');
    const entity = validateEntity(candidate);
    if (entity.id !== draft.entityId) reject('DRAFT_TARGET_MISMATCH');
    const next = measure('application.checkpointAndApply',()=>this.applyEntity(r.content,entity,draft.baseRevision,cause,resources,id)); await this.persist(r); return next;
  }
  async exportCvproj(cvId?: string, acknowledgeDraftExclusion = false): Promise<Uint8Array> {
    const s = (await this.loaded()).content;
    if (s.drafts.some(d => !cvId || d.entityId === cvId) && !acknowledgeDraftExclusion) reject('DRAFTS_PENDING');
    return this.codec.encode(projectFromState(s,cvId),this.ctx.now());
  }
  async importCvproj(bytes: Uint8Array, options: {mode:'copyCv'|'emptyWorkspace'|'replaceWorkspace';confirmReplace?:true}): Promise<{cvId?:string;backup?:BackupReceipt}> {
    if (!['copyCv','emptyWorkspace','replaceWorkspace'].includes(options.mode)) reject('IMPORT_MODE_INVALID');
    // Parse/validate before any mutation or backup side effect.
    const data = this.codec.decode(bytes); validateProject(data.snapshot);
    if (options.mode === 'copyCv') {
      return {cvId:(await this.addImportedCv(data)).id};
    }
    return this.restoreImportedWorkspace(data,{mode:options.mode,...(options.confirmReplace?{confirmReplace:true as const}:{})});
  }
  // Called only by an explicit import confirmation; one commit owns CV/resources/history.
  async addImportedCv(data:ProjectData):Promise<CvDocument>{
    const project=copyProjectIdentities(validateProject(data.snapshot),this.ctx);
    if(project.scope!=='cv')reject('CV_PROJECT_REQUIRED');
    const r=await this.loaded();
    if(r.content.workspace.cvsById[project.cv.id]||r.content.workspace.profile?.id===project.cv.id)reject('COPY_ID_COLLISION');
    r.content.workspace.cvsById[project.cv.id]=project.cv;r.content.workspace.cvOrder.push(project.cv.id);
    r.content.revisions.push(...project.revisions);
    const imported=checkpoint(project.cv,this.ctx,'import');imported.retention='pinned';r.content.revisions.push(imported);
    addResources(r.content,{assetsById:project.assetsById,templates:project.templates,blobs:data.blobs});
    await this.persist(r);return project.cv;
  }
  async restoreImportedWorkspace(data:ProjectData,options:{mode:'emptyWorkspace'|'replaceWorkspace';confirmReplace?:true}):Promise<{backup?:BackupReceipt}>{
    if(!['emptyWorkspace','replaceWorkspace'].includes(options.mode))reject('IMPORT_MODE_INVALID');
    validateProject(data.snapshot);if(data.snapshot.scope!=='workspace')reject('WORKSPACE_PROJECT_REQUIRED');
    const r=await this.loaded();
    const content = stateFromProject(data);
    let backup: BackupReceipt | undefined;
    if (options.mode === 'emptyWorkspace') {
      if (r.content.workspace.profile || r.content.workspace.cvOrder.length || r.content.drafts.length) reject('WORKSPACE_NOT_EMPTY');
    } else {
      if (options.confirmReplace !== true) reject('REPLACE_CONFIRMATION_REQUIRED');
      backup = await this.repository.backup();
    }
    await this.repository.commit(r.generation,content);
    return backup ? {backup} : {};
  }
  async saveAndClose(draftDecision: 'preserveForRecovery'|'discard'): Promise<void> {
    if (draftDecision !== 'preserveForRecovery' && draftDecision !== 'discard') reject('DRAFT_DECISION_REQUIRED');
    const r = await this.loaded();
    if (draftDecision === 'discard' && r.content.drafts.length) { r.content.drafts = []; await this.persist(r); }
    await this.repository.close();
  }
}
