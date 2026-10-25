import { DomainError } from '../../domain/index.js';
import { LibraryError } from '../../application/contracts.js';
import type { ExportRecord } from '../../application/export-record.js';
import type { Timing } from '../../application/timing.js';

export type WorkerRequest =
  | { id: number; method: 'read' | 'readIndex' | 'readVersion' | 'health' | 'backup' | 'close' }
  | { id: number; method: 'commit'; expectedGeneration: number | null; data:Uint8Array }
  | { id:number; method:'appendExport'; record:ExportRecord }
  | { id:number; method:'listExports'; cvId:string };
export interface WorkerResponse { id: number; value?: unknown; error?: {code:string}; timings?:Timing[] }
export function safeError(error: unknown): {code:string} {
  if (error instanceof LibraryError) return { code:error.code };
  if (error instanceof DomainError) return { code:'DOMAIN_INVALID' };
  const code = (error as {code?:unknown})?.code;
  // Neither SQL source/values, native stacks nor filesystem paths cross this boundary.
  return { code: typeof code === 'string' && /^SQLITE_[A-Z_]+$/.test(code) ? code : 'STORAGE_FAILURE' };
}
