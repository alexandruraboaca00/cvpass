import { randomUUID } from 'node:crypto';
import { isAbsolute, join } from 'node:path';
import { LibraryService } from '../application/library.js';
import { DraftAutosaver } from '../application/autosave.js';
import type { FormDraft } from '../application/contracts.js';
import { LibraryError } from '../application/contracts.js';
import type { DomainContext } from '../domain/index.js';
import { SqliteLibraryRepository } from '../adapters/sqlite/repository.js';
import { cvprojCodec } from '../adapters/library-cvproj.js';
import type { ExportRecordRepository } from '../application/export-record.js';

// This narrow capability is supplied by Electron's main process after app.whenReady().
// No renderer IPC accepts a database path or exposes the SQLite repository.
export interface ElectronStoragePaths { getPath(name:'userData'):string }
export async function openLocalLibrary(app: ElectronStoragePaths, context: DomainContext = {newId:randomUUID,now:()=>new Date().toISOString()}): Promise<{
  library: LibraryService;
  exports:ExportRecordRepository;
  autosaver: (draft:FormDraft) => DraftAutosaver;
  close: (decision:'preserveForRecovery'|'discard') => Promise<void>;
}> {
  const userData = app.getPath('userData');
  if (!isAbsolute(userData)) throw new LibraryError('STORAGE_USER_DATA_INVALID');
  const repository = await SqliteLibraryRepository.open(join(userData,'library'));
  const library = new LibraryService(repository,context,cvprojCodec);
  const controllers = new Set<DraftAutosaver>();
  return {
    library,
    exports:repository,
    autosaver(draft) { const controller = new DraftAutosaver(library,draft); controllers.add(controller); return controller; },
    async close(decision) {
      if (decision !== 'discard' && decision !== 'preserveForRecovery') throw new LibraryError('DRAFT_DECISION_REQUIRED');
      // A failed flush leaves storage open and propagates the error to the caller.
      for (const controller of controllers) {
        if (decision === 'discard') await controller.cancel(); else await controller.finish();
      }
      await library.saveAndClose(decision);
    },
  };
}
