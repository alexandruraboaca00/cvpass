import {browser,log} from './cierre-helpers.mjs';
import {inspectImport} from './compatibilidad-helpers.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();const results=[];
const cases=[...['xml-20','xml-con-clave','xml-restricciones','xml-utf16'].map(n=>[n,'/tmp/europass-seguimiento/corpus/'+n+'.pdf']),...['classic','modern','progress','timeline','accent','elegant'].map(n=>['real-'+n,'/tmp/europass-cierre-investigacion/real-'+n+'.pdf'])];
try{for(const [label,file] of cases){const r=await inspectImport(b,label,file);results.push(r);log('xml-template-import',r);writeFileSync('/tmp/europass-seguimiento/compatibilidad-xml-plantillas.json',JSON.stringify(results,null,2));}}finally{await b.close();}
