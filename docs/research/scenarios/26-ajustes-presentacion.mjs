import {browser,imported,log,exportPdf,ROOT} from './cierre-helpers.mjs';
const b=await browser();try{
 const p=await imported(b,`${ROOT}/fechas-confirmadas.pdf`);
 const color=p.locator('select').filter({has:p.locator('option[value="dark-green"]')});
 for(const value of ['none','dark-blue','light-blue','dark-green','light-green','dark-purple','light-purple']){await color.selectOption(value,{force:true});await exportPdf(p,`color-${value}`);}
 for(const size of ['small','large']){
  await p.locator('select').filter({has:p.locator('option[value="medium"]')}).selectOption(size,{force:true});
  await p.locator('select').filter({has:p.locator('option[value="first"]')}).selectOption(size==='small'?'none':'all',{force:true});
  await p.locator('select').filter({has:p.locator('option[value="true"]')}).selectOption('true',{force:true});
  await p.locator('#cv-date-format-picker').selectOption('yyyy/MM/dd',{force:true});await exportPdf(p,`ajuste-${size}`);
 }
 const q=await imported(b,`${ROOT}/ajuste-large.pdf`);log('style-reimport',{dateFormat:await q.locator('#cv-date-format-picker').inputValue(),selects:await q.locator('select').evaluateAll(es=>es.filter(e=>Array.from(e.options).some(o=>['medium','all','true','dark-green'].includes(o.value))).map(e=>({value:e.value,options:Array.from(e.options).map(o=>o.value)})))});
}catch(e){log('error',{message:e.message.slice(0,1800)});process.exitCode=1;}finally{await b.close();}
