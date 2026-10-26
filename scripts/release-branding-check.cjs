// Technical PNG validation; does not alter the supplied designs.
const {app,nativeImage}=require('electron');
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
app.whenReady().then(()=>{
 const results=[];
 for(const path of ['assets/branding/icon-master.png','assets/branding/logo-horizontal.png',...[16,24,32,48,64,128,256,512,1024].map(n=>`assets/icons/${n}x${n}.png`)]){
  const bytes=fs.readFileSync(path);assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  const image=nativeImage.createFromBuffer(bytes);assert(!image.isEmpty());const {width,height}=image.getSize(),bitmap=image.toBitmap();let transparent=0,partial=0,opaque=0;
  for(let i=3;i<bitmap.length;i+=4){if(bitmap[i]===0)transparent++;else if(bitmap[i]===255)opaque++;else partial++;}
  assert(transparent>0&&opaque>0,'Transparency and artwork required');
  for(const i of [0,width-1,(height-1)*width,width*height-1])assert.equal(bitmap[i*4+3],0,'Corners must be transparent, not opaque black/white');
  const n=Number(path.match(/\/(\d+)x\d+\.png$/)?.[1]);if(n){assert.equal(width,n);assert.equal(height,n);}
  results.push({path,width,height,transparent,partial,opaque,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 const output=process.env.CVPASS_BRANDING_REPORT;if(output)fs.writeFileSync(output,JSON.stringify({masterUnmodified:true,technicalPaddingOnly:true,quality:'nativeImage best',results},null,2)+'\n');
 console.log('Official CVPass PNG/alpha/dimensions PASS');app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
