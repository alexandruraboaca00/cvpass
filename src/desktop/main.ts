import { app, BrowserWindow, dialog, ipcMain, nativeImage, session, shell } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { openLocalLibrary } from '../host/local-library.js';
import { CoreEditorService } from '../application/editor.js';
import { EditorTargetSchema, EditorValidationError } from '../application/editor-model.js';
import type { EditorForm } from '../application/editor-model.js';
import { DomainError, SectionKindSchema } from '../domain/index.js';
import { makeAsset } from '../adapters/asset-bytes.js';
import type { EditorFailure } from '../application/editor-contract.js';
import { translateMessage } from '../ui/messages.js';
import { StructuredImportService } from '../application/structured-import.js';
import type { ImportReviewInput } from '../application/structured-import.js';
import { LocalStructuredImport } from '../adapters/import/worker-port.js';
import { IMPORT_WORKSPACE_LIMIT } from '../application/import-contract.js';
import { loadSimpleResources } from '../adapters/pdf/resources.js';
import { nativeImageNormalizer } from '../adapters/pdf/normalize-image.js';
import { ChromiumPdfRenderer } from '../adapters/pdf/chromium.js';
import { sha256 } from '../adapters/asset-bytes.js';
import { RenderSnapshotFactory } from '../application/render-snapshot.js';
import { PdfPreviewService } from '../application/pdf-preview.js';
import { PresentationService } from '../application/presentation.js';
import { PresentationInputSchema } from '../application/render-contract.js';
import type { PresentationInput } from '../application/render-contract.js';
import { writeProjectFile } from '../adapters/project-files.js';

app.setName('CVForge');
// Electron's standard --user-data-dir is useful for isolated synthetic acceptance runs.
const customData = app.commandLine.getSwitchValue('user-data-dir');
if (customData) app.setPath('userData',customData);
if (!app.requestSingleInstanceLock()) app.quit();
else void run();
async function run():Promise<void> {
  await app.whenReady();
  const ctx = {newId:randomUUID,now:()=>new Date().toISOString()};
  let win:BrowserWindow|undefined, closing = false, uiLocale:'es'|'en'='es';
  const message=(key:string,values:Record<string,string|number>={})=>translateMessage(uiLocale,key,values);
  const diagnostic=(event:string):void=>{if(app.commandLine.hasSwitch('cvforge-diagnostics'))console.info('CVForge lifecycle:',event);};
  try {
    const resources=()=>loadSimpleResources(join(app.getAppPath(),'resources/fonts'));
    const host = await openLocalLibrary(app,ctx), editor = new CoreEditorService(host.library,ctx,resources);
    const presentation=new PresentationService(host.library,resources);
    const preview=new PdfPreviewService(new RenderSnapshotFactory(host.library,resources,nativeImageNormalizer,sha256,ctx,process.versions.chrome!),host.library,new ChromiumPdfRenderer(),{
      async choose(defaultPath){const result=await dialog.showSaveDialog(win!,{title:message('Exportar PDF'),defaultPath,filters:[{name:'PDF',extensions:['pdf']}],properties:['createDirectory','showOverwriteConfirmation']});return result.canceled?null:result.filePath??null;},
      async write(path,bytes){return writeProjectFile(path,bytes,true);},
    },sha256,ctx);
    const importer=new StructuredImportService(host.library,new LocalStructuredImport(),ctx);
    uiLocale=(await editor.start()).uiLocale;
    session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
    session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!['file:','data:','blob:','devtools:'].includes(new URL(details.url).protocol)}));
    const base = fileURLToPath(new URL('.',import.meta.url));
    win = new BrowserWindow({width:1180,height:860,minWidth:760,minHeight:620,show:false,backgroundColor:'#f4f5f7',title:'CVForge',
      webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
    win.removeMenu();
    const page = fileURLToPath(new URL('../../renderer/index.html',import.meta.url));
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    win.webContents.on('will-navigate',event=>event.preventDefault());
    let queue = Promise.resolve<unknown>(undefined);
    const id = z.uuid(), revision = z.int().nonnegative(), none = z.tuple([]);
    const target = z.union([EditorTargetSchema,z.strictObject({kind:z.literal('newEntry'),sectionId:id,entryKind:z.enum(['nativeLanguage','foreignLanguage']).optional()}),z.strictObject({kind:z.literal('newCustomSection')})]);
    const form = z.custom<EditorForm>(value => !!value && typeof value === 'object');
    const schemas = {
      pdfGenerate:z.tuple([id,revision]),pdfCancel:none,pdfOpenLink:z.tuple([z.string().min(1).max(10000)]),pdfExport:z.tuple([id,z.string().regex(/^[a-f0-9]{64}$/)]),presentation:z.tuple([id,revision,PresentationInputSchema]),
      importFile:z.tuple([id,z.instanceof(Uint8Array).refine(b=>b.byteLength>0&&b.byteLength<=IMPORT_WORKSPACE_LIMIT),z.string().min(1).max(255).refine(s=>!/[\/\\\u0000-\u001f]/.test(s))]),
      importChoose:z.tuple([id,z.string().min(1).max(100)]),importCancel:z.tuple([id]),
      importConfirm:z.tuple([id,z.custom<ImportReviewInput>(v=>!!v&&typeof v==='object')]),
      importRestore:z.tuple([id,z.enum(['emptyWorkspace','replaceWorkspace']),z.boolean()]),
      importPhoto:z.tuple([id,z.instanceof(Uint8Array).refine(b=>b.byteLength>0&&b.byteLength<=10*1024*1024),z.enum(['image/png','image/jpeg'])]),
      list:none,create:z.tuple([z.string().min(1).max(1000),z.string().max(1000)]),open:z.tuple([id]),
      addSection:z.tuple([id,revision,SectionKindSchema.exclude(['custom'])]),begin:z.tuple([id,revision,target]),
      setUiLocale:z.tuple([z.enum(['es','en'])]),duplicate:z.tuple([id,revision,z.string().min(1).max(1000)]),revisions:z.tuple([id]),restore:z.tuple([id,revision,id]),
      stage:z.tuple([form]),confirm:z.tuple([form]),cancel:none,
      photo:z.tuple([z.instanceof(Uint8Array).refine(b=>b.byteLength>0&&b.byteLength<=10*1024*1024),z.enum(['image/png','image/jpeg'])]),
      visibility:z.tuple([id,revision,id,id.nullable(),z.boolean()]),remove:z.tuple([id,revision,id,id.nullable(),z.literal(true)]),
      recover:z.tuple([id]),discardRecovery:z.tuple([id]),status:none,flush:none,close:none,
    };
    ipcMain.handle('cvforge:editor',(event,input:unknown) => {
      const work = async () => {
        try {
          if (event.sender !== win!.webContents || event.senderFrame !== win!.webContents.mainFrame || event.senderFrame.url !== pathToFileURL(page).href) throw new Error('IPC_SENDER_REJECTED');
          const envelope = z.strictObject({action:z.enum(Object.keys(schemas) as [keyof typeof schemas,...(keyof typeof schemas)[]]),args:z.array(z.unknown())}).parse(input);
          const args = schemas[envelope.action].parse(envelope.args);
          diagnostic('ipc '+envelope.action);
          let value:unknown;
          if(importer.isOpen()&&!envelope.action.startsWith('import')&&!['list','status','flush','close','pdfCancel'].includes(envelope.action))throw new Error('IMPORT_ALREADY_OPEN');
          if(envelope.action==='pdfGenerate')value=await preview.generate(args[0] as string,args[1] as number);
          else if(envelope.action==='pdfCancel')preview.invalidate();
          else if(envelope.action==='pdfOpenLink'){if(!preview.canOpenLink(args[0] as string))throw new Error('PDF_LINK_REJECTED');await shell.openExternal(args[0] as string);}
          else if(envelope.action==='pdfExport')value=await preview.export(args[0] as string,args[1] as string);
          else if(envelope.action==='presentation'){
            if(editor.hasActiveForm())throw new Error('EDITOR_FORM_OPEN');
            await presentation.confirm(args[0] as string,args[1] as number,args[2] as PresentationInput);value=await editor.open(args[0] as string);
          }else if(envelope.action==='importFile'){
            if(editor.hasActiveForm())throw new Error('EDITOR_FORM_OPEN');
            value=await importer.begin(args[0] as string,args[1] as Uint8Array,args[2] as string);
          }else if(envelope.action==='importChoose')value=importer.select(args[0] as string,args[1] as string);
          else if(envelope.action==='importCancel')importer.cancel(args[0] as string);
          else if(envelope.action==='importConfirm')value=await importer.confirm(args[0] as string,args[1] as ImportReviewInput);
          else if(envelope.action==='importRestore')value=await importer.confirmWorkspace(args[0] as string,args[1] as 'emptyWorkspace'|'replaceWorkspace',args[2] as boolean);
          else if (envelope.action === 'photo'||envelope.action==='importPhoto') {
            const offset=envelope.action==='importPhoto'?1:0,bytes = args[offset] as Uint8Array, mediaType = args[offset+1] as 'image/png'|'image/jpeg';
            // F2 bounds/checks bytes and dimensions before Chromium's decoder is used.
            let asset;
            try { asset = makeAsset(ctx.newId(),bytes,'photo',mediaType); }
            catch { throw new Error('PHOTO_FORMAT_UNSUPPORTED'); }
            if (nativeImage.createFromBuffer(Buffer.from(bytes)).isEmpty()) throw new Error('PHOTO_DECODE_FAILED');
            value = envelope.action==='importPhoto'?importer.stagePhoto(args[0] as string,asset,bytes):await editor.stagePhoto(asset,bytes);
          } else if (envelope.action === 'close') {
            importer.cancel();preview.invalidate();
            await editor.close(); closing = true; win!.destroy(); app.quit();
          } else {
            const operation = editor[envelope.action] as (...values:unknown[])=>unknown;
            value = await operation.apply(editor,args as unknown[]);
            if(envelope.action==='setUiLocale')uiLocale=args[0] as 'es'|'en';
          }
          if(['confirm','presentation','visibility','remove','restore','recover','importRestore','importConfirm'].includes(envelope.action))preview.invalidate();
          return {ok:true,value};
        } catch (error) {
          const issue:EditorFailure = error instanceof EditorValidationError ? {code:'EDITOR_VALIDATION',issues:error.issues}
            : error instanceof DomainError ? {code:'DOMAIN_VALIDATION',issues:error.issues.map(i=>({path:i.path.join('.'),message:'Valor inválido.'}))}
            : {code:error instanceof z.ZodError ? 'IPC_INPUT_INVALID' : safeCode(error),issues:[]};
          return {ok:false,error:issue};
        }
      };
      const allowedSender=event.sender===win!.webContents&&event.senderFrame===win!.webContents.mainFrame&&event.senderFrame.url===pathToFileURL(page).href;
      const action=(input as {action?:unknown})?.action;
      // Cancel is read-only with respect to the library and must interrupt an active parser.
      if(action==='importCancel'||action==='pdfGenerate'||action==='pdfCancel'||action==='pdfExport')return work();
      if(action==='close'&&allowedSender){preview.invalidate();try{importer.cancel();}catch{/* confirmation finishes in the queue before close */}}
      const result = queue.then(work,work); queue = result; return result;
    });
    win.on('close',event=>{diagnostic('window close');if (!closing) {event.preventDefault();win!.webContents.send('cvforge:close-requested');}});
    win.webContents.on('render-process-gone',()=>{
      diagnostic('renderer gone');
      if(closing)return;
      preview.invalidate();
      try{importer.cancel();}catch{/* wait for the confirmed transaction below */}
      void queue.then(()=>editor.close()).catch(()=>dialog.showErrorBox(message('CVForge — borrador pendiente'),message('La ventana se ha cerrado inesperadamente y no se ha podido completar el guardado del borrador. El contenido confirmado se conserva.'))).finally(()=>{closing=true;win!.destroy();app.quit();});
    });
    app.on('second-instance',()=>{win?.restore();win?.focus();});
    await win.loadFile(page); win.show();
  } catch (error) {
    // Diagnostic codes contain no CV values, SQL text or local filenames.
    console.error('CVForge startup:',safeCode(error));
    dialog.showErrorBox(message('CVForge — almacenamiento no disponible'),message('No se ha abierto la biblioteca. Código: {code}',{code:safeCode(error)}));
    closing = true; win?.destroy(); app.exit(1);
  }
}
function safeCode(error:unknown):string {
  const code = (error as {code?:unknown})?.code;
  if (typeof code === 'string' && /^[A-Z_0-9]{1,80}$/.test(code)) return code;
  if (error instanceof Error && /^[A-Z_0-9]{1,80}$/.test(error.message)) return error.message;
  return 'LOCAL_OPERATION_FAILED';
}
