import { parentPort, workerData } from 'node:worker_threads';
import { SqliteEngine } from './engine.js';
import { safeError } from './protocol.js';
import type { WorkerRequest } from './protocol.js';
import { captureTimings } from '../../application/timing.js';
import { deserialize } from 'node:v8';

if (!parentPort) throw new Error('STORAGE_WORKER_REQUIRED');
const port = parentPort;
try {
  const engine = await SqliteEngine.open((workerData as {directory:string}).directory);
  let queue = Promise.resolve();
  port.on('message', (request: WorkerRequest) => {
    // backup is asynchronous: preserve request order across its await as well.
    queue = queue.then(async () => {
      try {
        const operation=async()=>{let value: unknown;
        switch (request.method) {
          case 'read': value = engine.read(); break;
          case 'readVersion': value=engine.readVersion(); break;
          case 'commit': value = engine.commit(request.expectedGeneration, deserialize(Buffer.from(request.data))); break;
          case 'health': value = engine.health(); break;
          case 'backup': value = await engine.backup(); break;
          case 'appendExport': engine.appendExport(request.record); break;
          case 'listExports': value=engine.listExports(request.cvId); break;
          case 'close': engine.close(); break;
          default: throw new Error('STORAGE_UNKNOWN_OPERATION');
        }
        return value;};
        const result=(request as WorkerRequest&{trace?:boolean}).trace?await captureTimings(operation):{value:await operation()};
        port.postMessage({id:request.id,...result});
        if (request.method === 'close') port.close();
      } catch (error) { port.postMessage({id:request.id,error:safeError(error)}); }
    });
  });
  port.postMessage({id:0,value:true});
} catch (error) { port.postMessage({id:0,error:safeError(error)}); port.close(); }
