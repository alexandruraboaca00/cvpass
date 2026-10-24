import Database from 'better-sqlite3';
import { chmodSync, existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { canonical, referencedAssets, templateKey, ProjectValidationCache } from '../../domain/index.js';
import type { Asset, Entity, Revision, TemplateDefinition, Workspace } from '../../domain/index.js';
import type { BackupReceipt, FormDraft, LibraryContent, LibraryRecord, StorageHealth } from '../../application/contracts.js';
import { reject } from '../../application/contracts.js';
import { currentEntities, validateLibrary } from '../../application/library-state.js';
import { verifyAssetBytes } from '../asset-bytes.js';
import { decodeJson } from '../json.js';
import { checkStorageVersion, migrateStorage, privateSubdirectory } from './migrations.js';
import type { StorageMigration } from './migrations.js';
import { ExportRecordSchema } from '../../application/export-record.js';
import type { ExportRecord } from '../../application/export-record.js';
import { includeTimings, measure, timingEnabled } from '../../application/timing.js';

export const DATABASE_NAME = 'library.sqlite3';
function privateDirectory(input: string): string {
  const directory = resolve(input);
  let existing = directory;
  while (!existsSync(existing) && dirname(existing) !== existing) existing = dirname(existing);
  const physicalDirectory = resolve(realpathSync(existing),relative(existing,directory));
  // The trusted main process supplies userData/library; tests use a fresh temporary directory.
  for (let at = dirname(fileURLToPath(import.meta.url)); ; at = dirname(at)) {
    if (existsSync(join(at, '.git'))) {
      if (physicalDirectory === at || physicalDirectory.startsWith(at + '/')) reject('STORAGE_INSIDE_REPOSITORY');
      break;
    }
    if (dirname(at) === at) break;
  }
  if (existsSync(directory) && (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())) reject('STORAGE_UNSAFE_PATH');
  mkdirSync(directory, { recursive: true, mode: 0o700 }); chmodSync(directory, 0o700);
  return realpathSync(directory);
}
const json = <T>(text: string): T => decodeJson(new TextEncoder().encode(text)) as T;
const TABLES = ['entities', 'revisions', 'drafts', 'assets', 'blobs', 'templates'] as const;
type EntityRow = {id:string; kind:string; revision:number; workspace_id:string; name:string|null; locale:string|null; template_id:string|null; template_version:number|null; snapshot_json:string; model_version:number};
type RevisionRow = {id:string; entity_id:string; number:number; cause:string; retention:string; created_at:string; snapshot_json:string; model_version:number};
export interface EngineOptions {
  migrations?: readonly StorageMigration[];
  // Fault injection stays inside the adapter's tests, never in IPC/production worker messages.
  transactionProbe?: (stage: 'beforeWrite' | 'afterEntities' | 'beforeCommit', database: Database.Database) => void;
}
export class SqliteEngine {
  private cached: {record:LibraryRecord|null;dataVersion:number}|undefined;
  private readonly validationCache=new ProjectValidationCache();
  private constructor(private readonly db: Database.Database, private readonly directory: string, private readonly options: EngineOptions) {}
  static async open(directory: string, options: EngineOptions = {}): Promise<SqliteEngine> {
    const location = privateDirectory(directory), path = join(location, DATABASE_NAME);
    for (const name of [path, `${path}-wal`, `${path}-shm`]) {
      if (existsSync(name) && (!lstatSync(name).isFile() || lstatSync(name).isSymbolicLink())) reject('STORAGE_UNSAFE_PATH');
    }
    const db = new Database(path, { timeout: 5000 });
    try {
      checkStorageVersion(db, options.migrations);
      db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000');
      db.pragma('journal_mode = WAL'); db.pragma('synchronous = FULL');
      await migrateStorage(db, location, options.migrations);
      chmodSync(path, 0o600);
      const engine = new SqliteEngine(db, location, options);
      const health = engine.health();
      if (health.integrity.join(',') !== 'ok' || health.foreignKeyViolations) reject('STORAGE_INTEGRITY_FAILURE');
      engine.read(); // Revalidate domain, indexed metadata and byte integrity before exposing the library.
      engine.listExports();
      return engine;
    } catch (e) { db.close(); throw e; }
  }
  read(): LibraryRecord | null {
    // One writer owns this connection. External commits invalidate the validated
    // snapshot through SQLite data_version; callers always receive a fresh copy.
    const dataVersion=this.db.pragma('data_version',{simple:true}) as number;
    if(this.cached?.dataVersion===dataVersion)return structuredClone(this.cached.record);
    const record=this.db.transaction(() => {
      const row = this.db.prepare<[], {id:string; generation:number; settings_json:string; cv_order_json:string; model_version:number}>('SELECT * FROM workspace WHERE slot=1').get();
      if (!row) {
        if (TABLES.some(t => Number(this.db.prepare(`SELECT count(*) AS n FROM ${t}`).pluck().get()))) reject('STORAGE_ORPHAN_DATA');
        return null;
      }
      if (row.model_version !== 1) reject('STORAGE_UNSUPPORTED_MODEL');
      const entityRows = this.db.prepare<[], EntityRow>('SELECT * FROM entities ORDER BY id').all();
      const entities = entityRows.map(r => {
        const e = json<Entity>(r.snapshot_json);
        if (r.model_version !== 1 || e.id !== r.id || e.kind !== r.kind || e.revision !== r.revision || r.workspace_id !== row.id ||
            (e.kind === 'cv' && (e.name !== r.name || e.documentLocale !== r.locale || e.presentation.templateRef.id !== r.template_id || e.presentation.templateRef.version !== r.template_version))) reject('STORAGE_INDEX_MISMATCH');
        return e;
      });
      const workspace: Workspace = { id: row.id, profile: entities.find(e => e.kind === 'profile') as Workspace['profile'] ?? null,
        cvsById: Object.fromEntries(entities.filter(e => e.kind === 'cv').map(e => [e.id, e])), cvOrder: json(row.cv_order_json), settings: json(row.settings_json) };
      const revisions = this.db.prepare<[], RevisionRow>('SELECT * FROM revisions ORDER BY rowid').all().map(r => {
        if (r.model_version !== 1) reject('STORAGE_UNSUPPORTED_MODEL');
        const snapshot = json<Entity>(r.snapshot_json);
        return { id:r.id, entityId:r.entity_id, entityKind:snapshot.kind, number:r.number, cause:r.cause, retention:r.retention, createdAt:r.created_at, snapshot } as Revision;
      });
      const assetsById = Object.fromEntries(this.db.prepare<[], {id:string; sha256:string; metadata_json:string}>('SELECT * FROM assets').all().map(r => {
        const a = json<Asset>(r.metadata_json); if (a.id !== r.id || a.sha256 !== r.sha256) reject('STORAGE_INDEX_MISMATCH'); return [a.id, a];
      }));
      const templates = this.db.prepare<[], {id:string; version:number; definition_json:string}>('SELECT * FROM templates ORDER BY rowid').all().map(r => {
        const t = json<TemplateDefinition>(r.definition_json); if (t.id !== r.id || t.version !== r.version) reject('STORAGE_INDEX_MISMATCH'); return t;
      });
      const drafts = this.db.prepare<[], {id:string; entity_id:string; base_revision:number; version:number; draft_json:string}>('SELECT * FROM drafts ORDER BY rowid').all().map(r => {
        const d = json<FormDraft>(r.draft_json);
        if (d.id !== r.id || d.entityId !== r.entity_id || d.baseRevision !== r.base_revision || d.version !== r.version) reject('STORAGE_INDEX_MISMATCH'); return d;
      });
      const blobs = new Map(this.db.prepare<[], {sha256:string; bytes:Buffer}>('SELECT sha256,bytes FROM blobs').all().map(r => [r.sha256, new Uint8Array(r.bytes)]));
      // Populate exact-value validation reuse while opening the library, not
      // on the first interactive confirmation. External changes take this same
      // full-validation path before any cached data can be reused.
      const content = validateLibrary({ workspace, revisions, assetsById, templates, blobs, drafts },this.validationCache);
      for (const a of Object.values(content.assetsById)) verifyAssetBytes(a, blobs.get(a.sha256)!);
      this.checkReferences(content);
      return { generation:row.generation, content };
    })();
    this.cached={record:structuredClone(record),dataVersion};
    return record;
  }
  readVersion():{generation:number|null;dataVersion:number}{
    return {generation:(this.db.prepare('SELECT generation FROM workspace WHERE slot=1').pluck().get() as number|undefined)??null,dataVersion:this.db.pragma('data_version',{simple:true}) as number};
  }
  private checkReferences(s: LibraryContent): void {
    const expected: Record<string, string[]> = {
      entity_assets: currentEntities(s).flatMap(e => [...referencedAssets(e)].map(id => canonical([e.id, id]))),
      revision_assets: s.revisions.flatMap(r => [...referencedAssets(r.snapshot)].map(id => canonical([r.id, id]))),
      template_assets: s.templates.flatMap(t => [...new Set(t.resourceRefs.map(r => r.assetId))].map(id => canonical([t.id, t.version, id]))),
      draft_assets: s.drafts.flatMap(d => [...new Set([...d.assetIds, ...referencedAssets(d.baseSnapshot)])].map(id => canonical([d.id, id]))),
      draft_templates: s.drafts.flatMap(d => {
        const refs = new Map(d.templateRefs.map(t => [templateKey(t), t]));
        if (d.baseSnapshot.kind === 'cv') refs.set(templateKey(d.baseSnapshot.presentation.templateRef), d.baseSnapshot.presentation.templateRef);
        return [...refs.values()].map(t => canonical([d.id,t.id,t.version]));
      }),
    };
    for (const [table, keys] of Object.entries(expected)) {
      const actual = this.db.prepare(`SELECT * FROM ${table}`).raw().all().map(r => canonical(r)).sort();
      if (canonical(actual) !== canonical(keys.sort())) reject('STORAGE_REFERENCE_INDEX_MISMATCH');
    }
  }
  commit(expectedGeneration: number | null, input: LibraryContent): number {
    const s = measure('storage.validation',()=>validateLibrary(input,this.validationCache));
    measure('storage.assetIntegrity',()=>{for (const a of Object.values(s.assetsById)) verifyAssetBytes(a, s.blobs.get(a.sha256)!);});
    // SQLite stores JSON values, not canonical strings/hashes. Ordering keys is
    // unnecessary here; full schema/graph validation above preserves rejection
    // of values JSON would otherwise silently coerce or discard.
    const encode=(value:unknown)=>measure('storage.serialization',()=>JSON.stringify(value));
    const trace=timingEnabled(),transactionStart=performance.now();let bodyMs=0;
    const dataVersion=this.db.pragma('data_version',{simple:true}) as number;
    const generation=this.db.transaction(() => {
      const bodyStart=performance.now();
      const generation = this.db.prepare<[], {generation:number}>('SELECT generation FROM workspace WHERE slot=1').get()?.generation ?? null;
      if (generation !== expectedGeneration) reject('LIBRARY_CONFLICT');
      const next = (generation ?? -1) + 1;
      const oldWorkspace=this.db.prepare('SELECT id FROM workspace WHERE slot=1').pluck().get();
      if(oldWorkspace&&oldWorkspace!==s.workspace.id)this.db.exec('DELETE FROM exports');
      this.options.transactionProbe?.('beforeWrite',this.db);
      // Remove dependency indexes first. They are rebuilt in the same transaction.
      for (const table of ['entity_assets','revision_assets','template_assets','draft_assets','draft_templates']) this.db.exec(`DELETE FROM ${table}`);
      // Keep entities/revisions until dependency rows are gone; replacement is atomic to readers.
      this.db.exec('DELETE FROM drafts; DELETE FROM revisions; DELETE FROM entities; DELETE FROM templates; DELETE FROM assets; DELETE FROM workspace;');
      this.db.prepare('INSERT INTO workspace VALUES (1,?,?,?,?,1)').run(s.workspace.id, next, encode(s.workspace.settings), encode(s.workspace.cvOrder));
      const insertBlob = this.db.prepare('INSERT INTO blobs VALUES (?,?,?) ON CONFLICT(sha256) DO NOTHING');
      for (const [hash, bytes] of s.blobs) insertBlob.run(hash, bytes.length, bytes);
      const insertAsset = this.db.prepare('INSERT INTO assets VALUES (?,?,?)');
      Object.values(s.assetsById).forEach(a => insertAsset.run(a.id, a.sha256, encode(a)));
      const insertTemplate = this.db.prepare('INSERT INTO templates VALUES (?,?,?)');
      s.templates.forEach(t => insertTemplate.run(t.id, t.version, encode(t)));
      const insertEntity = this.db.prepare('INSERT INTO entities VALUES (?,?,?,?,?,?,?,?,?,1)');
      currentEntities(s).forEach(e => insertEntity.run(e.id, s.workspace.id, e.kind, e.revision, e.kind === 'cv' ? e.name : null, e.kind === 'cv' ? e.documentLocale : null,
        e.kind === 'cv' ? e.presentation.templateRef.id : null, e.kind === 'cv' ? e.presentation.templateRef.version : null, encode(e)));
      this.options.transactionProbe?.('afterEntities',this.db);
      const insertRevision = this.db.prepare('INSERT INTO revisions VALUES (?,?,?,?,?,?,?,1)');
      s.revisions.forEach(r => insertRevision.run(r.id,r.entityId,r.number,r.cause,r.retention,r.createdAt,encode(r.snapshot)));
      const insertDraft = this.db.prepare('INSERT INTO drafts VALUES (?,?,?,?,?)');
      s.drafts.forEach(d => insertDraft.run(d.id,d.entityId,d.baseRevision,d.version,encode(d)));
      const linkEntity = this.db.prepare('INSERT INTO entity_assets VALUES (?,?)');
      currentEntities(s).forEach(e => referencedAssets(e).forEach(id => linkEntity.run(e.id,id)));
      const linkRevision = this.db.prepare('INSERT INTO revision_assets VALUES (?,?)');
      s.revisions.forEach(r => referencedAssets(r.snapshot).forEach(id => linkRevision.run(r.id,id)));
      const linkTemplate = this.db.prepare('INSERT INTO template_assets VALUES (?,?,?)');
      s.templates.forEach(t => new Set(t.resourceRefs.map(r => r.assetId)).forEach(id => linkTemplate.run(t.id,t.version,id)));
      const linkDraft = this.db.prepare('INSERT INTO draft_assets VALUES (?,?)'), linkDraftTemplate = this.db.prepare('INSERT INTO draft_templates VALUES (?,?,?)');
      s.drafts.forEach(d => {
        new Set([...d.assetIds,...referencedAssets(d.baseSnapshot)]).forEach(id => linkDraft.run(d.id,id));
        const refs = new Map(d.templateRefs.map(t => [templateKey(t),t]));
        if (d.baseSnapshot.kind === 'cv') refs.set(templateKey(d.baseSnapshot.presentation.templateRef), d.baseSnapshot.presentation.templateRef);
        refs.forEach(t => linkDraftTemplate.run(d.id,t.id,t.version));
      });
      this.db.exec('DELETE FROM blobs WHERE sha256 NOT IN (SELECT sha256 FROM assets)');
      this.db.exec("DELETE FROM exports WHERE cv_id NOT IN (SELECT id FROM entities WHERE kind='cv')");
      this.options.transactionProbe?.('beforeCommit',this.db);
      if ((this.db.pragma('foreign_key_check') as unknown[]).length) reject('STORAGE_FOREIGN_KEY_FAILURE');
      bodyMs=performance.now()-bodyStart;return next;
    }).immediate();
    if(trace)includeTimings([{stage:'storage.transactionBody',ms:bodyMs},{stage:'storage.beginAndDurableCommit',ms:performance.now()-transactionStart-bodyMs}]);
    this.cached={record:{generation,content:s},dataVersion};
    return generation;
  }
  async backup(): Promise<BackupReceipt> {
    const name = `library-${randomUUID()}.sqlite3`, target = join(privateSubdirectory(this.directory, 'backups'), name);
    await this.db.backup(target); chmodSync(target, 0o600); return { name };
  }
  appendExport(input:ExportRecord):void {
    const r=ExportRecordSchema.parse(input);
    this.db.transaction(()=>{
      const owner=this.db.prepare<[string],{revision:number}>("SELECT revision FROM entities WHERE id=? AND kind='cv'").get(r.cvId);
      if(!owner||owner.revision<r.revision)reject('EXPORT_RECORD_OWNER_INVALID');
      this.db.prepare('INSERT INTO exports VALUES (?,?,?,?,?,?)').run(r.id,r.cvId,r.revision,r.exportedAt,r.sha256,canonical(r));
    }).immediate();
  }
  listExports(cvId?:string):ExportRecord[]{
    const rows=this.db.prepare<[],{id:string;cv_id:string;revision:number;exported_at:string;sha256:string;record_json:string}>('SELECT * FROM exports ORDER BY exported_at DESC,rowid DESC').all();
    return rows.map(row=>{
      const r=ExportRecordSchema.parse(json(row.record_json));
      if(r.id!==row.id||r.cvId!==row.cv_id||r.revision!==row.revision||r.exportedAt!==row.exported_at||r.sha256!==row.sha256)reject('STORAGE_EXPORT_INDEX_MISMATCH');return r;
    }).filter(r=>!cvId||r.cvId===cvId);
  }
  health(): StorageHealth {
    return { schemaVersion:Number(this.db.pragma('user_version',{simple:true})), sqliteVersion:String(this.db.prepare('SELECT sqlite_version()').pluck().get()),
      integrity:(this.db.pragma('integrity_check') as {integrity_check:string}[]).map(r => r.integrity_check), foreignKeyViolations:(this.db.pragma('foreign_key_check') as unknown[]).length,
      journalMode:String(this.db.pragma('journal_mode',{simple:true})), synchronous:Number(this.db.pragma('synchronous',{simple:true})),
      counts:Object.fromEntries(TABLES.map(t => [t, Number(this.db.prepare(`SELECT count(*) FROM ${t}`).pluck().get())])) };
  }
  close(): void { this.db.close(); }
}
