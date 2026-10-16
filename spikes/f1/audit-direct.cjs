// Inventory direct npm dependencies only, using installed metadata and license texts.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const manifest=require('./package.json');
const purposes={'@huggingface/transformers':'Exploración ES/EN previa; no ejecutada ni ampliada en el cierre','better-sqlite3':'Persistencia SQLite en worker','pdf-lib':'Adjuntar/retirar payload e inspección de objetos PDF','pdfjs-dist':'Visor, texto, etiquetas, anotaciones y extracción de payload','react':'UI mínima de la prueba','react-dom':'Montaje de UI','electron':'Runtime Chromium/Node empaquetado','electron-builder':'Empaquetado Linux y reconstrucción nativa','typescript':'Comprobación de TSX','vite':'Bundle local de la UI','@types/react':'Tipos de React para validación','@types/react-dom':'Tipos de React DOM para validación'};
const rows=[];
for(const name of Object.keys({...manifest.dependencies,...manifest.devDependencies})){
 const base=path.join(__dirname,'node_modules',name),info=JSON.parse(fs.readFileSync(path.join(base,'package.json')));
 const files=fs.readdirSync(base).filter(f=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(f));
 if(!files.length||!['MIT','Apache-2.0'].includes(info.license))throw new Error(`Review license: ${name}`);
 rows.push({package:name,version:info.version,license:info.license,purpose:purposes[name],evidence:files.map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex')}))});
}
const target=path.resolve(__dirname,'../../docs/validation/f1-direct-licenses.json');fs.writeFileSync(target,JSON.stringify(rows,null,2)+'\n');console.log(`${rows.length} direct dependencies with license evidence: ${path.basename(target)}`);
