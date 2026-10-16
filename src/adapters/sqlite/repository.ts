import { Worker } from 'node:worker_threads';
import type { BackupReceipt, LibraryContent, LibraryRecord, LibraryRepository, StorageHealth } from '../../application/contracts.js';
import { LibraryError } from '../../application/contracts.js';
import type { WorkerRequest, WorkerResponse } from './protocol.js';

type Request = WorkerRequest extends infer R ? R extends WorkerRequest ? Omit<R, 'id'> : never : never;
// Instantiate only from a trusted main/host process. Renderer receives application operations.
export class SqliteLibraryRepository implements LibraryRepository {
  private readonly worker: Worker;
  private readonly pending = new Map<number, {resolve:(value:unknown)=>void; reject:(error:Error)=>void}>();
  private nextId = 0;
  private closed = false;
  private closeTask: Promise<void> | null = null;
  private constructor(directory: string) {
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { workerData:{directory} });
    this.worker.on('message', (response: WorkerResponse) => {
      const pending = this.pending.get(response.id); if (!pending) return;
      this.pending.delete(response.id);
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
    for (const pending of this.pending.values()) pending.reject(new LibraryError(code));
    this.pending.clear();
  }
  private call<T>(request: Request): Promise<T> {
    if (this.closed) return Promise.reject(new LibraryError('STORAGE_CLOSED'));
    const id = ++this.nextId;
    return new Promise<T>((resolve,reject) => {
      this.pending.set(id,{resolve: value => resolve(value as T),reject});
      try { this.worker.postMessage({id,...request}); }
      catch { this.pending.delete(id); reject(new LibraryError('STORAGE_MESSAGE_INVALID')); }
    });
  }
  read(): Promise<LibraryRecord | null> { return this.call({method:'read'}); }
  commit(expectedGeneration: number | null, content: LibraryContent): Promise<number> { return this.call({method:'commit',expectedGeneration,content}); }
  backup(): Promise<BackupReceipt> { return this.call({method:'backup'}); }
  health(): Promise<StorageHealth> { return this.call({method:'health'}); }
  close(): Promise<void> {
    return this.closeTask ??= (async () => {
      if (this.closed) return;
      const result = this.call<void>({method:'close'}); this.closed = true;
      await result;
      // Wait for the worker to release its connection before acknowledging close.
      await this.worker.terminate();
    })();
  }
}
