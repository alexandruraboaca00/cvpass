// Packaging utility only. Never invents or replaces the selected master.
const {app,nativeImage}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.whenReady().then(()=>{
 const master=path.resolve('assets/branding/icon-master.png');
 if(!fs.existsSync(master))throw Error('Supply the selected master at assets/branding/icon-master.png; no alternative icon will be generated.');
 const image=nativeImage.createFromPath(master),size=image.getSize();
 if(image.isEmpty()||size.width!==size.height||size.width<512)throw Error('Master must be a square PNG of at least 512px; 1024px recommended.');
 fs.mkdirSync('assets/icons',{recursive:true});
 for(const n of [16,24,32,48,64,128,256,512,1024])fs.writeFileSync(path.resolve(`assets/icons/${n}x${n}.png`),image.resize({width:n,height:n,quality:'best'}).toPNG());
 console.log('CVPass icons generated from the supplied master.');app.quit();
}).catch(e=>{console.error(e.message);app.exit(1);});
