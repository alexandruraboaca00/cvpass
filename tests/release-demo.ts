import {f9Workspace} from './f9-fixtures.js';
import {validateProject} from '../src/domain/index.js';
import {loadSimpleResources} from '../src/adapters/pdf/resources.js';
// Public screenshots/compatibility use only this deterministic synthetic corpus.
export async function releaseDemo(){
 const p=f9Workspace(6);if(p.snapshot.scope!=='workspace')throw Error('fixture');
 const {workspace}=p.snapshot,resources=await loadSimpleResources('resources/fonts');
 const entities=[workspace.profile!,...Object.values(workspace.cvsById)];
 for(const e of entities){
  const person=e.personalInformation;person.displayName='Persona Demo';person.givenName=null;person.familyName=null;person.otherNames=[];person.birthDate=null;person.nationalities=[];person.addresses=[];person.gender=null;person.identifiers=[];
  person.contacts=person.contacts.filter(c=>c.kind==='email');for(const c of person.contacts)if(c.kind==='email')c.value='demo@example.test';
  if(e.kind==='cv'){e.presentation.templateRef={id:'simple',version:1};e.presentation.personalFieldVisibility.contacts=person.contacts.map(c=>c.id);e.presentation.personalFieldVisibility.addresses=[];}
 }
 workspace.cvOrder.forEach((id,i)=>{workspace.cvsById[id]!.name=['CV demo · breve','CV demo · completo','CV demo · trayectoria','CV demo · habilidades','CV demo · idiomas','CV demo · actividades'][i]!;});
 p.snapshot.templates=[resources.template];Object.assign(p.snapshot.assetsById,resources.resources.assetsById);for(const[h,b]of resources.resources.blobs)p.blobs.set(h,b);
 p.snapshot=validateProject(p.snapshot);return p;
}
