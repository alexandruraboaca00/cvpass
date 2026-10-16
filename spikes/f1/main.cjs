const {app, BrowserWindow, session, nativeImage} = require('electron');
const {Worker} = require('node:worker_threads');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {PDFDocument} = require('pdf-lib');
const root = process.env.CVFORGE_F1_OUTPUT;
if (!root || !path.isAbsolute(root)) throw new Error('Set CVFORGE_F1_OUTPUT to an absolute temporary output directory');
app.setPath('userData', path.join(root, 'electron-profile'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function sqlite(create, image) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'sqlite-worker.cjs'), {workerData: {path: path.join(root, 'probe.sqlite'), create, image}});
    let result;
    worker.on('message', value => {result = value;});
    worker.on('error', reject);
    worker.on('exit', code => code || !result || result.error ? reject(new Error(result?.error || `Worker exit ${code}`)) : resolve(result));
  });
}
async function translate(cancel) {
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'translation-worker.mjs'), {workerData:{models:app.isPackaged ? path.join(process.resourcesPath, 'models') : path.join(__dirname, '.cache/models')}});
    let result, progressEvents = 0;
    worker.on('error', reject);
    worker.on('message', async value => {
      if (value.error) reject(new Error(value.error));
      if (value.progress) progressEvents++;
      if (cancel && value.ready) {await worker.terminate(); resolve({cancelled:true,progressEvents,elapsedMs:Math.round(performance.now()-started)});}
      if (value.result) result = value;
    });
    worker.on('exit', code => {if (!cancel) code || !result ? reject(new Error(`Translation worker exit ${code}`)) : resolve({...result,progressEvents});});
  });
}
async function run() {
  await fs.mkdir(root, {recursive: true});
  let networkAttempts = 0;
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (/^https?:/.test(details.url)) {networkAttempts++; callback({cancel: true});} else callback({});
  });
  const window = new BrowserWindow({show: false, webPreferences:{sandbox:true, contextIsolation:true, nodeIntegration:false}});
  await window.loadFile(path.join(__dirname, 'dist/index.html'));
  const inspect = (bytes, draw = false) => window.webContents.executeJavaScript(`window.inspectPdf(${JSON.stringify(bytes.toString('base64'))}, ${draw})`);
  // Original 4x2 image has red pixels outside the crop; only the blue 2x2 crop is exported.
  const original = nativeImage.createFromBitmap(Buffer.from([0,0,255,255,0,0,255,255,255,0,0,255,255,0,0,255,0,0,255,255,0,0,255,255,255,0,0,255,255,0,0,255]), {width:4,height:2});
  const cropped = original.crop({x:2,y:0,width:2,height:2}).toPNG();
  const create = process.argv.includes('--create');
  const stored = await sqlite(create, original.toPNG());
  assert.equal(stored.integrity, 'ok');
  assert.equal(stored.imageHash, hash(original.toPNG()));
  assert.equal(stored.text, 'Entidad sintética Ștefan');
  const report = {packaged:app.isPackaged, versions:process.versions, mode:create?'create':'reopen', sqlite:stored, layouts:[], networkAttempts:0, platform:process.platform, arch:process.arch, memory:os.totalmem(), cpu:os.cpus()[0]?.model};
  if (process.argv.includes('--verify-existing')) {
    for (const layout of ['simple','lateral']) {
      const before = await inspect(await fs.readFile(path.join(root, `${layout}-before.pdf`)));
      const after = await inspect(await fs.readFile(path.join(root, `${layout}.pdf`)), true);
      assert.deepEqual(after.pages, before.pages);
      assert.equal(JSON.parse(after.payload).layout, layout);
    }
    await fs.writeFile(path.join(root, 'verified-new-process.json'), JSON.stringify({sqlite: stored, pdfRecovery: true}));
    window.destroy(); return;
  }
  const privateFixture = {hidden:'PRIVATE_HIDDEN_715', alternative:'PRIVATE_ALT_716', date:'2020-05-17', photo:original.toPNG()};
  const glyphs = 'Español: áéíóú ñ ¿Qué? English: résumé. Română: ă â î ș ț Ș Ț.';
  for (const layout of ['simple','lateral']) {
    const started = performance.now();
    const payload = {format:'cvforge-export-probe',pdfPayloadFormatVersion:1,layout,year:privateFixture.date.slice(0,4),glyphs,photo:cropped.toString('base64'),paragraphs:Array.from({length:48},(_,i)=>`P${String(i+1).padStart(2,'0')} Desarrollo de herramientas locales y documentación de procesos. Prueba de narrativa larga con datos sintéticos propios.`)};
    const printWindow = new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>@page{size:A4;margin:16mm}body{font:12px sans-serif;line-height:1.5}h1,h2{break-after:avoid}p{orphans:3;widows:3;overflow-wrap:anywhere}.columns{column-count:${layout==='lateral'?2:1};column-gap:24px}img{width:48px}</style></head><body><h1>CV sintético</h1><img alt="Recorte azul sintético" src="data:image/png;base64,${payload.photo}"><p>${glyphs}</p><p>${payload.year}</p><a href="https://example.org/cv">Enlace de prueba</a><main class="columns">${payload.paragraphs.map(p=>`<section><h2>${p.slice(0,3)}</h2><p>${p}</p></section>`).join('')}</main></body></html>`;
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const before = await printWindow.webContents.printToPDF({printBackground:true,generateTaggedPDF:true,pageSize:'A4',preferCSSPageSize:true});
    printWindow.destroy();
    const pdf = await PDFDocument.load(before);
    await pdf.attach(Buffer.from(JSON.stringify(payload)), 'cvforge-export.json', {mimeType:'application/json',description:'Only represented synthetic export'});
    const after = Buffer.from(await pdf.save());
    const originalFacts = await inspect(before);
    const finalFacts = await inspect(after, true);
    assert.deepEqual(finalFacts.pages, originalFacts.pages);
    assert.deepEqual(JSON.parse(finalFacts.payload), payload);
    const visibleText = finalFacts.pages.map(p=>p.text).join(' ');
    for (let n=1;n<=48;n++) assert(visibleText.includes(`P${String(n).padStart(2,'0')} Desarrollo`));
    for (const word of ['Español','Română','Ș','Ț']) assert(visibleText.includes(word));
    assert(finalFacts.pages.some(p=>p.links.includes('https://example.org/cv')));
    assert(finalFacts.pages.every(p=>p.structure));
    for (const secret of [privateFixture.hidden,privateFixture.alternative,privateFixture.date]) {
      assert(!finalFacts.payload.includes(secret)); assert(!visibleText.includes(secret)); assert(!after.includes(Buffer.from(secret)));
    }
    assert.equal(nativeImage.createFromBuffer(Buffer.from(JSON.parse(finalFacts.payload).photo,'base64')).getSize().width,2);
    await fs.writeFile(path.join(root,`${layout}-before.pdf`),before);
    await fs.writeFile(path.join(root,`${layout}.pdf`),after);
    report.layouts.push({layout,pages:finalFacts.pages.length,bytes:after.length,sha256:hash(after),elapsedMs:Math.round(performance.now()-started),textLinksFontsStructurePreserved:true});
  }
  report.translation = await translate(false);
  assert.equal(report.translation.result, 'I developed tools to improve project management.');
  report.cancellation = await translate(true);
  report.networkAttempts = networkAttempts;
  assert.equal(networkAttempts,0);
  await fs.writeFile(path.join(root,`report-${report.mode}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  window.destroy();
}
app.whenReady().then(()=>process.argv.includes('--closure') ? require('./closure.cjs').run({app,BrowserWindow,session,nativeImage,root,sqlite}) : run()).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1);});
