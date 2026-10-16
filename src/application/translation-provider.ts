import { validateLanguagePlan } from '../domain/index.js';
import type { CvDocument, LanguagePlan } from '../domain/index.js';
import { reject } from './contracts.js';

// A provider sees individual classified fragments, never a CV, a library, B names,
// approval memory, paths, identifiers or assets. No production engine is installed in F5.
export interface TranslationRequest {id:string;kind:'narrative'|'sensitive';text:string;sourceLocale:string;targetLocale:'es'|'en'}
export interface TranslationProposal {id:string;text:string}
export interface TranslationProvider {
  readonly id:string;
  readonly offline:true;
  propose(requests:readonly TranslationRequest[],signal?:AbortSignal):Promise<readonly TranslationProposal[]>;
}
export async function proposeLanguagePlan(base:CvDocument,input:LanguagePlan,provider:TranslationProvider,signal?:AbortSignal):Promise<LanguagePlan> {
  const plan=validateLanguagePlan(base,input),requests:TranslationRequest[]=[];
  plan.fields.forEach((item,i)=>{
    if(item.class==='A')item.segments.forEach((segment,j)=>{if(!segment.protected)requests.push({id:`${i}:${j}`,kind:'narrative',text:segment.source,sourceLocale:item.source.current.locale,targetLocale:plan.targetLocale});});
    else if(item.source.original&&item.decision==='unreviewed')requests.push({id:`${i}:C`,kind:'sensitive',text:item.source.original.value,sourceLocale:item.source.original.locale,targetLocale:plan.targetLocale});
  });
  if(signal?.aborted)reject('TRANSLATION_CANCELLED');
  const proposals=await provider.propose(structuredClone(requests),signal);
  if(signal?.aborted)reject('TRANSLATION_CANCELLED');
  if(proposals.length!==requests.length||new Set(proposals.map(p=>p.id)).size!==proposals.length)reject('TRANSLATION_RESPONSE_INVALID');
  const ids=new Set(requests.map(r=>r.id));
  for(const p of proposals){
    if(!ids.has(p.id)||typeof p.text!=='string'||!p.text.trim()||p.text.length>100_000)reject('TRANSLATION_RESPONSE_INVALID');
    const [a,b]=p.id.split(':'),item=plan.fields[Number(a)]!;
    if(item.class==='A'){item.segments[Number(b)]!.translation=p.text;item.reviewed=false;}
    else {item.proposal=p.text;item.decision='unreviewed';}
  }
  return plan; // Proposals never approve themselves or persist content.
}
