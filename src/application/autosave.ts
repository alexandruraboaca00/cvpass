import type { FormDraft, Resources } from './contracts.js';
import { LibraryError } from './contracts.js';
import type { DraftChanges, LibraryService } from './library.js';

export type AutosaveStatus = 'idle'|'pending'|'saving'|'saved'|'error';
interface PendingDraft { changes: DraftChanges; resources: Resources }
// A technical controller for a form session. No UI state is treated as a durable confirmation.
export class DraftAutosaver {
  private pending: PendingDraft | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private maximumTimer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private version: number;
  private stopped = false;
  status: AutosaveStatus = 'idle';
  lastError: unknown = null;
  constructor(private readonly library: LibraryService, private readonly draft: FormDraft,
    private readonly options: {delayMs?:number;maxWaitMs?:number;onStatus?:(status:AutosaveStatus)=>void} = {}) {
    this.version = draft.version;
    const delay = options.delayMs ?? 500, max = options.maxWaitMs ?? 2000;
    if (!Number.isFinite(delay) || !Number.isFinite(max) || delay < 1 || max < delay) throw new LibraryError('AUTOSAVE_TIMING_INVALID');
  }
  private notify(status: AutosaveStatus): void {
    this.status = status;
    // A presentation observer cannot roll back or misreport a completed transaction.
    try { this.options.onStatus?.(status); } catch { /* observer owns its error */ }
  }
  schedule(changes: DraftChanges, resources: Resources = {}): void {
    if (this.stopped) throw new LibraryError('AUTOSAVE_STOPPED');
    this.pending = structuredClone({changes,resources}); this.notify('pending');
    if (this.delayTimer) clearTimeout(this.delayTimer);
    const trigger = (): void => { void this.flush().catch(() => { /* lastError/status expose failure; never report saved */ }); };
    this.delayTimer = setTimeout(trigger,this.options.delayMs ?? 500);
    this.maximumTimer ??= setTimeout(trigger,this.options.maxWaitMs ?? 2000);
  }
  private clearTimers(): void {
    if (this.delayTimer) clearTimeout(this.delayTimer); if (this.maximumTimer) clearTimeout(this.maximumTimer);
    this.delayTimer = this.maximumTimer = null;
  }
  async flush(): Promise<void> {
    this.clearTimers();
    if (this.running) return this.running;
    this.running = (async () => {
      while (this.pending) {
        const batch = this.pending; this.pending = null; this.notify('saving');
        try {
          const saved = await this.library.updateDraft(this.draft.id,this.version,batch.changes,batch.resources);
          this.version = saved.version; this.lastError = null;
        } catch (error) {
          this.pending ??= batch; this.lastError = error; this.notify('error'); throw error;
        }
      }
      this.notify('saved');
    })();
    try { await this.running; } finally { this.running = null; }
  }
  async cancel(): Promise<void> {
    if (this.stopped) return;
    this.clearTimers(); this.pending = null;
    if (this.running) await this.running;
    await this.library.discardDraft(this.draft.id,this.version); this.stopped = true; this.notify('idle');
  }
  async finish(): Promise<void> { if (this.stopped) return; await this.flush(); this.clearTimers(); this.stopped = true; }
}
