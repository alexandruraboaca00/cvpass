import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
// Portals keep a child's form out of the parent's HTML form. Native dialogs
// contain keyboard focus and restore it when a child is closed.
export function Modal({title,onCancel,children,destructive=false}:{title:string;onCancel:()=>void;children:ReactNode;destructive?:boolean}){
  const ref=useRef<HTMLDialogElement>(null),id=useRef(crypto.randomUUID());
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return createPortal(<dialog ref={ref} aria-labelledby={id.current} role={destructive?'alertdialog':'dialog'} onCancel={event=>{event.preventDefault();onCancel();}}><h2 id={id.current}>{title}</h2>{children}</dialog>,document.body);
}
