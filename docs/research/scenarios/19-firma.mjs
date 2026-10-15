import {browser,imported,edit,save,log,exact,exportPdf,ROOT} from './cierre-helpers.mjs';
const b=await browser();try{
 const p=await imported(b);await edit(p,26);await exact(p,'Upload').click();
 log('signature-upload',{text:(await p.locator('body').innerText()).slice(-4500),files:await p.locator('input[type="file"]').evaluateAll(es=>es.map(e=>({accept:e.accept,multiple:e.multiple,id:e.id}))),buttons:await p.locator('button').filter({visible:true}).allTextContents()});
 for(const file of ['firma-no-imagen.txt','firma-grande.png','firma-ficticia.png']){
  await p.locator('input[type="file"]').last().setInputFiles(`${ROOT}/${file}`);await p.waitForTimeout(650);log('signature-selected',{file,text:(await p.locator('body').innerText()).slice(-4500),buttons:await p.locator('button').filter({visible:true}).allTextContents()});
 }
 const s=exact(p,'Save').filter({visible:true});if(await s.count()>1)await s.last().click();else{const upload=exact(p,'Upload').filter({visible:true});if(await upload.count()&&await upload.last().isEnabled())await upload.last().click();}
 log('signature-applied',{save:await save(p),images:await p.locator('img').evaluateAll(es=>es.filter(e=>e.src.startsWith('data:')).map(e=>({alt:e.alt,length:e.src.length})))});
 const file=await exportPdf(p,'con-firma');const q=await imported(b,file);log('signature-reimport',{images:await q.locator('img').evaluateAll(es=>es.filter(e=>e.src.startsWith('data:')).map(e=>({alt:e.alt,length:e.src.length}))),text:(await q.locator('body').innerText()).slice(-1200)});
}catch(e){log('error',{message:e.message.slice(0,2500)});process.exitCode=1;}finally{await b.close();}
