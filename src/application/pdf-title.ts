import { richText } from '../domain/index.js';
import type { ExportProjection } from '../domain/index.js';
export function visiblePdfName(p:ExportProjection):string {
  const values=p.documentTitle??p.personal.find(f=>f.field==='displayName')?.values??[];
  const name=values.flatMap(v=>v.type==='text'?[typeof v.value==='string'?v.value:richText(v.value)]:[]).join(' ').replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g,' ').trim().slice(0,100);
  return (name||'CVPass')+'.pdf';
}
