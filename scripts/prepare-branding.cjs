// Packaging utility only. Never invents or replaces the selected master.
const {app,nativeImage}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.whenReady().then(()=>{
 const master=path.resolve('assets/branding/icon-master.png');
 if(!fs.existsSync(master))throw Error('Supply the selected master at assets/branding/icon-master.png; no alternative icon will be generated.');
 const image=nativeImage.createFromPath(master),size=image.getSize();
 if(image.isEmpty()||Math.min(size.width,size.height)<512)throw Error('Master must be a valid PNG of at least 512px on each side.');
 const side=Math.max(size.width,size.height),bitmap=Buffer.alloc(side*side*4),source=image.toBitmap(),left=Math.floor((side-size.width)/2),top=Math.floor((side-size.height)/2);
 for(let y=0;y<size.height;y++)source.copy(bitmap,((top+y)*side+left)*4,y*size.width*4,(y+1)*size.width*4);
 const square=nativeImage.createFromBitmap(bitmap,{width:side,height:side});
 fs.mkdirSync('assets/icons',{recursive:true});
 for(const n of [16,24,32,48,64,128,256,512,1024])fs.writeFileSync(path.resolve(`assets/icons/${n}x${n}.png`),square.resize({width:n,height:n,quality:'best'}).toPNG());
 console.log('CVPass icons generated from the supplied master.');app.quit();
}).catch(e=>{console.error(e.message);app.exit(1);});
