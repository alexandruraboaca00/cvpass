import {browser,imported,edit,log,exact} from './cierre-helpers.mjs';
const b=await browser();try{const p=await imported(b);await edit(p,4);const e=p.locator('[contenteditable="true"]').filter({visible:true}).first();
 for(const n of [1000,4000,8000,16000]){await e.click();await e.press('Control+a');await e.press('Backspace');await p.keyboard.insertText('X'.repeat(n));await p.locator('input#title').click();await p.waitForTimeout(300);const text=await p.locator('body').innerText();log('text-limit',{n,enabled:await exact(p,'Save').last().isEnabled(),projectText:text.slice(text.indexOf('Projects \n'),text.indexOf('Publications \n')).replace(/X{50,}/g,'[contenido]')});}
}catch(e){log('error',{message:e.message.slice(0,1800)});process.exitCode=1;}finally{await b.close();}
