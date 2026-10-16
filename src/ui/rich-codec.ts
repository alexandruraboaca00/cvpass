import type { JSONContent } from '@tiptap/core';
import { parse, RichTextSchema } from '../domain/index.js';
import type { RichTextDoc } from '../domain/index.js';

export function toEditorJson(input:RichTextDoc):JSONContent {
  const paragraph = (p:Extract<RichTextDoc['content'][number],{kind:'paragraph'}>):JSONContent => ({type:'paragraph',content:p.content.map(n=>n.kind === 'break' ? {type:'hardBreak'} : {type:'text',text:n.text,marks:n.marks.map(m=>m.kind === 'link' ? {type:'link',attrs:{href:m.href}} : {type:m.kind})})});
  return {type:'doc',content:input.content.length ? input.content.map(b=>b.kind === 'paragraph' ? paragraph(b) : {type:b.kind,content:b.items.map(i=>({type:'listItem',content:i.content.map(paragraph)}))}) : [{type:'paragraph'}]};
}
export function fromEditorJson(input:JSONContent):RichTextDoc {
  const bad = ():never=>{throw new Error('RICH_TEXT_UNSUPPORTED');};
  const paragraph = (p:JSONContent):Extract<RichTextDoc['content'][number],{kind:'paragraph'}> => {
    if (p.type !== 'paragraph') return bad();
    return {kind:'paragraph',content:(p.content ?? []).map(n=>{
      if (n.type === 'hardBreak') return {kind:'break'};
      if (n.type !== 'text' || typeof n.text !== 'string') return bad();
      return {kind:'text',text:n.text,marks:(n.marks ?? []).map(m=>m.type === 'bold' || m.type === 'italic' ? {kind:m.type} : m.type === 'link' && typeof m.attrs?.href === 'string' ? {kind:'link',href:m.attrs.href} : bad())};
    })};
  };
  if (input.type !== 'doc') return bad();
  return parse(RichTextSchema,{kind:'doc',content:(input.content ?? []).map(b=>{
    if (b.type === 'paragraph') return paragraph(b);
    if (b.type !== 'bulletList' && b.type !== 'orderedList') return bad();
    if (b.type === 'orderedList' && b.attrs?.start != null && b.attrs.start !== 1) return bad();
    return {kind:b.type,items:(b.content ?? []).map(i=>{if (i.type !== 'listItem') return bad();return {kind:'listItem',content:(i.content ?? []).map(paragraph)};})};
  })});
}
