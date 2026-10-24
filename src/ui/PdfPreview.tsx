import type * as Content from './PdfPreviewContent.js';
import type {ComponentProps} from 'react';
import {deferComponent} from './defer-component.js';
export {PresentationDialog} from './PresentationDialog.js';
export const PdfPreview=deferComponent<ComponentProps<typeof Content.PdfPreview>>(
  ()=>import('./PdfPreviewContent.js').then(m=>m.PdfPreview),'Cargando vista previa…');
