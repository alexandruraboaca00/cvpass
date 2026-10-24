import {useEffect,useState} from 'react';
import type {ComponentType} from 'react';
import {useMessages} from './i18n.js';
// Only code is deferred. Confirmed content/drafts remain in their existing owners.
// A cancelled parent unmounts the loader; a late completion cannot edit its draft.
export function deferComponent<P extends object>(load:()=>Promise<ComponentType<P>>,loadingLabel:string):ComponentType<P>{
  let resolved:ComponentType<P>|undefined,pending:Promise<ComponentType<P>>|undefined;
  const ensure=()=>pending??=(load().then(component=>{resolved=component;return component;}).catch(error=>{pending=undefined;throw error;}));
  return function Deferred(props:P){
    const {t}=useMessages(),[Loaded,setLoaded]=useState<ComponentType<P>|null>(()=>resolved??null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
    useEffect(()=>{let active=true;setFailed(false);void ensure().then(component=>{if(active)setLoaded(()=>component);},()=>{if(active)setFailed(true);});return()=>{active=false;};},[attempt]);
    if(Loaded)return <Loaded {...props}/>;
    if(failed)return <div role="alert"><p>{t('No se ha podido cargar este componente local. Los datos confirmados se conservan.')}</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>{t('Reintentar')}</button></div>;
    return <p aria-live="polite">{t(loadingLabel)}</p>;
  };
}
