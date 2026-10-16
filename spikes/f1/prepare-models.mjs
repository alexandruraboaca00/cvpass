// Explicit resource installation; never called by app startup.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root,'model-resources.json'),'utf8'));
for (const resource of manifest.resources) {
  const target = path.join(root,'.cache/models',resource.model,resource.file);
  let bytes;
  try {bytes = await readFile(target);} catch {}
  const valid = b => b && b.length === resource.bytes && createHash('sha256').update(b).digest('hex') === resource.sha256;
  if (!valid(bytes)) {
    const response = await fetch(`https://huggingface.co/${resource.model}/resolve/${resource.revision}/${resource.file}`);
    if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (!valid(bytes)) throw new Error(`Resource integrity mismatch: ${resource.model}/${resource.file}`);
    await mkdir(path.dirname(target),{recursive:true});
    await writeFile(target,bytes);
  }
  console.log(`Verified ${resource.model}/${resource.file}`);
}
