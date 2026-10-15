import {browser,log} from './cierre-helpers.mjs';
import {inspectImport} from './compatibilidad-helpers.mjs';
import {writeFileSync} from 'node:fs';
const b=await browser();const results=[];
const cases=[...['letter-rotado','unicode-17','xml-no-compatible','xml-europass','xml-renombrado','varios-adjuntos'].map(n=>[n,'/tmp/europass-seguimiento/corpus/'+n+'.pdf']),['estandar','/tmp/europass-seguimiento/estandar.pdf']];
try{for(const [label,file] of cases){const r=await inspectImport(b,label,file,label==='xml-no-compatible'?35000:18000);results.push(r);log('compatibility-retry',r);writeFileSync('/tmp/europass-seguimiento/compatibilidad-reintentos.json',JSON.stringify(results,null,2));}}finally{await b.close();}
