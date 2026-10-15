import {browser,imported,edit,save,log,exportPdf,ROOT} from './cierre-helpers.mjs';
const b=await browser();try{
 const p=await imported(b,`${ROOT}/con-firma.pdf`);for(const idx of [4,10,22]){await edit(p,idx);
 const e=p.locator('[contenteditable="true"]').filter({visible:true}).first();await e.click();await e.press('Control+a');await e.press('Backspace');
 await e.press('Control+b');await p.keyboard.insertText('NEGRITA_REA');await e.press('Control+b');await e.press('Enter');await e.press('Control+i');await p.keyboard.insertText('CURSIVA_REA');await e.press('Control+i');await e.press('Enter');
 const lines=Array.from({length:16},(_,i)=>`PARRAFO_REA_${idx}_${String(i+1).padStart(3,'0')} Experiencia ficticia de investigación, análisis de datos, documentación y colaboración. Formación técnica con acentos, resultados verificables y mejora de procesos para este currículum de prueba.`);
 await p.keyboard.insertText(lines.join('\n\n'));await p.locator('input#title').click();
 log('long-text-before-save',{idx,characters:(await e.innerText()).length,starts:(await e.innerText()).slice(0,120),strong:await e.locator('strong,b').count(),italic:await e.locator('em,i').count()});
 const result=await save(p);log('long-save',{idx,result});if(result.formRemains)throw Error('Texto largo no guardado');}
 const selects=await p.locator('select').evaluateAll(es=>es.map((e,index)=>({index,value:e.value,options:Array.from(e.options).map(o=>o.value)})));log('style-selects',{selects:selects.filter(x=>x.options.length<9)});
 const index=selects.find(x=>x.options.includes('dynamic-cv-1')).index;
 for(const [value,label] of [['dynamic-cv-1','Classic'],['dynamic-cv-2','Modern'],['cv-formal','Progress'],['cv-semi-formal','Timeline'],['cv-3','Accent'],['cv-4','Elegant']]){
  const t=performance.now();await p.locator('select').nth(index).selectOption(value,{force:true});await p.waitForTimeout(2200);await exportPdf(p,`plantilla-${label.toLowerCase()}`);log('template-done',{label,value,elapsedMs:Math.round(performance.now()-t)});
 }
 const q=await imported(b,`${ROOT}/plantilla-accent.pdf`);await edit(q,4);const d=q.locator('[contenteditable="true"]').filter({visible:true}).first();log('long-reimport',{characters:(await d.innerText()).length,first:(await d.innerText()).slice(0,140),last:(await d.innerText()).slice(-140),strong:await d.locator('strong,b').count(),italic:await d.locator('em,i').count(),paragraphMarkers:(await d.innerText()).match(/PARRAFO_REA_/g)?.length??0});
}catch(e){log('error',{message:e.message.slice(0,2000)});process.exitCode=1;}finally{await b.close();}
