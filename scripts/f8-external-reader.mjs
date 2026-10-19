import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const directory=process.env.CVFORGE_F8_OUTPUT??'/tmp/cvforge-f8/render';await mkdir(directory,{recursive:true});
const metrics=JSON.parse(await readFile(join(directory,'metrics.json'),'utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome-stable',headless:false,args:['--no-sandbox','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1400}}),results=[];
 for(const name of ['small-lateral','custom-lateral','skills-lateral','large-lateral']){
  await page.goto(pathToFileURL(join(directory,name+'.pdf')).href);await page.waitForTimeout(3000);
  const frames=[];for(const frame of page.frames()){
   const detail=await frame.evaluate(()=>{const viewer=document.querySelector('pdf-viewer');const text=[];const walk=root=>{for(const el of root.querySelectorAll('*')){if(el.shadowRoot)walk(el.shadowRoot);if(['INPUT','BUTTON','SPAN'].includes(el.tagName))text.push({tag:el.tagName,label:el.getAttribute('aria-label'),value:el.value,text:el.textContent?.slice(0,150)});}};walk(document);return {viewer:!!viewer,title:document.title,text:text.filter(v=>v.label||v.value||v.text?.trim())};}).catch(()=>({inaccessible:true}));frames.push({url:frame.url(),...detail});
  }
  assert(frames.some(f=>f.viewer),'External PDFium viewer missing');
  const viewer=page.frames().find(f=>f.url().startsWith('chrome-extension://'));assert(viewer);
  const input=viewer.locator('input[aria-label="Page number"]');await input.waitFor({state:'visible'});
  const expected=metrics.results.find(r=>r.name===name).pageCount;assert(frames.some(f=>f.viewer&&f.text.some(v=>v.tag==='SPAN'&&v.text===String(expected))),'External page count differs');
  await page.screenshot({path:join(directory,name+'-pdfium.png'),fullPage:true});
  await input.fill(String(expected));await input.press('Enter');await page.waitForTimeout(800);assert.equal(await input.inputValue(),String(expected));await page.screenshot({path:join(directory,name+'-pdfium-last.png'),fullPage:true});
  results.push({name,pageCount:expected,navigationToLastPage:true,frames});
 }
 await writeFile(join(directory,'external-reader.json'),JSON.stringify({reader:'Google Chrome PDFium',version:browser.version(),results},null,2));console.log(JSON.stringify(results.map(r=>({name:r.name,frames:r.frames.map(f=>({url:f.url,viewer:f.viewer}))}))));
}finally{await browser.close();}
