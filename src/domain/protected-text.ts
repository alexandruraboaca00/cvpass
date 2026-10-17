import { canonical, fail, NonBlank, parse } from './primitives.js';
import type { DomainContext } from './primitives.js';
import { NarrativeSchema, RichNarrativeSchema, richText } from './content.js';
import type { NarrativeField, RichNarrative } from './content.js';

// An explicit user action, also usable to review spans after editing their text.
// It never infers a person's name or silently repairs an ordinary content edit.
export function protectNarrativeTerms<T extends NarrativeField|RichNarrative>(field:T,terms:readonly string[],ctx:DomainContext):T {
  const text=typeof field.current.value==='string'?field.current.value:richText(field.current.value),spans:T['protectedSpans']=[];
  for(const value of new Set(terms)){
    parse(NonBlank,value);let at=0,count=0;
    const previous=field.protectedSpans.filter(s=>s.value===value);
    while((at=text.indexOf(value,at))>=0){spans.push({id:previous[count]?.id??ctx.newId(),start:at,end:at+value.length,value,entity:previous[count]?.entity??'term'});at+=value.length;count++;}
    if(!count)fail('translation.protectedTermMissing');
  }
  const next={...field,protectedSpans:spans,revision:field.revision+(canonical(spans)===canonical(field.protectedSpans)?0:1)};
  return (typeof field.current.value==='string'?parse(NarrativeSchema,next):parse(RichNarrativeSchema,next)) as T;
}
