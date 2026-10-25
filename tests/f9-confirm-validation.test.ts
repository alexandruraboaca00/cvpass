import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDataTree,canonical,DomainError,ProjectValidationCache,validateProject} from '../src/domain/index.js';
import {f9Workspace} from './f9-fixtures.js';

// Frozen pre-optimization guard: compare rejection codes as well as acceptance.
// Malformed values exercise descriptors and arrays which JSON fixtures cannot.
function originalGuard(value:unknown,maxDepth=128):void{
  const ancestors=new Set<object>();let nodes=0;
  function fail(code:string):never{throw new Error(code);}
  function visit(v:unknown,depth:number):void{
    if(++nodes>200_000||depth>maxDepth)fail('data.limit');
    if(v===null||typeof v==='boolean'||typeof v==='string')return;
    if(typeof v==='number'){if(!Number.isFinite(v))fail('data.nonFinite');if(Object.is(v,-0))fail('data.negativeZero');return;}
    if(typeof v!=='object')fail('data.notJson');
    if(ancestors.has(v))fail('data.cycle');
    const proto=Object.getPrototypeOf(v);
    if(!Array.isArray(v)&&proto!==Object.prototype&&proto!==null)fail('data.prototype');
    if(Object.getOwnPropertySymbols(v).length)fail('data.symbolKey');
    if(Array.isArray(v)&&Object.keys(v).length!==v.length)fail('data.sparseOrExtendedArray');
    const descriptors=Object.getOwnPropertyDescriptors(v);ancestors.add(v);
    for(const key of Object.keys(descriptors)){
      const d=descriptors[key]!;if(d.get||d.set)fail('data.accessor');if(!d.enumerable)continue;
      if(key==='__proto__'||key==='prototype'||key==='constructor')fail('data.unsafeKey');
      visit(d.value,depth+1);
    }
    ancestors.delete(v);
  }
  visit(value,0);
}
const outcome=(fn:()=>void):string=>{try{fn();return 'accepted';}catch(e){return e instanceof DomainError?e.issues[0]!.message:(e as Error).message;}};
test('F9 faster data guard preserves hostile descriptors, array semantics, bounds and rejection precedence',()=>{
  let called=0;const getter=()=>{called++;return 'not executed';};
  const cycle:Record<string,unknown>={};cycle.self=cycle;
  const sparse=new Array(2),extended=Object.assign([1],{extra:2});
  const hiddenIndex=[1];Object.defineProperty(hiddenIndex,'0',{enumerable:false,value:1});
  const symbolAndGetter=Object.defineProperty({[Symbol('blocked')]:1},'value',{get:getter,enumerable:true});
  let deep:unknown=1;for(let i=0;i<130;i++)deep={child:deep};
  const cases:unknown[]=[null,true,'á ă ș',0,NaN,Infinity,-Infinity,-0,undefined,()=>1,1n,Symbol('blocked'),
    Object.create(null),Object.create({inherited:1}),new Date(),cycle,sparse,extended,hiddenIndex,symbolAndGetter,
    Object.defineProperty({},'hidden',{get:getter}),Object.defineProperty({},'shown',{get:getter,enumerable:true}),
    Object.defineProperty([],'hidden',{get:getter}),JSON.parse('{"__proto__":1}'),{constructor:1},{prototype:1},
    Object.defineProperty({},'hidden',{value:undefined,enumerable:false}),deep,Array.from({length:200_000},()=>0)];
  const shared={value:'safe'};cases.push({a:shared,b:shared},f9Workspace(6).snapshot);
  for(const value of cases)assert.equal(outcome(()=>assertDataTree(value)),outcome(()=>originalGuard(value)));
  assert.equal(called,0);
});

test('F9 exact-value identifier summaries cannot be mutated or hide changed/current/historical ownership',()=>{
  const source=f9Workspace(6).snapshot;if(source.scope!=='workspace')throw Error('fixture');
  const memo=new ProjectValidationCache(),parsed=validateProject(source,memo);if(parsed.scope!=='workspace')throw Error();
  const [a,b]=source.workspace.cvOrder,cv=parsed.workspace.cvsById[a!]!;
  const ids=memo.identifiers(cv) as string[],expected=[...ids];ids.length=0;
  assert.deepEqual(memo.identifiers(cv),expected);assert.equal(memo.encoded(cv),JSON.stringify(cv));
  cv.name='Mutated caller result';assert.equal(canonical(validateProject(source,memo)),canonical(validateProject(source)));
  const collision=structuredClone(source),other=collision.workspace.cvsById[b!]!,oldId=other.personalInformation.contacts[0]!.id,newId=source.workspace.cvsById[a!]!.personalInformation.contacts[0]!.id;
  other.personalInformation.contacts[0]!.id=newId;other.presentation.personalFieldVisibility.contacts=other.presentation.personalFieldVisibility.contacts.map(id=>id===oldId?newId:id);
  assert.throws(()=>validateProject(collision,memo));assert.throws(()=>validateProject(collision));
  const history=structuredClone(source),owner=history.workspace.cvsById[b!]!,snapshot=structuredClone(owner);owner.revision++;
  snapshot.personalInformation.contacts[0]!.id=source.workspace.cvsById[a!]!.personalInformation.contacts[0]!.id;
  snapshot.presentation.personalFieldVisibility.contacts=snapshot.presentation.personalFieldVisibility.contacts.map(id=>id===oldId?newId:id);
  history.revisions.push({id:'00000000-0000-4000-8000-000000008888',entityId:owner.id,entityKind:'cv',number:snapshot.revision,createdAt:owner.updatedAt,cause:'edit',retention:'ordinary',snapshot});
  assert.throws(()=>validateProject(history,memo),/revision.crossOwnerId/);assert.throws(()=>validateProject(history),/revision.crossOwnerId/);
  assert.equal(canonical(validateProject(source,memo)),canonical(validateProject(source)));
});
