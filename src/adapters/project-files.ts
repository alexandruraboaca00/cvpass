import { constants } from 'node:fs';
import { open, link, rename, unlink, lstat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { LibraryService } from '../application/library.js';
import { LibraryError } from '../application/contracts.js';
import { sha256 } from './asset-bytes.js';
import { WORKSPACE_LIMITS } from './zip-store.js';

// Paths are selected by the trusted main process (future native file dialog), never from CV data.
// This adapter is not exposed to a renderer as a general filesystem API.
export async function readProjectFile(path: string, maxBytes = WORKSPACE_LIMITS.inputBytes): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new LibraryError('PROJECT_FILE_LIMIT_INVALID');
  const before=await lstat(path);
  if(before.isSymbolicLink())throw new LibraryError('PROJECT_FILE_UNSAFE_PATH');
  const file = await open(path,constants.O_RDONLY | (constants.O_NOFOLLOW??0));
  try {
    const info = await file.stat();
    if (info.dev!==before.dev||info.ino!==before.ino||!info.isFile() || info.size > maxBytes) throw new LibraryError('PROJECT_FILE_SIZE_OR_TYPE');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const buffer = new Uint8Array(Math.min(64*1024,maxBytes-size+1));
      const {bytesRead} = await file.read(buffer,0,buffer.length,null); if (!bytesRead) break;
      size += bytesRead; if (size > maxBytes) throw new LibraryError('PROJECT_FILE_SIZE_OR_TYPE');
      chunks.push(buffer.subarray(0,bytesRead));
    }
    return new Uint8Array(Buffer.concat(chunks));
  } finally { await file.close(); }
}
export async function writeProjectFile(path: string, bytes: Uint8Array, overwrite = false): Promise<{byteLength:number;sha256:string}> {
  const parent = dirname(path), temporary = join(parent,`.cvforge-${randomUUID()}.tmp`);
  try {
    const file = await open(temporary,constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    if (overwrite) await rename(temporary,path);
    else { await link(temporary,path); await unlink(temporary); } // atomic no-replace publication
    // Windows/Node cannot open directory handles for fsync. File data was
    // flushed before atomic publication; Linux keeps its directory durability.
    if(process.platform!=='win32'){const directory = await open(parent,constants.O_RDONLY);
    try { await directory.sync(); } finally { await directory.close(); }}
    return {byteLength:bytes.length,sha256:sha256(bytes)};
  } finally {
    await unlink(temporary).catch(error => { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; });
  }
}
export class LibraryProjectFiles {
  constructor(private readonly library: LibraryService) {}
  async export(path: string, options: {cvId?:string;acknowledgeDraftExclusion?:boolean;overwrite?:boolean} = {}) {
    const bytes = await this.library.exportCvproj(options.cvId,options.acknowledgeDraftExclusion);
    return writeProjectFile(path,bytes,options.overwrite);
  }
  async import(path: string, options: Parameters<LibraryService['importCvproj']>[1]) {
    return this.library.importCvproj(await readProjectFile(path),options);
  }
}
