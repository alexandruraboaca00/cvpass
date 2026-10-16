import type { EditorLibraryView, EditorDocumentView, PhotoView } from './editor.js';
import type { EditorForm, EditorIssue, EditorTarget } from './editor-model.js';
export interface EditorFailure {code:string;issues:EditorIssue[]}
export type EditorResult<T> = {ok:true;value:T}|{ok:false;error:EditorFailure};
export interface EditorApi {
  list():Promise<EditorResult<EditorLibraryView>>;
  create(name:string,displayName:string):Promise<EditorResult<EditorDocumentView>>;
  open(id:string):Promise<EditorResult<EditorDocumentView>>;
  addSection(cvId:string,revision:number,kind:'education'|'work'):Promise<EditorResult<EditorDocumentView>>;
  begin(cvId:string,revision:number,target:EditorTarget|{kind:'newEntry';sectionId:string}):Promise<EditorResult<EditorForm>>;
  stage(form:EditorForm):Promise<EditorResult<void>>;
  confirm(form:EditorForm):Promise<EditorResult<EditorDocumentView>>;
  cancel():Promise<EditorResult<EditorDocumentView>>;
  photo(bytes:Uint8Array,mediaType:'image/png'|'image/jpeg'):Promise<EditorResult<{form:EditorForm;photo:PhotoView}>>;
  visibility(cvId:string,revision:number,sectionId:string,entryId:string|null,included:boolean):Promise<EditorResult<EditorDocumentView>>;
  remove(cvId:string,revision:number,sectionId:string,entryId:string|null,confirm:true):Promise<EditorResult<EditorDocumentView>>;
  recover(id:string):Promise<EditorResult<{form:EditorForm;photo:PhotoView|null}>>;
  discardRecovery(id:string):Promise<EditorResult<EditorLibraryView>>;
  status():Promise<EditorResult<{status:string;error:boolean}>>;
  flush():Promise<EditorResult<void>>;
  close():Promise<EditorResult<void>>;
  onCloseRequested(callback:()=>void):()=>void;
}
