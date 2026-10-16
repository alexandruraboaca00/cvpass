// Synthetic validation fixture only. This is not the F2 domain or portable format.
const forbidden = Object.fromEntries(['hidden','history','otherLanguage','draft','external','localPath','system','otherDocument','originalTitle'].map(k=>[k, `PRIVATE_${k.toUpperCase()}_F1_20261016`]));
const glyphs = 'Español: áéíóú ñ ¿Qué? English: résumé. Română: ă â î ș ț Ă Â Î Ș Ț.';
const url = 'https://example.org/cv/' + 'segmento-largo-de-prueba/'.repeat(8);
function projection(layout, photo) {
  return {format:'cvforge-export-probe',pdfPayloadFormatVersion:1,layout,
    title:'CV sintético F1',glyphs,year:'2020',photo,
    sensitiveVisible:'Reviewed synthetic qualification',
    link:{label:'Enlace de prueba',url},
    paragraphs:Array.from({length:48},(_,i)=>`P${String(i+1).padStart(2,'0')} Desarrollo de herramientas locales y documentación de procesos. Texto sintético propio para comprobar la lectura completa del documento.`),
    longText:Array.from({length:150},(_,i)=>`L${String(i+1).padStart(3,'0')} Descripción extensa con responsabilidades y resultados verificables de un proyecto sintético.`).join(' '),
    list:['Lista alfa: análisis','Lista beta: implementación','Lista gamma: evaluación'],
    breakHeading:'SALTO_EXPLICITO_F1',end:'FIN_VISIBLE_F1'};
}
const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function html(p, regular, bold) {
  const e = escapeHtml;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>CV sintético F1</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:"><style>
@font-face{font-family:F1Fixture;src:url(data:font/ttf;base64,${regular})} @font-face{font-family:F1Fixture;src:url(data:font/ttf;base64,${bold});font-weight:700}
@page{size:A4;margin:16mm}body{font:12px F1Fixture;line-height:1.5;margin:0}h1,h2{break-after:avoid}p{orphans:3;widows:3;overflow-wrap:anywhere}section{break-inside:auto}li{break-inside:avoid}.columns{column-count:${p.layout==='lateral'?2:1};column-gap:24px}a{overflow-wrap:anywhere}img{width:48px;height:48px}.new-page{break-before:page}
</style></head><body><h1>${e(p.title)}</h1><img alt="Recorte azul sintético" src="data:image/png;base64,${p.photo}"><p>${e(p.glyphs)}</p><p>${p.year}</p><p>${e(p.sensitiveVisible)}</p><a href="${e(p.link.url)}">${e(p.link.label)}</a><p>${e(p.link.url)}</p><main class="columns">${p.paragraphs.map(t=>`<section><h2>${t.slice(0,3)}</h2><p>${e(t)}</p></section>`).join('')}<h2>DESCRIPCION_LARGA_F1</h2><p>${e(p.longText)}</p><ul>${p.list.map(t=>`<li>${e(t)}</li>`).join('')}</ul></main><section class="new-page"><h2>${e(p.breakHeading)}</h2><p>${e(p.end)}</p></section></body></html>`;
}
module.exports = {forbidden,glyphs,url,projection,html};
