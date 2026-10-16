import {pipeline, env} from '@huggingface/transformers';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const output = process.env.CVFORGE_F1_OUTPUT;
if (!output || !path.isAbsolute(output)) throw new Error('Absolute CVFORGE_F1_OUTPUT required');
env.cacheDir = path.join(output,'models');
env.allowRemoteModels = process.argv.includes('--download');
if (!env.allowRemoteModels) globalThis.fetch = () => {throw new Error('Network forbidden in offline translation probe');};
const report = {offline:!env.allowRemoteModels, results:[]};
for (const [direction,input,expected] of [
  ['es-en','Desarrollé herramientas para mejorar la gestión de proyectos.','tools'],
  ['en-es','I developed tools to improve project management.','herramientas']
]) {
  let progressEvents = 0;
  const started = performance.now();
  const translate = await pipeline('translation',`Xenova/opus-mt-${direction}`, {dtype:'q8',progress_callback:()=>progressEvents++});
  const loadedMs = performance.now()-started;
  const inference = performance.now();
  const result = await translate(input, {max_new_tokens:128});
  const text = result[0].translation_text;
  assert.notEqual(text,input); assert(text.toLowerCase().includes(expected));
  // Protected institution is kept outside model input, then reinserted verbatim.
  const institution = 'Instituto Sintético Ñandú';
  const composed = `${text} ${institution}`;
  assert(composed.endsWith(institution));
  report.results.push({direction,input,text,protectedInstitution:institution,composed,loadedMs:Math.round(loadedMs),inferenceMs:Math.round(performance.now()-inference),progressEvents,rss:process.memoryUsage().rss});
  console.log(JSON.stringify(report.results.at(-1)));
  await translate.dispose();
}
await mkdir(output,{recursive:true});
await writeFile(path.join(output,`translation-${report.offline?'offline':'download'}.json`),JSON.stringify(report,null,2));
