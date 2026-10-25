import type Database from 'better-sqlite3';
import {referencedAssets} from '../../domain/index.js';
import type {Entity,Revision} from '../../domain/index.js';
import type {LibraryContent} from '../../application/contracts.js';
import {currentEntities} from '../../application/library-state.js';
import {measure} from '../../application/timing.js';
import {reject} from '../../application/contracts.js';

// Conservative proof over already validated, private snapshots. This is not an
// operation inferred from IDs/revisions alone: compare every unchanged value.
// Imports, resources, reorderings and any other edit use the full transaction.
export interface SingleConfirmation {
  entity:Entity; previous:Entity; revision:Revision; draftId:string;
  entityJson:string; snapshotJson:string;
}
export function singleConfirmation(previous:LibraryContent,next:LibraryContent,encoded:(e:Entity)=>string|undefined):SingleConfirmation|null{
  const json=(v:unknown)=>measure('storage.comparisonEncoding',()=>JSON.stringify(v)),entityJson=(e:Entity)=>encoded(e)??json(e);
  if(previous.workspace.id!==next.workspace.id||json(previous.workspace.settings)!==json(next.workspace.settings)||
    json(previous.workspace.cvOrder)!==json(next.workspace.cvOrder)||json(previous.templates)!==json(next.templates)||
    json(previous.assetsById)!==json(next.assetsById)||previous.blobs.size!==next.blobs.size)return null;
  for(const[hash,bytes]of previous.blobs){const after=next.blobs.get(hash);if(!after||bytes.byteLength!==after.byteLength||
    !Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength).equals(Buffer.from(after.buffer,after.byteOffset,after.byteLength)))return null;}
  const before=new Map(currentEntities(previous).map(e=>[e.id,e])),after=currentEntities(next);
  if(before.size!==after.length)return null;
  let changed:{entity:Entity;previous:Entity;entityJson:string;oldJson:string}|undefined;
  for(const entity of after){const old=before.get(entity.id);if(!old||old.kind!==entity.kind)return null;
    const oldJson=json(old),newJson=entityJson(entity);
    if(oldJson!==newJson){if(changed)return null;changed={entity,previous:old,entityJson:newJson,oldJson};}
  }
  if(!changed||changed.entity.revision!==changed.previous.revision+1||next.revisions.length!==previous.revisions.length+1)return null;
  for(let i=0;i<previous.revisions.length;i++){
    const a=previous.revisions[i]!,b=next.revisions[i]!;
    if(a.id!==b.id||a.entityId!==b.entityId||a.entityKind!==b.entityKind||a.number!==b.number||a.createdAt!==b.createdAt||
      a.cause!==b.cause||a.retention!==b.retention||json(a.snapshot)!==entityJson(b.snapshot))return null;
  }
  const revision=next.revisions.at(-1)!,snapshotJson=entityJson(revision.snapshot);
  if(revision.entityId!==changed.entity.id||revision.entityKind!==changed.entity.kind||revision.number!==changed.previous.revision||snapshotJson!==changed.oldJson)return null;
  if(next.drafts.length!==previous.drafts.length-1)return null;
  const retained=new Set(next.drafts.map(d=>d.id)),removed=previous.drafts.filter(d=>!retained.has(d.id));
  if(removed.length!==1||removed[0]!.entityId!==changed.entity.id||removed[0]!.baseRevision!==changed.previous.revision||
    json(previous.drafts.filter(d=>d.id!==removed[0]!.id))!==json(next.drafts))return null;
  return {entity:changed.entity,previous:changed.previous,entityJson:changed.entityJson,revision,snapshotJson,draftId:removed[0]!.id};
}

// Caller holds BEGIN IMMEDIATE, has verified generation + external data_version,
// and has validated the complete graph/bytes. All writes stay in that transaction.
export function writeSingleConfirmation(db:Database.Database,plan:SingleConfirmation,generation:number,afterEntities:()=>void):void{
  const e=plan.entity,r=plan.revision;
  measure('storage.writeEntity',()=>{
    const updated=db.prepare('UPDATE entities SET revision=?,name=?,locale=?,template_id=?,template_version=?,snapshot_json=? WHERE id=? AND revision=? AND kind=?')
      .run(e.revision,e.kind==='cv'?e.name:null,e.kind==='cv'?e.documentLocale:null,e.kind==='cv'?e.presentation.templateRef.id:null,e.kind==='cv'?e.presentation.templateRef.version:null,plan.entityJson,e.id,plan.previous.revision,e.kind);
    if(updated.changes!==1)reject('LIBRARY_CONFLICT');
  });
  afterEntities();
  measure('storage.writeRevision',()=>db.prepare('INSERT INTO revisions VALUES (?,?,?,?,?,?,?,1)').run(r.id,r.entityId,r.number,r.cause,r.retention,r.createdAt,plan.snapshotJson));
  measure('storage.writeReferences',()=>{
    const before=referencedAssets(plan.previous),after=referencedAssets(e);
    const unlink=db.prepare('DELETE FROM entity_assets WHERE entity_id=? AND asset_id=?'),link=db.prepare('INSERT INTO entity_assets VALUES (?,?)');
    for(const id of before)if(!after.has(id))unlink.run(e.id,id);
    for(const id of after)if(!before.has(id))link.run(e.id,id);
    const historical=db.prepare('INSERT INTO revision_assets VALUES (?,?)');for(const id of referencedAssets(r.snapshot))historical.run(r.id,id);
  });
  measure('storage.resolveDraft',()=>{if(db.prepare('DELETE FROM drafts WHERE id=?').run(plan.draftId).changes!==1)reject('DRAFT_CONFLICT');});
  measure('storage.writeMetadata',()=>db.prepare('UPDATE workspace SET generation=? WHERE slot=1').run(generation));
}
