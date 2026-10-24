import type {ComponentProps} from 'react';
import {deferComponent} from './defer-component.js';
export {PresentationDialog} from './PresentationDialog.js';
export const PdfPreview=deferComponent<ComponentProps<typeof import('./PdfPreviewContent.js')['PdfPreview']>>(
  ()=>import('./PdfPreviewContent.js').then(m=>m.PdfPreview),'Cargando vista previa…');
