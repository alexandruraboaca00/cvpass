import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadSimpleResources } from '../pdf/resources.js';
import { builtinTemplate } from '../../application/render-contract.js';
import type { DomainContext } from '../../domain/index.js';
import { IMPORT_FILE_LIMIT, IMPORT_WORKSPACE_LIMIT, IMPORT_XML_LIMIT, ImportFailure, importFail } from '../../application/import-contract.js';
import type { ImportAnalysis, ImportCandidate } from '../../application/import-contract.js';
import { decodeCvproj, UnsupportedProjectVersion } from '../cvproj.js';
import { sha256 } from '../asset-bytes.js';
import { validateImportDraft } from '../../application/import-draft.js';
import { adaptEuropass } from './europass.js';
import { adaptPdfProjection, readPdfPayload } from './pdf-payload.js';

export function detectSignature(bytes:Uint8Array):'zip'|'pdf'|'xml'|'unsupported'{
  if(bytes[0]===0x50&&bytes[1]===0x4b)return 'zip';
  if(new TextDecoder('ascii').decode(bytes.subarray(0,1024)).includes('%PDF-'))return 'pdf';
  const prefix=bytes.subarray(0,200),utf8=new TextDecoder().decode(prefix).replace(/^\uFEFF/,'').trimStart();
  if(utf8.startsWith('<')||(bytes[0]===0xff&&bytes[1]===0xfe)||(bytes[0]===0xfe&&bytes[1]===0xff)||(bytes[0]===0&&bytes[1]===0x3c)||(bytes[0]===0x3c&&bytes[1]===0))return 'xml';
  return 'unsupported';
}
const safeCode=(error:unknown,fallback:string):string=>error instanceof ImportFailure?error.code:error instanceof UnsupportedProjectVersion?'CVPROJ_VERSION_UNSUPPORTED':fallback;
export async function analyzeImport(bytes:Uint8Array,fileName:string,ctx:DomainContext={newId:randomUUID,now:()=>new Date().toISOString()}):Promise<ImportAnalysis>{
  if(!fileName||fileName.length>255||/[\/\\\u0000-\u001f]/.test(fileName))importFail('IMPORT_FILENAME_INVALID');
  if(!bytes.length||bytes.length>IMPORT_WORKSPACE_LIMIT)importFail('IMPORT_SIZE_LIMIT');
  const signature=detectSignature(bytes),analysis:ImportAnalysis={source:{fileName,sha256:sha256(bytes),byteLength:bytes.length},detected:'unsupported',code:null,candidates:[],selectedKey:null,selectionReason:null};
  const name=fileName.replace(/\.[^.]*$/,'')||fileName;
  if(signature!=='zip'&&bytes.length>IMPORT_FILE_LIMIT)importFail('IMPORT_SIZE_LIMIT');
  if(signature==='zip'){
    analysis.detected='cvproj';
    try{
      const project=decodeCvproj(bytes),cv=project.snapshot.scope==='cv'?project.snapshot.cv:null;
      const issues=cv?.importRecords?.flatMap(r=>r.issues.filter(i=>i.resolution==='pending'))??[];
      analysis.candidates.push({key:'project',format:'cvproj',attachmentName:null,sha256:analysis.source.sha256,status:issues.length?'partial':'ready',code:null,project,
        draft:cv?{cv,rawDates:{},rawNumbers:{},documentLocale:cv.documentLocale,localeEvidence:'cvproj CvDocument.documentLocale',mappings:[],issues}:null});
    }catch(error){analysis.code=safeCode(error,'CVPROJ_INVALID');}
  }else if(signature==='xml'){
    analysis.detected='xml';analysis.candidates.push(xmlCandidate(bytes,'xml',null,'europassXml'));
  }else if(signature==='pdf'){
    analysis.detected='pdf';
    let task:ReturnType<typeof getDocument>|undefined;
    try{
      // Only catalog attachments are requested: no text, layout, annotations, scripts or rendering.
      task=getDocument({data:new Uint8Array(bytes),enableXfa:false,disableFontFace:true,useSystemFonts:false,useWasm:false,isOffscreenCanvasSupported:false,stopAtErrors:true,verbosity:0,disableAutoFetch:true,disableStream:true,disableRange:true});
      const pdf=await task.promise,attachments=await pdf.getAttachments();
      if(attachments&&attachments.size>100)importFail('PDF_ATTACHMENT_COUNT_LIMIT');
      let expanded=0,index=0;
      for(const [id,attachment] of attachments??new Map()){
        const content=await pdf.getAttachmentContent(id),key='attachment:'+index++,attachmentName=attachment.filename.slice(0,255);
        if(!content){analysis.candidates.push({key,format:'europassPdf',attachmentName,sha256:sha256(new Uint8Array()),status:'invalid',code:'PDF_ATTACHMENT_UNREADABLE',draft:null,project:null});continue;}
        expanded+=content.byteLength;if(content.byteLength>IMPORT_XML_LIMIT||expanded>100*1024*1024)importFail('PDF_ATTACHMENT_SIZE_LIMIT');
        const digest=sha256(content);
        try{
          const payload=readPdfPayload(content);
          if(payload){
            const ref=payload.projection.presentation.templateRef;let builtin;
            if(['simple','lateral'].includes(ref.id)){
              if(ref.version!==1)importFail('PDF_TEMPLATE_VERSION_UNSUPPORTED');
              if(payload.projection.presentation.fontFamily!=='Liberation Sans')importFail('PDF_FONT_UNSUPPORTED');
              builtin=await loadSimpleResources(fileURLToPath(new URL('../../../../resources/fonts/',import.meta.url)));
              builtin={...builtin,template:builtinTemplate(ref.id,ref.version)};
            }
            const {draft,project}=adaptPdfProjection(payload.projection,ctx,name,payload.integrity,builtin);analysis.candidates.push({key,format:'cvforgePdf',attachmentName,sha256:digest,status:status(draft),code:null,draft,project});continue;
          }
          if(detectSignature(content)==='xml')analysis.candidates.push(xmlCandidate(content,key,attachmentName,'europassPdf'));
          else analysis.candidates.push({key,format:'europassPdf',attachmentName,sha256:digest,status:'incompatible',code:'ATTACHMENT_NOT_STRUCTURED_CV',draft:null,project:null});
        }catch(error){analysis.candidates.push({key,format:'cvforgePdf',attachmentName,sha256:digest,status:'invalid',code:safeCode(error,'CVFORGE_PAYLOAD_INVALID'),draft:null,project:null});}
      }
      if(!analysis.candidates.length)analysis.code='PDF_NO_COMPATIBLE_STRUCTURE';
    }catch(error){analysis.code=safeCode(error,(error as {name?:string})?.name==='PasswordException'?'PDF_PASSWORD_UNSUPPORTED':'PDF_INVALID');analysis.detected='corrupt';analysis.candidates=[];}
    finally{await task?.destroy();}
  }else analysis.code='FILE_UNSUPPORTED';
  const valid=analysis.candidates.filter(c=>c.project!==null);
  if(valid.length===1){analysis.selectedKey=valid[0]!.key;analysis.selectionReason=signature==='pdf'?'soleCompatible':'directFile';}
  else if(valid.length>1&&new Set(valid.map(c=>`${c.format}:${c.sha256}`)).size===1){analysis.selectedKey=valid[0]!.key;analysis.selectionReason='identicalCandidates';}
  if(!valid.length&&!analysis.code)analysis.code='NO_COMPATIBLE_CANDIDATE';
  return analysis;

  function status(draft:NonNullable<ImportCandidate['draft']>):ImportCandidate['status']{
    try{validateImportDraft(draft);return draft.issues.some(i=>i.kind!=='ignored')?'partial':'ready';}catch{return 'partial';}
  }
  function xmlCandidate(content:Uint8Array,key:string,attachmentName:string|null,format:'europassPdf'|'europassXml'):ImportCandidate{
    const digest=sha256(content);
    try{const {draft,project}=adaptEuropass(content,ctx,name);return {key,format,attachmentName,sha256:digest,status:status(draft),code:null,draft,project};}
    catch(error){const code=safeCode(error,'EUROPASS_INVALID');return {key,format,attachmentName,sha256:digest,status:code.includes('UNSUPPORTED')?'incompatible':'invalid',code,draft:null,project:null};}
  }
}
