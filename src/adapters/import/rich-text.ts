import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { RichTextSchema, SafeLink, parse } from '../../domain/index.js';
import type { RichTextDoc } from '../../domain/index.js';
import { importFail } from '../../application/import-contract.js';

type Node=DefaultTreeAdapterMap['node'];
type Inline=Extract<RichTextDoc['content'][number],{kind:'paragraph'}>['content'][number];
type Mark=Extract<Inline,{kind:'text'}>['marks'][number];
type Paragraph=Extract<RichTextDoc['content'][number],{kind:'paragraph'}>;
export function importRichText(source:string):{doc:RichTextDoc;degraded:boolean} {
  if(source.length>100_000)importFail('HTML_SIZE_LIMIT');
  const fragment=parseFragment(source),blocks:RichTextDoc['content']=[];
  let degraded=false,nodes=0;
  const attributes=(node:Node)=>'attrs' in node?node.attrs:[];
  function inline(node:Node,marks:Mark[]=[],depth=0):Inline[]{
    if(++nodes>10_000||depth>64)importFail('HTML_STRUCTURE_LIMIT');
    if(node.nodeName==='#text')return [{kind:'text',text:(node as DefaultTreeAdapterMap['textNode']).value,marks}];
    if(!('tagName' in node))return [];
    const tag=node.tagName;
    if(['script','style','iframe','object','embed','img','svg','math','link','meta'].includes(tag)){degraded=true;return [];}
    if(tag==='br')return [{kind:'break'}];
    let next=marks;
    if(tag==='b'||tag==='strong')next=[...marks.filter(m=>m.kind!=='bold'),{kind:'bold'}];
    else if(tag==='i'||tag==='em')next=[...marks.filter(m=>m.kind!=='italic'),{kind:'italic'}];
    else if(tag==='a'){
      const href=attributes(node).find(a=>a.name==='href')?.value;
      if(href&&SafeLink.safeParse(href).success)next=[...marks.filter(m=>m.kind!=='link'),{kind:'link',href}];else degraded=true;
    }else if(!['span','p','div','li'].includes(tag))degraded=true;
    if(attributes(node).some(a=>a.name.startsWith('on')||!['style','class','href','target','rel','data-list','data-type'].includes(a.name)))degraded=true;
    return node.childNodes.flatMap(n=>inline(n,next,depth+1));
  }
  const paragraph=(items:Node[]):Paragraph=>({kind:'paragraph',content:items.flatMap(n=>inline(n)).filter(n=>n.kind==='break'||n.text.length>0)});
  let pending:Node[]=[];
  const flush=()=>{if(pending.length){const p=paragraph(pending);if(p.content.some(n=>n.kind==='text'&&n.text.trim()))blocks.push(p);pending=[];}};
  for(const node of fragment.childNodes){
    if('tagName' in node&&['p','div'].includes(node.tagName)){flush();blocks.push(paragraph(node.childNodes));}
    else if('tagName' in node&&['ul','ol'].includes(node.tagName)){
      flush();const style=attributes(node).find(a=>a.name==='style')?.value??'',bullet=node.tagName==='ul'||/list-style-type\s*:\s*(disc|circle|square)/i.test(style)||attributes(node).some(a=>['data-list','data-type'].includes(a.name)&&a.value==='bullet');
      const items=node.childNodes.filter((n):n is DefaultTreeAdapterMap['element']=>'tagName' in n&&n.tagName==='li').map(item=>({kind:'listItem' as const,content:[paragraph(item.childNodes)]}));
      if(items.length)blocks.push({kind:bullet?'bulletList':'orderedList',items});
      if(node.childNodes.some(n=>'tagName' in n&&n.tagName!=='li'))degraded=true;
    }else pending.push(node);
  }
  flush();return {doc:parse(RichTextSchema,{kind:'doc',content:blocks}),degraded};
}
