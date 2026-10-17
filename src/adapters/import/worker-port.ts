import { Worker } from 'node:worker_threads';
import { IMPORT_WORKSPACE_LIMIT, importFail, ImportFailure } from '../../application/import-contract.js';
import type { ImportAnalysis, StructuredImportPort } from '../../application/import-contract.js';

export class LocalStructuredImport implements StructuredImportPort{
  async analyze(bytes:Uint8Array,fileName:string,signal?:AbortSignal):Promise<ImportAnalysis>{
    if(bytes.length===0||bytes.length>IMPORT_WORKSPACE_LIMIT)importFail('IMPORT_SIZE_LIMIT');
    if(signal?.aborted)importFail('IMPORT_CANCELLED');
    return new Promise((resolve,reject)=>{
      const worker=new Worker(new URL('./worker.js',import.meta.url),{workerData:{bytes:new Uint8Array(bytes),fileName},resourceLimits:{maxOldGenerationSizeMb:512,maxYoungGenerationSizeMb:32},stdout:true,stderr:true});
      // Untrusted parser diagnostics can contain input; consume them without normal logging.
      worker.stdout.resume();worker.stderr.resume();
      let done=false;
      const abort=()=>finish(new ImportFailure('IMPORT_CANCELLED'));
      const finish=(error?:ImportFailure,value?:ImportAnalysis)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);void worker.terminate();if(error)reject(error);else resolve(value!);};
      const timer=setTimeout(()=>finish(new ImportFailure('IMPORT_ANALYSIS_TIMEOUT')),30_000);
      signal?.addEventListener('abort',abort,{once:true});
      worker.once('message',(message:{ok:boolean;value?:ImportAnalysis;code?:string})=>message.ok?finish(undefined,message.value):finish(new ImportFailure(message.code??'IMPORT_ANALYSIS_FAILED')));
      worker.once('error',()=>finish(new ImportFailure('IMPORT_ANALYSIS_FAILED')));
      worker.once('exit',()=>{if(!done)finish(new ImportFailure('IMPORT_ANALYSIS_FAILED'));});
    });
  }
}
