import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { translateMessage } from './messages.js';
export type UiLocale='es'|'en';
export type Translate=(key:string,values?:Record<string,string|number>)=>string;
const Messages=createContext<{locale:UiLocale;setLocale:(locale:UiLocale)=>void;t:Translate}>({locale:'es',setLocale:()=>{},t:key=>key});
export function I18nProvider({children}:{children:ReactNode}){
  const [locale,setLocale]=useState<UiLocale>('es');
  useEffect(()=>{document.documentElement.lang=locale;},[locale]);
  return <Messages.Provider value={{locale,setLocale,t:(key,values)=>translateMessage(locale,key,values)}}>{children}</Messages.Provider>;
}
export const useMessages=()=>useContext(Messages);
