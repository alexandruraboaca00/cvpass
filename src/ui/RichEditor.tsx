import type {ComponentProps} from 'react';
import {deferComponent} from './defer-component.js';
export const RichEditor=deferComponent<ComponentProps<typeof import('./RichEditorContent.js')['RichEditor']>>(
  ()=>import('./RichEditorContent.js').then(m=>m.RichEditor),'Cargando editor…');
