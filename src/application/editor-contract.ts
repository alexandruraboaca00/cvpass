import type { EditorLibraryView, EditorDocumentView, PhotoView } from './editor.js';
import type { EditorForm, EditorIssue, EditorTarget } from './editor-model.js';
import type { SectionKind } from '../domain/index.js';
export type BeginEditorTarget=EditorTarget|{kind:'newEntry';sectionId:string;entryKind?:'nativeLanguage'|'foreignLanguage'}|{kind:'newCustomSection'};
export interface EditorFailure {code:string;issues:EditorIssue[]}
export type EditorResult<T> = {ok:true;value:T}|{ok:false;error:EditorFailure};
export interface EditorApi {
  list():Promise<EditorResult<EditorLibraryView>>;
  create(name:string,displayName:string):Promise<EditorResult<EditorDocumentView>>;
  open(id:string):Promise<EditorResult<EditorDocumentView>>;
  setUiLocale(locale:'es'|'en'):Promise<EditorResult<EditorLibraryView>>;
  duplicate(cvId:string,revision:number,name:string):Promise<EditorResult<EditorDocumentView>>;
  revisions(cvId:string):Promise<EditorResult<{id:string;number:number;cause:string;pinned:boolean}[]>>;
  restore(cvId:string,revision:number,checkpointId:string):Promise<EditorResult<EditorDocumentView>>;
  addSection(cvId:string,revision:number,kind:Exclude<SectionKind,'custom'>):Promise<EditorResult<EditorDocumentView>>;
  begin(cvId:string,revision:number,target:BeginEditorTarget):Promise<EditorResult<EditorForm>>;
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
