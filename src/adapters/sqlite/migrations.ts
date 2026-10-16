import type Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, lstatSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { reject } from '../../application/contracts.js';

export const APPLICATION_ID = 0x43564647;
export const STORAGE_SCHEMA_VERSION = 2;
export interface StorageMigration { version: number; name: string; sql: string }
export const migrations: readonly StorageMigration[] = [
  { version: 1, name: 'confirmed-library', sql: `
    CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;
    CREATE TABLE workspace(
      slot INTEGER PRIMARY KEY CHECK(slot=1), id TEXT UNIQUE NOT NULL CHECK(length(id)=36),
      generation INTEGER NOT NULL CHECK(generation>=0), settings_json TEXT NOT NULL CHECK(json_valid(settings_json)),
      cv_order_json TEXT NOT NULL CHECK(json_valid(cv_order_json)), model_version INTEGER NOT NULL CHECK(model_version=1)
    ) STRICT;
    CREATE TABLE blobs(
      sha256 TEXT PRIMARY KEY CHECK(length(sha256)=64), byte_length INTEGER NOT NULL CHECK(byte_length>0),
      bytes BLOB NOT NULL CHECK(length(bytes)=byte_length)
    ) STRICT;
    CREATE TABLE assets(
      id TEXT PRIMARY KEY CHECK(length(id)=36), sha256 TEXT NOT NULL REFERENCES blobs(sha256) ON DELETE RESTRICT,
      metadata_json TEXT NOT NULL CHECK(json_valid(metadata_json))
    ) STRICT;
    CREATE INDEX assets_hash ON assets(sha256);
    CREATE TABLE templates(
      id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0), definition_json TEXT NOT NULL CHECK(json_valid(definition_json)),
      PRIMARY KEY(id,version)
    ) STRICT;
    CREATE TABLE template_assets(
      template_id TEXT NOT NULL, template_version INTEGER NOT NULL, asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      PRIMARY KEY(template_id,template_version,asset_id),
      FOREIGN KEY(template_id,template_version) REFERENCES templates(id,version) ON DELETE CASCADE
    ) STRICT;
    CREATE INDEX template_assets_asset ON template_assets(asset_id);
    CREATE TABLE entities(
      id TEXT PRIMARY KEY CHECK(length(id)=36), workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('profile','cv')), revision INTEGER NOT NULL CHECK(revision>=0),
      name TEXT, locale TEXT, template_id TEXT, template_version INTEGER,
      snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)), model_version INTEGER NOT NULL CHECK(model_version=1),
      CHECK((kind='cv' AND name IS NOT NULL AND length(trim(name))>0 AND locale IN ('es','en') AND template_id IS NOT NULL AND template_version IS NOT NULL)
         OR (kind='profile' AND name IS NULL AND locale IS NULL AND template_id IS NULL AND template_version IS NULL)),
      FOREIGN KEY(template_id,template_version) REFERENCES templates(id,version) ON DELETE RESTRICT
    ) STRICT;
    CREATE UNIQUE INDEX one_profile_per_workspace ON entities(workspace_id) WHERE kind='profile';
    CREATE INDEX library_names ON entities(workspace_id,kind,name);
    CREATE TABLE revisions(
      id TEXT PRIMARY KEY CHECK(length(id)=36), entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      number INTEGER NOT NULL CHECK(number>=0), cause TEXT NOT NULL CHECK(cause IN ('checkpoint','beforeTranslation','edit','restore','import')),
      retention TEXT NOT NULL CHECK(retention IN ('ordinary','pinned')), created_at TEXT NOT NULL,
      snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)), model_version INTEGER NOT NULL CHECK(model_version=1),
      CHECK(cause!='beforeTranslation' OR retention='pinned')
    ) STRICT;
    CREATE INDEX revision_owner_number ON revisions(entity_id,number DESC);
    CREATE INDEX revision_retention ON revisions(entity_id,retention);
    CREATE TABLE entity_assets(
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT, PRIMARY KEY(entity_id,asset_id)
    ) STRICT;
    CREATE INDEX entity_assets_asset ON entity_assets(asset_id);
    CREATE TABLE revision_assets(
      revision_id TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT, PRIMARY KEY(revision_id,asset_id)
    ) STRICT;
    CREATE INDEX revision_assets_asset ON revision_assets(asset_id);
  ` },
  { version: 2, name: 'recoverable-form-drafts', sql: `
    CREATE TABLE drafts(
      id TEXT PRIMARY KEY CHECK(length(id)=36), entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      base_revision INTEGER NOT NULL CHECK(base_revision>=0), version INTEGER NOT NULL CHECK(version>=0),
      draft_json TEXT NOT NULL CHECK(json_valid(draft_json))
    ) STRICT;
    CREATE INDEX draft_owner ON drafts(entity_id);
    CREATE TABLE draft_assets(
      draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT, PRIMARY KEY(draft_id,asset_id)
    ) STRICT;
    CREATE INDEX draft_assets_asset ON draft_assets(asset_id);
    CREATE TABLE draft_templates(
      draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE, template_id TEXT NOT NULL, template_version INTEGER NOT NULL,
      PRIMARY KEY(draft_id,template_id,template_version),
      FOREIGN KEY(template_id,template_version) REFERENCES templates(id,version) ON DELETE RESTRICT
    ) STRICT;
  ` },
];
const checksum = (m: StorageMigration): string => createHash('sha256').update(`${m.version}\n${m.name}\n${m.sql}`).digest('hex');
export function checkStorageVersion(db: Database.Database, steps: readonly StorageMigration[] = migrations): number {
  const version = Number(db.pragma('user_version', { simple: true }));
  const identity = Number(db.pragma('application_id', { simple: true }));
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  if (!version && !identity && !tables.length) return 0;
  if (identity !== APPLICATION_ID) reject('STORAGE_WRONG_FORMAT');
  if (version < 1 || version > STORAGE_SCHEMA_VERSION) reject('STORAGE_UNSUPPORTED_VERSION');
  const ledger = db.prepare<[], {version:number; name:string; checksum:string}>('SELECT version,name,checksum FROM schema_migrations ORDER BY version').all();
  if (ledger.length !== version) reject('MIGRATION_LEDGER_INVALID');
  for (let i = 0; i < version; i++) {
    const step = steps[i], row = ledger[i];
    if (!step || !row || row.version !== step.version || row.name !== step.name || row.checksum !== checksum(step)) reject('MIGRATION_CHECKSUM_MISMATCH');
  }
  return version;
}
export function privateSubdirectory(directory: string, name: 'backups' | 'migrations'): string {
  const path = join(directory, name);
  if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) reject('STORAGE_UNSAFE_PATH');
  mkdirSync(path, { recursive: true, mode: 0o700 }); chmodSync(path, 0o700); return path;
}
export async function migrateStorage(db: Database.Database, directory: string, steps: readonly StorageMigration[] = migrations): Promise<void> {
  const version = checkStorageVersion(db, steps);
  if (steps.some((step, index) => step.version !== index + 1) || steps.at(-1)?.version !== STORAGE_SCHEMA_VERSION) reject('MIGRATION_PLAN_INVALID');
  if (version === STORAGE_SCHEMA_VERSION) return;
  if (version) {
    // SQLite backup API includes committed WAL pages. Never copy a live main file alone.
    const target = join(privateSubdirectory(directory, 'migrations'), `before-v${version}-to-v${STORAGE_SCHEMA_VERSION}-${randomUUID()}.sqlite3`);
    await db.backup(target); chmodSync(target, 0o600);
  }
  db.transaction(() => {
    for (const step of steps.filter(m => m.version > version)) {
      db.exec(step.sql);
      db.prepare('INSERT INTO schema_migrations VALUES (?,?,?,?)').run(step.version, step.name, checksum(step), new Date().toISOString());
      db.pragma(`user_version = ${step.version}`);
    }
    db.pragma(`application_id = ${APPLICATION_ID}`);
    if ((db.pragma('foreign_key_check') as unknown[]).length) reject('MIGRATION_FOREIGN_KEY_FAILURE');
  }).exclusive();
}

// Internal test seam for upgrading a genuine v1 database; not exposed over the worker protocol.
export function createV1Storage(db: Database.Database): void {
  const step = migrations[0]!;
  db.transaction(() => {
    db.exec(step.sql); db.prepare('INSERT INTO schema_migrations VALUES (?,?,?,?)').run(1, step.name, checksum(step), new Date().toISOString());
    db.pragma(`application_id = ${APPLICATION_ID}`); db.pragma('user_version = 1');
  })();
}
