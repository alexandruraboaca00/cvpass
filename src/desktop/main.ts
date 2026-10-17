import { app, BrowserWindow, dialog, ipcMain, nativeImage, session } from 'electron';
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
    const host = await openLocalLibrary(app,ctx), editor = new CoreEditorService(host.library,ctx);
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
          if (envelope.action === 'photo') {
            const bytes = args[0] as Uint8Array, mediaType = args[1] as 'image/png'|'image/jpeg';
            // F2 bounds/checks bytes and dimensions before Chromium's decoder is used.
            let asset;
            try { asset = makeAsset(ctx.newId(),bytes,'photo',mediaType); }
            catch { throw new Error('PHOTO_FORMAT_UNSUPPORTED'); }
            if (nativeImage.createFromBuffer(Buffer.from(bytes)).isEmpty()) throw new Error('PHOTO_DECODE_FAILED');
            value = await editor.stagePhoto(asset,bytes);
          } else if (envelope.action === 'close') {
            await editor.close(); closing = true; win!.destroy(); app.quit();
          } else {
            const operation = editor[envelope.action] as (...values:unknown[])=>unknown;
            value = await operation.apply(editor,args as unknown[]);
            if(envelope.action==='setUiLocale')uiLocale=args[0] as 'es'|'en';
          }
          return {ok:true,value};
        } catch (error) {
          const issue:EditorFailure = error instanceof EditorValidationError ? {code:'EDITOR_VALIDATION',issues:error.issues}
            : error instanceof DomainError ? {code:'DOMAIN_VALIDATION',issues:error.issues.map(i=>({path:i.path.join('.'),message:'Valor inválido.'}))}
            : {code:error instanceof z.ZodError ? 'IPC_INPUT_INVALID' : safeCode(error),issues:[]};
          return {ok:false,error:issue};
        }
      };
      const result = queue.then(work,work); queue = result; return result;
    });
    win.on('close',event=>{diagnostic('window close');if (!closing) {event.preventDefault();win!.webContents.send('cvforge:close-requested');}});
    win.webContents.on('render-process-gone',()=>{
      diagnostic('renderer gone');
      if(closing)return;
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
