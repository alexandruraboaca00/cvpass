import { parentPort, workerData } from 'node:worker_threads';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { encodePdfAttachment } from '../import/pdf-payload.js';
import { ExportProjectionSchema } from '../../domain/index.js';
import { visibleTitle } from './simple.js';
try {
  const projection=ExportProjectionSchema.parse(workerData.projection),pdf=await PDFDocument.load(workerData.bytes);
  pdf.setTitle(visibleTitle(projection));pdf.setAuthor('');pdf.setSubject('');pdf.setKeywords([]);pdf.setCreator('CVForge');pdf.setProducer('CVForge / Chromium');
  pdf.catalog.set(PDFName.of('Lang'),PDFString.of(projection.locale));
  pdf.catalog.getOrCreateViewerPreferences().setDisplayDocTitle(true);
  await pdf.attach(encodePdfAttachment(projection),'cvforge-data.json',{mimeType:'application/json',description:'CVForge — visible export only'});
  const bytes=await pdf.save({useObjectStreams:false});parentPort!.postMessage({bytes,pageCount:pdf.getPageCount()},[bytes.buffer as ArrayBuffer]);
} catch { parentPort!.postMessage({error:'RENDER_FINALIZATION_FAILED'}); }
