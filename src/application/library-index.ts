import type {LibraryContent,LibraryIndex} from './contracts.js';
// Called only with validated content. Return newly allocated metadata, no aliases
// into the private snapshot and no blob/history/form materialization over IPC.
export function libraryIndex(content:LibraryContent):LibraryIndex {
  const {workspace,drafts}=content,pending=new Set(drafts.map(d=>d.entityId));
  return {cvs:workspace.cvOrder.map(id=>{const cv=workspace.cvsById[id]!;return {id,name:cv.name,revision:cv.revision,documentLocale:cv.documentLocale,hasDraft:pending.has(id)};}),
    profileName:workspace.profile?.personalInformation.displayName??null,profileId:workspace.profile?.id??null,uiLocale:workspace.settings.uiLocale,
    recovery:drafts.map(d=>({id:d.id,cvId:d.entityId,name:workspace.cvsById[d.entityId]?.name??'Perfil',conflict:(workspace.profile?.id===d.entityId?workspace.profile:workspace.cvsById[d.entityId])!.revision!==d.baseRevision}))};
}
