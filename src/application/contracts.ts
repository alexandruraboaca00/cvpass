import type { Asset, DomainContext, Entity, ProjectSnapshot, Revision, TemplateDefinition, Workspace } from '../domain/index.js';

// The application owns these contracts. No SQLite, Electron, filesystem or codec imports.
export interface ProjectData { snapshot: ProjectSnapshot; blobs: Map<string, Uint8Array> }
export interface Resources {
  assetsById?: Record<string, Asset>;
  blobs?: Map<string, Uint8Array>;
  templates?: TemplateDefinition[];
}
export interface FormDraft {
  id: string;
  entityId: string;
  baseRevision: number;
  baseSnapshot: Entity;
  version: number;
  createdAt: string;
  updatedAt: string;
  targetPath: string[];
  values: unknown;
  rawDateInputs: Record<string, string>;
  assetIds: string[];
  templateRefs: { id: string; version: number }[];
}
export interface LibraryContent {
  workspace: Workspace;
  revisions: Revision[];
  assetsById: Record<string, Asset>;
  templates: TemplateDefinition[];
  blobs: Map<string, Uint8Array>;
  drafts: FormDraft[];
}
export interface LibraryRecord { generation: number; content: LibraryContent }
export interface BackupReceipt { name: string }
export interface StorageHealth {
  schemaVersion: number;
  sqliteVersion: string;
  integrity: string[];
  foreignKeyViolations: number;
  journalMode: string;
  synchronous: number;
  counts: Record<string, number>;
}
export interface LibraryRepository {
  read(): Promise<LibraryRecord | null>;
  // Validate the full library/dependency closure, then atomic compare-and-swap.
  // Reject invalid input without mutation. null means an empty database.
  commit(expectedGeneration: number | null, content: LibraryContent): Promise<number>;
  backup(): Promise<BackupReceipt>;
  health(): Promise<StorageHealth>;
  close(): Promise<void>;
}
export interface ProjectCodec {
  encode(data: ProjectData, createdAt: string): Uint8Array;
  decode(bytes: Uint8Array): ProjectData;
}
export type ApplicationContext = DomainContext;
export class LibraryError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'LibraryError'; }
}
export function reject(code: string): never { throw new LibraryError(code); }
