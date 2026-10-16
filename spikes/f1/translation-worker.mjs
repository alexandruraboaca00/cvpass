import {parentPort,workerData} from 'node:worker_threads';
import {pipeline,env} from '@huggingface/transformers';
import path from 'node:path';
try {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = workerData.models + path.sep;
  globalThis.fetch = () => {throw new Error('Offline worker attempted network');};
  const started = performance.now();
  const translator = await pipeline('translation', 'Xenova/opus-mt-es-en', {dtype:'q8',progress_callback:p=>parentPort.postMessage({progress:p.status})});
  parentPort.postMessage({ready:true});
  const result = await translator('Desarrollé herramientas para mejorar la gestión de proyectos.', {max_new_tokens:128});
  parentPort.postMessage({result:result[0].translation_text, elapsedMs:Math.round(performance.now()-started),rss:process.memoryUsage().rss});
  await translator.dispose();
} catch(error) {parentPort.postMessage({error:error.stack});process.exitCode=1;}
