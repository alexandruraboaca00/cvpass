import type {LibraryIndex} from '../../application/contracts.js';
import { Worker } from 'node:worker_threads';
import { serialize, deserialize } from 'node:v8';
import type { BackupReceipt, LibraryContent, LibraryRecord, LibraryRepository, StorageHealth } from '../../application/contracts.js';
import { LibraryError } from '../../application/contracts.js';
import type { WorkerRequest, WorkerResponse } from './protocol.js';
import type { ExportRecord, ExportRecordRepository } from '../../application/export-record.js';
import { includeTimings, measure, measureAsync, timingEnabled } from '../../application/timing.js';

type Request = WorkerRequest extends infer R ? R extends WorkerRequest ? Omit<R, 'id'> : never : never;
// Instantiate only from a trusted main/host process. Renderer receives application operations.
export class SqliteLibraryRepository implements LibraryRepository, ExportRecordRepository {
  private readonly worker: Worker;
  private readonly pending = new Map<number, {resolve:(value:unknown)=>void; reject:(error:Error)=>void}>();
  private nextId = 0;
  private closed = false;
  private closeTask: Promise<void> | null = null;
  private cached:{stamp:{generation:number|null;dataVersion:number};content:Buffer|null}|undefined;
  private constructor(directory: string) {
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { workerData:{directory} });
    this.worker.on('message', (response: WorkerResponse) => {
      const pending = this.pending.get(response.id); if (!pending) return;
      this.pending.delete(response.id);
      if(response.timings)includeTimings(response.timings);
      if (response.error) pending.reject(new LibraryError(response.error.code)); else pending.resolve(response.value);
    });
    this.worker.on('error', () => this.failAll('STORAGE_WORKER_FAILED'));
    this.worker.on('exit', () => this.failAll('STORAGE_WORKER_EXITED'));
  }
  static async open(directory: string): Promise<SqliteLibraryRepository> {
    const repository = new SqliteLibraryRepository(directory);
    try { await new Promise((resolve,reject) => repository.pending.set(0,{resolve,reject})); return repository; }
    catch (error) { await repository.worker.terminate(); throw error; }
  }
  private failAll(code: string): void {
    this.closed = true;
    this.cached=undefined;
    for (const pending of this.pending.values()) pending.reject(new LibraryError(code));
    this.pending.clear();
  }
  private call<T>(request: Request): Promise<T> {
    if (this.closed) return Promise.reject(new LibraryError('STORAGE_CLOSED'));
    const id = ++this.nextId;
    return new Promise<T>((resolve,reject) => {
      this.pending.set(id,{resolve: value => resolve(value as T),reject});
      try { measure('repository.workerSerialization',()=>this.worker.postMessage({id,...request,trace:timingEnabled()})); }
      catch { this.pending.delete(id); reject(new LibraryError('STORAGE_MESSAGE_INVALID')); }
    });
  }
  readIndex():Promise<LibraryIndex|null>{return this.call({method:'readIndex'});}
  async read(): Promise<LibraryRecord | null> {
    const stamp=await measureAsync('repository.readVersion',()=>this.call<{generation:number|null;dataVersion:number}>({method:'readVersion'}));
    if(this.cached?.stamp.generation===stamp.generation&&this.cached.stamp.dataVersion===stamp.dataVersion)return measure('repository.readClone',()=>this.cached!.content===null?null:{generation:stamp.generation!,content:deserialize(this.cached!.content)});
    const record=await this.call<LibraryRecord|null>({method:'read'});
    if((record?.generation??null)===stamp.generation)this.cached={stamp,content:record?serialize(record.content):null};
    return record;
  }
  async commit(expectedGeneration: number | null, content: LibraryContent): Promise<number> {
    // Capture the exact submitted values. A caller may mutate its object while
    // awaiting the worker; only the worker-validated submitted copy is cached.
    // V8's lossless, process-local clone preserves Map/bytes, undefined, NaN,
    // negative zero and cycles for the worker to validate/reject as before.
    // It also captures caller mutations before the first await. This is IPC
    // transport only: no V8 data enters SQLite or the portable project format.
    const submitted=measure('repository.submitClone',()=>serialize(content)),stamp=await this.call<{generation:number|null;dataVersion:number}>({method:'readVersion'});
    const generation=await measureAsync('repository.commitRoundTrip',()=>this.call<number>({method:'commit',expectedGeneration,data:submitted}));
    this.cached={content:submitted,stamp:{...stamp,generation}};
    return generation;
  }
  backup(): Promise<BackupReceipt> { return this.call({method:'backup'}); }
  health(): Promise<StorageHealth> { return this.call({method:'health'}); }
  appendExport(record:ExportRecord):Promise<void>{return this.call({method:'appendExport',record});}
  listExports(cvId:string):Promise<ExportRecord[]>{return this.call({method:'listExports',cvId});}
  close(): Promise<void> {
    return this.closeTask ??= (async () => {
      if (this.closed) return;
      const result = this.call<void>({method:'close'}); this.closed = true;
      this.cached=undefined;
      await result;
      // Wait for the worker to release its connection before acknowledging close.
      await this.worker.terminate();
    })();
  }
}
