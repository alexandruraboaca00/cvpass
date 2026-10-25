import type * as Content from './RichEditorContent.js';
import type {ComponentProps} from 'react';
import {deferComponent} from './defer-component.js';
export const RichEditor=deferComponent<ComponentProps<typeof Content.RichEditor>>(
  ()=>import('./RichEditorContent.js').then(m=>m.RichEditor),'Cargando editor…');
