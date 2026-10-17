import { parentPort, workerData } from 'node:worker_threads';
import { analyzeImport } from './analyze.js';
import { ImportFailure } from '../../application/import-contract.js';
if(!parentPort)throw new Error('IMPORT_WORKER_REQUIRED');
globalThis.fetch=async()=>{throw new ImportFailure('IMPORT_NETWORK_FORBIDDEN');};
try{parentPort.postMessage({ok:true,value:await analyzeImport(workerData.bytes,workerData.fileName)});}
catch(error){parentPort.postMessage({ok:false,code:error instanceof ImportFailure?error.code:'IMPORT_ANALYSIS_FAILED'});}
