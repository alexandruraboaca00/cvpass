import type { LanguagePlan } from '../src/domain/index.js';
export function manualPlan(plan:LanguagePlan):LanguagePlan {
  const copy=structuredClone(plan);
  for(const item of copy.fields){if(item.class==='A'){item.reviewed=true;for(const s of item.segments)if(!s.protected)s.translation='Reviewed English text';}
    else if(item.decision==='unreviewed')item.decision=item.source.original?'keepOriginal':'keepImported';}
  return copy;
}
