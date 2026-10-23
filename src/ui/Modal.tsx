import { Children, cloneElement, isValidElement, useEffect, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
// Portals keep a child's form out of the parent's HTML form. Native dialogs
// contain keyboard focus and restore it when a child is closed.
// Keep the existing form (and its submit handler) intact. Only its visual body
// scrolls; the title and existing action footer stay outside that scroll area.
function frame(children:ReactNode):ReactNode {
  const nodes=Children.toArray(children);
  if(nodes.length===1&&isValidElement(nodes[0])&&nodes[0].type==='form'){
    const form=nodes[0] as ReactElement<{children?:ReactNode;className?:string}>;
    return cloneElement(form,{className:[form.props.className,'modal-form'].filter(Boolean).join(' ')},frame(form.props.children));
  }
  const footer=(node:ReactNode)=>isValidElement(node)&&node.type==='footer';
  return <><div className="modal-body">{nodes.filter(node=>!footer(node))}</div>{nodes.filter(footer)}</>;
}
export function Modal({title,onCancel,children,destructive=false}:{title:string;onCancel:()=>void;children:ReactNode;destructive?:boolean}){
  const ref=useRef<HTMLDialogElement>(null),id=useRef(crypto.randomUUID());
  useEffect(()=>{
    const opener=document.activeElement instanceof HTMLElement&&document.activeElement!==document.body?document.activeElement:null;
    const dialog=ref.current;dialog?.showModal();
    // Scroll containers can receive native dialog autofocus before a field.
    // Preserve the existing first-control focus and explicit destructive Cancel.
    const initial=dialog?.querySelector<HTMLElement>('[autofocus]')??dialog?.querySelector<HTMLElement>('input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [contenteditable=true], [tabindex="0"]');
    initial?.focus();
    return()=>{if(dialog?.isConnected)dialog.close();queueMicrotask(()=>{if(opener?.isConnected&&document.activeElement===document.body)opener.focus();});};
  },[]);
  return createPortal(<dialog ref={ref} aria-labelledby={id.current} role={destructive?'alertdialog':'dialog'} onCancel={event=>{event.preventDefault();onCancel();}}><header className="modal-header"><h2 id={id.current}>{title}</h2></header><div className="modal-content">{frame(children)}</div></dialog>,document.body);
}
