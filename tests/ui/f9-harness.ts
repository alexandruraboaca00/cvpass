import {expect,_electron as electron,test} from '@playwright/test';
import type {ElectronApplication,Page} from '@playwright/test';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readPdfPayload} from '../../src/adapters/import/pdf-payload.js';
import {createExportProjection,canonical,entryIds} from '../../src/domain/index.js';
import type {CvDocument} from '../../src/domain/index.js';
export const digest=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
export async function pdfProjection(bytes:Uint8Array){
  // Enumerate attachment contents, independently of their filenames.
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task=getDocument({data:new Uint8Array(bytes),verbosity:0}),doc=await task.promise;
  try{const attachments=await doc.getAttachments(),candidates=[];for(const id of attachments?.keys()??[]){const bytes=await doc.getAttachmentContent(id);if(bytes){const p=readPdfPayload(bytes);if(p)candidates.push(p);}}expect(candidates).toHaveLength(1);return candidates[0]!.projection;}finally{await task.destroy();}
}
export async function harness(directory?:string){
  const root=process.env.CVFORGE_F9_OUTPUT??'/tmp/cvforge-f9';await mkdir(root,{recursive:true});
  const dir=directory??await mkdtemp(join(root,'user-'));let app:ElectronApplication|undefined,page:Page;
  const errors:string[]=[],requests:string[]=[],startups:number[]=[];
  const executable=resolve(process.env.CVFORGE_F9_EXECUTABLE??'out/f9/linux-unpacked/cvforge');
  const launch=async()=>{
    const start=performance.now();
    app=await electron.launch({chromiumSandbox:true,executablePath:executable,cwd:process.env.CVFORGE_F9_CWD??process.cwd(),env:{...process.env,APPIMAGELAUNCHER_DISABLE:'1',APPIMAGE_EXTRACT_AND_RUN:'1',GDK_BACKEND:'x11',GTK_USE_PORTAL:'0'},args:['--user-data-dir='+dir,'--ozone-platform=x11'],timeout:60000});
    page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});app.context().on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
    expect(await app.evaluate(({app})=>app.commandLine.hasSwitch('no-sandbox'))).toBe(false);
    await expect(page.getByRole('heading',{name:/^(Tu biblioteca|Your library)$/})).toBeVisible({timeout:30000});startups.push(performance.now()-start);return page;
  };
  const close=async()=>{if(!app)return;const exit=app.waitForEvent('close');await page.evaluate(()=>window.close());await exit;app=undefined;};
  await launch();
  return {dir,get page(){return page;},get app(){if(!app)throw Error('APP_CLOSED');return app;},startups,errors,requests,
    async restart(){await close();return launch();},async close(){await close();},async launch(){return launch();},
    async crash(){const a=app!,pid=await a.evaluate(()=>process.pid);expect(pid).toBeGreaterThan(1);expect(pid).not.toBe(process.pid);const exited=a.waitForEvent('close');process.kill(pid,'SIGKILL');await exited;app=undefined;},
    async destination(name:string|null){const path=name?join(root,name):null;await app!.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>path?{canceled:false,filePath:path}:{canceled:true,filePath:''};},path);return path;},
    async dispose(){if(app){await page.screenshot({path:test.info().outputPath('final-'+dir.split('/').pop()+'.png'),fullPage:true}).catch(()=>{});await close();}await writeFile(test.info().outputPath('runtime-'+dir.split('/').pop()+'.json'),JSON.stringify({errors,requests,startups},null,2));expect(errors).toEqual([]);expect(requests).toEqual([]);}
  };
}
export async function library(page:Page){const r=await page.evaluate(()=>window.cvforge.list());if(!r.ok)throw Error(r.error.code);return r.value;}
export async function current(page:Page,id?:string){const r=await page.evaluate(async id=>{const l=await window.cvforge.list();if(!l.ok)throw Error(l.error.code);return window.cvforge.open(id??l.value.cvs.at(-1)!.id);},id);if(!r.ok)throw Error(r.error.code);return r.value.cv;}
export async function importReview(page:Page,bytes:Uint8Array,name:string,confirm=true){
  await page.getByRole('button',{name:'Importar archivo',exact:true}).click();const d=page.getByRole('dialog',{name:'Importar archivo',exact:true});
  if(bytes.length>50*1024*1024){const path=join(process.env.CVFORGE_F9_OUTPUT??'/tmp/cvforge-f9',name);await writeFile(path,bytes);await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles(path);}
  else await d.getByLabel('Seleccionar archivo para importar',{exact:true}).setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
  await expect(d.getByText('Analizando archivo local…',{exact:true})).not.toBeVisible({timeout:30000});
  if(confirm){const ack=d.getByRole('checkbox',{name:/He revisado la propuesta/});if(await ack.count())await ack.check();await d.getByRole('button',{name:'Confirmar importación',exact:true}).click();await expect(d).not.toBeVisible();}return d;
}
export async function personal(page:Page){await page.getByRole('button',{name:'Editar datos personales',exact:true}).click();return page.getByRole('dialog',{name:'Editar datos personales',exact:true});}
export async function template(page:Page,id:string){await page.getByRole('button',{name:'Presentación',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel('Plantilla',{exact:true}).selectOption(id);await d.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(d).not.toBeVisible();}
export async function preview(page:Page){const p=page.getByRole('region',{name:'Vista previa PDF',exact:true});if(!await p.count())await page.getByRole('button',{name:'Vista previa PDF',exact:true}).click();await expect(p).toHaveAttribute('data-state','ready',{timeout:30000});return p;}
export async function exported(rig:Awaited<ReturnType<typeof harness>>,name:string){const p=await preview(rig.page),sha=await p.getAttribute('data-sha256'),path=(await rig.destination(name))!;await p.getByRole('button',{name:'Exportar PDF',exact:true}).click();await expect(p.locator('[data-export-sha256]')).toHaveAttribute('data-export-sha256',sha!,{timeout:30000});const bytes=new Uint8Array(await readFile(path));expect(digest(bytes)).toBe(sha);return {bytes,sha256:sha!,path,projection:await pdfProjection(bytes)};}
export function visibleEquivalent(cv:CvDocument,projection:Awaited<ReturnType<typeof pdfProjection>>){expect(createExportProjection(cv,()=>projection.images[0]!)).toEqual(projection);}
export function normalizedCv(cv:CvDocument){
  const data={...cv,sectionsById:cv.sectionOrder.map(id=>{const s=cv.sectionsById[id]!;return {...s,entriesById:entryIds(s).map(id=>s.entriesById[id]),groupsById:s.groupOrder.map(id=>s.groupsById[id])};}),sensitiveTranslationMemory:Object.values(cv.sensitiveTranslationMemory).sort((a,b)=>{const {id:ai,...x}=a,{id:bi,...y}=b;return canonical(x).localeCompare(canonical(y));})};
  const ids=new Map<string,string>();const replace=(s:string)=>{if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(s))return s;if(!ids.has(s))ids.set(s,'ID_'+ids.size);return ids.get(s)!;};
  const visit=(v:unknown):unknown=>typeof v==='string'?replace(v):Array.isArray(v)?v.map(visit):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[replace(k),visit(x)])):v;
  return visit(JSON.parse(canonical(data)));
}
