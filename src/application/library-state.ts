import { z } from 'zod';
import {
  AssetMapSchema, IdSchema, Timestamp, TemplateSchema, WorkspaceSchema, RevisionSchema, Sha256,
  assertDataTree, parse, validateEntity, validateProject, referencedAssets, templateKey,
  canonical, validateResources, checkMap,
} from '../domain/index.js';
import type { Entity,ProjectValidationCache } from '../domain/index.js';
import type { FormDraft, LibraryContent, Resources, ProjectData } from './contracts.js';
import type { DraftChanges } from './library.js';
import { reject } from './contracts.js';

const refSchema = z.strictObject({ id: z.string().min(1), version: z.int().positive() });
const DraftSchema = z.strictObject({
  id: IdSchema, entityId: IdSchema, baseRevision: z.int().nonnegative(),
  baseSnapshot: z.unknown(), version: z.int().nonnegative(), createdAt: Timestamp, updatedAt: Timestamp,
  targetPath: z.array(z.string().max(200)).max(32), values: z.unknown().refine(v => v !== undefined,'draft.valuesRequired'),
  rawDateInputs: z.record(z.string().max(200), z.string().max(1000)),
  assetIds: z.array(IdSchema), templateRefs: z.array(refSchema),
});
const ChangesSchema = DraftSchema.pick({values:true,rawDateInputs:true,assetIds:true,templateRefs:true});
export function validateDraftChanges(value: unknown): DraftChanges {
  assertDataTree(value); return parse(ChangesSchema,value);
}
// Workspace/entity schemas and invariants are checked together by validateProject
// below. Do not parse every unchanged entity again before that complete pass.
const LibrarySchema = z.strictObject({workspace:z.unknown(),revisions:z.array(RevisionSchema),assetsById:AssetMapSchema,
  templates:z.array(TemplateSchema),blobs:z.map(Sha256,z.instanceof(Uint8Array)),drafts:z.array(z.unknown())});
export function currentEntities(s: LibraryContent): Entity[] {
  return [...(s.workspace.profile ? [s.workspace.profile] : []), ...Object.values(s.workspace.cvsById)];
}
export function findEntity(s: LibraryContent, id: string): Entity {
  const e = s.workspace.profile?.id === id ? s.workspace.profile : s.workspace.cvsById[id];
  return e ?? reject('ENTITY_NOT_FOUND');
}

// F2 projects require an exact dependency closure. Draft-only resources never enter it.
export function projectFromState(s: LibraryContent, cvId?: string): ProjectData {
  const entities = cvId ? [s.workspace.cvsById[cvId] ?? reject('CV_NOT_FOUND')] : currentEntities(s);
  const ownerIds = new Set(entities.map(e => e.id));
  const revisions = s.revisions.filter(r => ownerIds.has(r.entityId));
  const all = [...entities, ...revisions.map(r => r.snapshot)];
  const keys = new Set(all.filter(e => e.kind === 'cv').map(e => templateKey(e.presentation.templateRef)));
  const templates = s.templates.filter(t => keys.has(templateKey(t)));
  const assetIds = new Set<string>();
  all.forEach(e => referencedAssets(e).forEach(id => assetIds.add(id)));
  templates.forEach(t => t.resourceRefs.forEach(r => assetIds.add(r.assetId)));
  const resources = { revisions, templates, assetsById: Object.fromEntries([...assetIds].map(id => [id, s.assetsById[id]])) };
  const snapshot = validateProject(cvId ? { scope: 'cv', cv: entities[0], ...resources } : { scope: 'workspace', workspace: s.workspace, ...resources });
  const hashes = new Set(Object.values(snapshot.assetsById).map(a => a.sha256));
  return { snapshot, blobs: new Map([...hashes].map(hash => [hash, new Uint8Array(s.blobs.get(hash) ?? reject('ASSET_BYTES_MISSING'))])) };
}
export function validateDraft(value: unknown): FormDraft {
  assertDataTree(value);
  const d = parse(DraftSchema, value);
  const baseSnapshot = validateEntity(d.baseSnapshot);
  if (baseSnapshot.id !== d.entityId || baseSnapshot.revision !== d.baseRevision) reject('DRAFT_BASE_MISMATCH');
  if (d.updatedAt < d.createdAt || d.createdAt < baseSnapshot.updatedAt) reject('DRAFT_TIME_INVALID');
  if (new Set(d.assetIds).size !== d.assetIds.length || new Set(d.templateRefs.map(templateKey)).size !== d.templateRefs.length) reject('DRAFT_DUPLICATE_RESOURCE');
  // Keep invalid form input verbatim, with a bounded plain JSON envelope.
  if (new TextEncoder().encode(canonical(d)).length > 10 * 1024 * 1024) reject('DRAFT_TOO_LARGE');
  return { ...d, baseSnapshot };
}
export function validateLibrary(s: LibraryContent,memo?:ProjectValidationCache): LibraryContent {
  if(Array.isArray(s.drafts)&&s.drafts.length===0){
    // Without drafts the confirmed workspace IS the complete dependency closure.
    // One complete domain pass checks every field, identity, reference and history;
    // rebuilding a second project and parsing every CV again adds no protection.
    const p=validateProject({scope:'workspace',workspace:s.workspace,revisions:s.revisions,assetsById:s.assetsById,templates:s.templates},memo);
    parse(LibrarySchema.extend({revisions:z.array(z.unknown())}),s);
    const hashes=new Set(Object.values(p.assetsById).map(a=>a.sha256));
    if(hashes.size!==s.blobs.size||[...hashes].some(h=>!s.blobs.has(h)))reject('ASSET_BYTES_MISSING_OR_EXTRA');
    if(p.scope!=='workspace')reject('WORKSPACE_PROJECT_REQUIRED');
    return {workspace:p.workspace,revisions:p.revisions,assetsById:p.assetsById,templates:p.templates,blobs:structuredClone(s.blobs),drafts:[]};
  }
  assertDataTree({workspace:s.workspace,revisions:s.revisions,assetsById:s.assetsById,templates:s.templates,drafts:s.drafts});
  parse(LibrarySchema,s);
  checkMap(s.assetsById,['assetsById']);
  s.templates.forEach(t => parse(TemplateSchema, t)); s.revisions.forEach(r => parse(RevisionSchema, r));
  const owners = new Set(currentEntities(s).map(e => e.id));
  if (s.revisions.some(r => !owners.has(r.entityId))) reject('REVISION_OWNER_MISSING');
  const confirmed = projectFromState(s);
  const owned = new Set<string>();
  function collectIds(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(collectIds); return; }
    for (const [key,v] of Object.entries(value)) {
      if (['sourceRef','catalog','templateRef'].includes(key)) continue;
      if (key === 'id' && typeof v === 'string') owned.add(v); else collectIds(v);
    }
  }
  owned.add(s.workspace.id); currentEntities(s).forEach(collectIds); s.revisions.forEach(r => { owned.add(r.id); collectIds(r.snapshot); });
  s.drafts.forEach(d => { owned.add(d.id); collectIds(d.baseSnapshot); });
  if (Object.keys(s.assetsById).some(id => owned.has(id))) reject('ASSET_ID_COLLISION');
  const ids = new Set<string>([s.workspace.id, ...currentEntities(s).map(e => e.id), ...s.revisions.map(r => r.id), ...Object.keys(s.assetsById)]);
  const requiredAssets = new Set(Object.keys(confirmed.snapshot.assetsById));
  const requiredTemplates = new Set(confirmed.snapshot.templates.map(templateKey));
  for (const raw of s.drafts) {
    const d = validateDraft(raw), owner = findEntity(s, d.entityId);
    if (ids.has(d.id)) reject('DRAFT_ID_COLLISION'); ids.add(d.id);
    if (owner.kind !== d.baseSnapshot.kind || d.baseRevision > owner.revision) reject('DRAFT_OWNER_INVALID');
    // Current base snapshots must agree exactly; stale drafts remain recoverable, never auto-applied.
    if (d.baseRevision === owner.revision && canonical(d.baseSnapshot) !== canonical(owner)) reject('DRAFT_DIVERGENT_BASE');
    validateResources(d.baseSnapshot, s.assetsById, s.templates);
    referencedAssets(d.baseSnapshot).forEach(id => requiredAssets.add(id));
    if (d.baseSnapshot.kind === 'cv') requiredTemplates.add(templateKey(d.baseSnapshot.presentation.templateRef));
    for (const id of d.assetIds) { if (!s.assetsById[id]) reject('DRAFT_ASSET_MISSING'); requiredAssets.add(id); }
    for (const ref of d.templateRefs) requiredTemplates.add(templateKey(ref));
  }
  // Reuse F2 ownership/revision invariants for historical bases retained only by drafts.
  if(s.drafts.length)projectFromState({...s,revisions:[...s.revisions,...s.drafts.map(d => ({
    id:d.id,entityId:d.entityId,entityKind:d.baseSnapshot.kind,number:d.baseRevision,
    createdAt:d.createdAt,cause:'checkpoint' as const,retention:'ordinary' as const,snapshot:d.baseSnapshot,
  }))]});
  const templates = s.templates.filter(t => requiredTemplates.has(templateKey(t)));
  if (templates.length !== requiredTemplates.size) reject('TEMPLATE_MISSING');
  templates.forEach(t => t.resourceRefs.forEach(r => { if (!s.assetsById[r.assetId]) reject('TEMPLATE_ASSET_MISSING'); requiredAssets.add(r.assetId); }));
  if (requiredAssets.size !== Object.keys(s.assetsById).length || Object.keys(s.assetsById).some(id => !requiredAssets.has(id))) reject('ASSET_UNREFERENCED');
  if (requiredTemplates.size !== s.templates.length) reject('TEMPLATE_UNREFERENCED');
  const hashes = new Set(Object.values(s.assetsById).map(a => a.sha256));
  if (hashes.size !== s.blobs.size || [...hashes].some(h => !s.blobs.has(h))) reject('ASSET_BYTES_MISSING_OR_EXTRA');
  return structuredClone(s);
}
export function addResources(s: LibraryContent, r: Resources): void {
  // No incoming resources means there is no upload/dependency closure to check.
  // In particular, an ordinary text edit must not clone the entire library here.
  if(!Object.keys(r.assetsById??{}).length&&!r.templates?.length&&!r.blobs?.size)return;
  if (r.assetsById) { parse(AssetMapSchema,r.assetsById); checkMap(r.assetsById,['assetsById']); }
  for (const [id, asset] of Object.entries(r.assetsById ?? {})) {
    if (s.assetsById[id] && canonical(s.assetsById[id]) !== canonical(asset)) reject('ASSET_ID_CONFLICT');
    s.assetsById[id] = structuredClone(asset);
  }
  for (const t of r.templates ?? []) {
    parse(TemplateSchema,t);
    const old = s.templates.find(x => templateKey(x) === templateKey(t));
    if (old && canonical(old) !== canonical(t)) reject('TEMPLATE_VERSION_CONFLICT');
    if (!old) s.templates.push(structuredClone(t));
  }
  for (const [hash, bytes] of r.blobs ?? []) s.blobs.set(hash, new Uint8Array(bytes));
  // Reject unused incoming data instead of accepting an upload and silently dropping it.
  const required = structuredClone(s); collectUnused(required);
  if (Object.keys(r.assetsById ?? {}).some(id => !required.assetsById[id]) ||
      (r.templates ?? []).some(t => !required.templates.some(x => templateKey(x) === templateKey(t))) ||
      [...(r.blobs ?? new Map()).keys()].some(hash => !required.blobs.has(hash))) reject('RESOURCE_UNREFERENCED');
}
export function collectUnused(s: LibraryContent): void {
  const all = [...currentEntities(s), ...s.revisions.map(r => r.snapshot), ...s.drafts.map(d => d.baseSnapshot)];
  const keys = new Set(all.filter(e => e.kind === 'cv').map(e => templateKey(e.presentation.templateRef)));
  s.drafts.forEach(d => d.templateRefs.forEach(r => keys.add(templateKey(r))));
  s.templates = s.templates.filter(t => keys.has(templateKey(t)));
  const ids = new Set<string>(); all.forEach(e => referencedAssets(e).forEach(id => ids.add(id)));
  s.templates.forEach(t => t.resourceRefs.forEach(r => ids.add(r.assetId)));
  s.drafts.forEach(d => d.assetIds.forEach(id => ids.add(id)));
  s.assetsById = Object.fromEntries(Object.entries(s.assetsById).filter(([id]) => ids.has(id)));
  const hashes = new Set(Object.values(s.assetsById).map(a => a.sha256));
  s.blobs = new Map([...s.blobs].filter(([hash]) => hashes.has(hash)));
}
export function stateFromProject(data: ProjectData): LibraryContent {
  const snapshot = validateProject(data.snapshot);
  if (snapshot.scope !== 'workspace') reject('WORKSPACE_PROJECT_REQUIRED');
  return validateLibrary({ workspace: snapshot.workspace, revisions: snapshot.revisions, assetsById: snapshot.assetsById, templates: snapshot.templates, blobs: data.blobs, drafts: [] });
}
