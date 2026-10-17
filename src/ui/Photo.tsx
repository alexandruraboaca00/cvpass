import { useMessages } from './i18n.js';
import { useEffect, useState } from 'react';
import type { PhotoView } from '../application/editor.js';
export function Photo({photo}:{photo:PhotoView|null}) {
  const {t}=useMessages();
  const [url,setUrl] = useState('');
  useEffect(()=>{if (!photo) {setUrl('');return;}const next=URL.createObjectURL(new Blob([new Uint8Array(photo.bytes)],{type:photo.mediaType}));setUrl(next);return ()=>URL.revokeObjectURL(next);},[photo]);
  if (!photo || !url) return <p className="hint">{t("Sin foto seleccionada.")}</p>;
  const crop=photo.crop;
  const width=photo.dimensions.width*crop.width,height=photo.dimensions.height*crop.height,scale=Math.min(112/width,140/height);
  return <div role="img" aria-label={t("Foto del CV")} className="photo" style={{width:width*scale,height:height*scale,backgroundImage:`url(${url})`,backgroundSize:`${100/crop.width}% ${100/crop.height}%`,backgroundPosition:`${crop.width === 1 ? 0 : crop.x/(1-crop.width)*100}% ${crop.height === 1 ? 0 : crop.y/(1-crop.height)*100}%`}}/>;
}
