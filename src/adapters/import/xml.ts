import { SaxesParser } from 'saxes';
import { IMPORT_XML_LIMIT, importFail } from '../../application/import-contract.js';

export interface XmlAttribute {local:string;uri:string;value:string}
export interface XmlNode {local:string;uri:string;attributes:XmlAttribute[];children:XmlNode[];text:string;path:string}
export const XML_NAMESPACES={eu:'http://www.europass.eu/1.0',hr:'http://www.hr-xml.org/3',oa:'http://www.openapplications.org/oagis/9',eures:'http://www.europass_eures.eu/1.0'} as const;

export function decodeXml(bytes:Uint8Array):string {
  if(bytes.length>IMPORT_XML_LIMIT)importFail('XML_SIZE_LIMIT');
  let encoding:'utf-8'|'utf-16le'|'utf-16be'='utf-8';
  if((bytes[0]===0xff&&bytes[1]===0xfe)||(bytes[0]===0x3c&&bytes[1]===0))encoding='utf-16le';
  else if((bytes[0]===0xfe&&bytes[1]===0xff)||(bytes[0]===0&&bytes[1]===0x3c))encoding='utf-16be';
  let text:string;
  try{text=new TextDecoder(encoding,{fatal:true}).decode(bytes);}catch{importFail('XML_ENCODING_INVALID');}
  const declared=/^<\?xml\s[^?]*encoding\s*=\s*['"]([^'"]+)['"]/i.exec(text)?.[1]?.toLowerCase();
  if(declared&&!(encoding==='utf-8'?['utf-8','utf8'].includes(declared):['utf-16','utf16',encoding].includes(declared)))importFail('XML_ENCODING_MISMATCH');
  return text;
}
export function parseXml(bytes:Uint8Array):XmlNode {
  const text=decodeXml(bytes);
  // Refuse DTDs before parsing, including internal entity declarations. Never install resolvers.
  if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text))importFail('XML_DTD_FORBIDDEN');
  const parser=new SaxesParser({xmlns:true}),stack:XmlNode[]=[],counts=new WeakMap<XmlNode,Map<string,number>>();
  let root:XmlNode|undefined,nodes=0,characters=0;
  parser.on('doctype',()=>importFail('XML_DTD_FORBIDDEN'));
  parser.on('error',()=>importFail('XML_INVALID'));
  parser.on('opentag',tag=>{
    if(++nodes>100_000||stack.length>=64||tag.local.length>200||tag.uri.length>300)importFail('XML_STRUCTURE_LIMIT');
    const parent=stack.at(-1),siblings=parent?counts.get(parent)!:new Map<string,number>(),key=tag.uri+'|'+tag.local,index=(siblings.get(key)??0)+1;
    siblings.set(key,index);
    const path=(parent?.path??'')+`/{${tag.uri}}${tag.local}[${index}]`;
    const attributes=Object.values(tag.attributes).filter(a=>a.uri!=='http://www.w3.org/2000/xmlns/').map(a=>({local:a.local,uri:a.uri,value:a.value}));
    if(attributes.length>100||path.length>2000)importFail('XML_STRUCTURE_LIMIT');
    const node:XmlNode={local:tag.local,uri:tag.uri,attributes,children:[],text:'',path};
    counts.set(node,new Map());
    if(parent)parent.children.push(node);else if(root)importFail('XML_INVALID');else root=node;
    stack.push(node);
  });
  const append=(value:string)=>{characters+=value.length;if(characters>IMPORT_XML_LIMIT)importFail('XML_TEXT_LIMIT');const node=stack.at(-1);if(node)node.text+=value;};
  parser.on('text',append);parser.on('cdata',append);parser.on('closetag',()=>{stack.pop();});
  try{parser.write(text).close();}catch(error){if(error instanceof Error&&'code' in error)throw error;importFail('XML_INVALID');}
  if(!root||stack.length)importFail('XML_INVALID');return root;
}
export const attribute=(node:XmlNode,name:string):string|null=>node.attributes.find(a=>a.local===name&&a.uri==='')?.value??null;
export const children=(node:XmlNode|undefined,local:string,uris:readonly string[]=[XML_NAMESPACES.eu]):XmlNode[]=>node?.children.filter(n=>n.local===local&&uris.includes(n.uri))??[];
export const child=(node:XmlNode|undefined,local:string,uris:readonly string[]=[XML_NAMESPACES.eu]):XmlNode|undefined=>children(node,local,uris)[0];
