import electron = require('electron');
import type { EditorApi } from '../application/editor-contract.js';
const {contextBridge,ipcRenderer} = electron;
const invoke = (action:string,...args:unknown[]) => ipcRenderer.invoke('cvforge:editor',{action,args});
const api:EditorApi = {
  list:()=>invoke('list'),create:(...args)=>invoke('create',...args),open:(...args)=>invoke('open',...args),
  addSection:(...args)=>invoke('addSection',...args),begin:(...args)=>invoke('begin',...args),
  stage:(...args)=>invoke('stage',...args),confirm:(...args)=>invoke('confirm',...args),cancel:()=>invoke('cancel'),
  photo:(...args)=>invoke('photo',...args),visibility:(...args)=>invoke('visibility',...args),remove:(...args)=>invoke('remove',...args),
  recover:(...args)=>invoke('recover',...args),discardRecovery:(...args)=>invoke('discardRecovery',...args),
  status:()=>invoke('status'),flush:()=>invoke('flush'),close:()=>invoke('close'),
  onCloseRequested(callback) {
    const listener = () => callback(); ipcRenderer.on('cvforge:close-requested',listener);
    return () => { ipcRenderer.removeListener('cvforge:close-requested',listener); };
  },
};
contextBridge.exposeInMainWorld('cvforge',api);
