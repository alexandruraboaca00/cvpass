import { useMessages } from './i18n.js';
import { useId, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ListItem, OrderedList } from '@tiptap/extension-list';
import { SafeLink } from '../domain/index.js';
import type { RichNarrative, RichTextDoc } from '../domain/index.js';
import { fromEditorJson, toEditorJson } from './rich-codec.js';
import { ProtectedSpans } from './ProtectedSpans.js';

const FlatItem = ListItem.extend({content:'paragraph+'});
const FromOne = OrderedList.extend({addAttributes(){return {};}});
export function RichEditor({label,value,onChange,field,onProtectionChange}:{label:string;value:RichTextDoc|null;onChange:(doc:RichTextDoc)=>void;field?:RichNarrative|null;onProtectionChange?:(field:RichNarrative)=>void}) {
  const {t}=useMessages();
  const id = useId(), [link,setLink] = useState(''), [error,setError] = useState('');
  const editor = useEditor({extensions:[StarterKit.configure({heading:false,blockquote:false,code:false,codeBlock:false,horizontalRule:false,strike:false,underline:false,listItem:false,orderedList:false,trailingNode:false,link:{openOnClick:false,autolink:false,linkOnPaste:false,protocols:['http','https','mailto','tel']}}),FlatItem,FromOne],
    content:toEditorJson(value ?? {kind:'doc',content:[]}),injectCSS:false,
    editorProps:{attributes:{role:'textbox','aria-multiline':'true','aria-labelledby':id,'data-rich-label':label}},
    onUpdate:({editor:instance})=>{try {onChange(fromEditorJson(instance.getJSON()));setError('');} catch {setError('Ese formato no está admitido. Deshaz el último cambio.');}},
  });
  if (!editor) return null;
  return <div className="rich-field"><span id={id} className="field-label">{label} <small>{t("(opcional)")}</small></span>
    <div className="rich-toolbar" role="group" aria-label={t("Formato de {name}",{name:label})}>
      <button type="button" aria-pressed={editor.isActive('bold')} onClick={()=>editor.chain().focus().toggleBold().run()}>{t("Negrita")}</button>
      <button type="button" aria-pressed={editor.isActive('italic')} onClick={()=>editor.chain().focus().toggleItalic().run()}>{t("Cursiva")}</button>
      <button type="button" aria-pressed={editor.isActive('bulletList')} onClick={()=>editor.chain().focus().toggleBulletList().run()}>{t("Viñetas")}</button>
      <button type="button" aria-pressed={editor.isActive('orderedList')} onClick={()=>editor.chain().focus().toggleOrderedList().run()}>{t("Lista numerada")}</button>
      <button type="button" onClick={()=>editor.chain().focus().unsetLink().run()}>{t("Quitar enlace")}</button>
    </div>
    <EditorContent editor={editor}/>
    <div className="link-tool"><label>{t("Destino del enlace")}<input value={link} placeholder="https://example.test" onChange={event=>setLink(event.target.value)}/></label>
      <button type="button" onClick={()=>{const checked=SafeLink.safeParse(link);if (!checked.success) {setError('Introduce una dirección http, https, mailto o tel válida.');return;}editor.chain().focus().setLink({href:checked.data}).run();setError('');}}>{t("Aplicar a selección")}</button></div>
    <small>{t("Selecciona texto antes de aplicar un enlace. Enter: párrafo; Mayús+Enter: salto de línea.")}</small>
    {error && <p role="alert" className="error">{t(error)}</p>}
    {field&&onProtectionChange&&<ProtectedSpans field={field} onChange={onProtectionChange}/>}
  </div>;
}
