import { fail, assertDataTree, canonical } from '../domain/primitives.js';
export function encodeJson(value:unknown):Uint8Array{assertDataTree(value);return new TextEncoder().encode(canonical(value));}
export function decodeJson(bytes:Uint8Array,maxBytes=10*1024*1024):unknown{
 if(bytes.length>maxBytes)fail('json.sizeLimit');let text:string;
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('json.invalidUtf8');}
 let at=0,nodes=0;
 const ws=()=>{while(/[\x20\t\r\n]/.test(text[at]??'!'))at++;};
 function string():string{
  const match=/^"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/.exec(text.slice(at));
  if(!match)fail('json.invalidString');at+=match[0].length;return JSON.parse(match[0]) as string;
 }
 function value(depth:number):unknown{
  if(depth>128||++nodes>200_000)fail('json.depthOrNodeLimit');ws();const c=text[at];
  if(c==='"')return string();
  if(c==='{'){
   at++;ws();const result:Record<string,unknown>={},seen=new Set<string>();if(text[at]==='}'){at++;return result;}
   while(true){ws();const key=string();if(seen.has(key))fail('json.duplicateKey');if(['__proto__','constructor','prototype'].includes(key))fail('json.unsafeKey');seen.add(key);ws();if(text[at++]!==':')fail('json.expectedColon');result[key]=value(depth+1);ws();const delimiter=text[at++];if(delimiter==='}')return result;if(delimiter!==',')fail('json.expectedComma');}
  }
  if(c==='['){at++;ws();const result:unknown[]=[];if(text[at]===']'){at++;return result;}while(true){result.push(value(depth+1));ws();const delimiter=text[at++];if(delimiter===']')return result;if(delimiter!==',')fail('json.expectedComma');}}
  const token=/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(text.slice(at));if(!token)fail('json.invalidToken');at+=token[0].length;const v=JSON.parse(token[0]) as unknown;if(typeof v==='number'){if(!Number.isFinite(v))fail('json.nonFinite');if(Object.is(v,-0))fail('data.negativeZero');}return v;
 }
 // The parser constructs only fresh plain objects/dense arrays and already
 // checks every key, scalar, depth and node budget. A second descriptor walk
 // cannot discover accessors, symbols, cycles or prototypes in this output.
 const result=value(0);ws();if(at!==text.length)fail('json.trailingData');return result;
}
