import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEditorJson, fromEditorJson } from '../src/ui/rich-codec.js';
import type { RichTextDoc } from '../src/domain/index.js';
test('F4 rich text maps paragraphs, breaks, marks, links and both flat list types to the domain without HTML',()=>{
  const p = {kind:'paragraph' as const,content:[{kind:'text' as const,text:'Texto Șț áé',marks:[{kind:'bold' as const},{kind:'italic' as const},{kind:'link' as const,href:'https://example.test'}]},{kind:'break' as const},{kind:'text' as const,text:'Segundo',marks:[]}]};
  const doc:RichTextDoc = {kind:'doc',content:[p,{kind:'bulletList',items:[{kind:'listItem',content:[p]}]},{kind:'orderedList',items:[{kind:'listItem',content:[p,p]}]}]};
  assert.deepEqual(fromEditorJson(toEditorJson(doc)),doc);
});
test('F4 unsupported rich structures and unsafe links are rejected instead of silently losing meaning',()=>{
  for (const value of [{type:'doc',content:[{type:'heading'}]},{type:'doc',content:[{type:'orderedList',attrs:{start:5}}]},{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]},{type:'doc',content:[{type:'bulletList',content:[{type:'listItem',content:[{type:'bulletList'}]}]}]}]) assert.throws(()=>fromEditorJson(value));
});
