import { richText } from '../../domain/index.js';
import type { ExportProjection, PartialDate, RichTextDoc } from '../../domain/index.js';
import type { RenderSnapshot } from '../../application/render-contract.js';

type Datum=ExportProjection['personal'][number];
type Value=Datum['values'][number];
type Section=ExportProjection['sections'][number];
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function formatDate(d:PartialDate):string {
  return d.precision==='year'?String(d.year):`${d.precision==='day'?String(d.day).padStart(2,'0')+'/':''}${String(d.month).padStart(2,'0')}/${d.year}`;
}
const messages={es:{education:'Educación',work:'Experiencia laboral',skills:'Habilidades',languages:'Idiomas',certifications:'Certificaciones',projects:'Proyectos',custom:'Información adicional',about:'Sobre mí',cv:'Currículum',ongoing:'Actualmente',native:'Lengua materna',foreign:'Lengua extranjera',unrated:'Sin evaluar',listening:'Comprensión oral',reading:'Lectura',spokenInteraction:'Interacción oral',spokenProduction:'Expresión oral',writing:'Escritura',otherNames:'Otros nombres',birthDate:'Fecha de nacimiento',nationalities:'Nacionalidad',gender:'Género',identifiers:'Identificadores',givenName:'Nombre',familyName:'Apellidos',location:'Ubicación',eqf:'EQF',web:'Web',address:'Dirección',fieldOfStudy:'Área de estudio',grade:'Calificación',thesis:'Trabajo final',subjects:'Asignaturas',nationalClassification:'Clasificación nacional',credits:'Créditos',validity:'Validez',sector:'Sector',department:'Departamento',contact:'Contacto',issued:'Expedición',learningMode:'Modalidad',guide:'CEFR: A1 · A2 · B1 · B2 · C1 · C2'},en:{education:'Education',work:'Work experience',skills:'Skills',languages:'Languages',certifications:'Certifications',projects:'Projects',custom:'Additional information',about:'About me',cv:'Curriculum vitae',ongoing:'Ongoing',native:'Native language',foreign:'Foreign language',unrated:'Not assessed',listening:'Listening',reading:'Reading',spokenInteraction:'Spoken interaction',spokenProduction:'Spoken production',writing:'Writing',otherNames:'Other names',birthDate:'Date of birth',nationalities:'Nationality',gender:'Gender',identifiers:'Identifiers',givenName:'Given name',familyName:'Family name',location:'Location',eqf:'EQF',web:'Website',address:'Address',fieldOfStudy:'Field of study',grade:'Grade',thesis:'Thesis',subjects:'Subjects',nationalClassification:'National classification',credits:'Credits',validity:'Validity',sector:'Sector',department:'Department',contact:'Contact',issued:'Issued',learningMode:'Learning mode',guide:'CEFR: A1 · A2 · B1 · B2 · C1 · C2'}};
export function richHtml(doc:RichTextDoc):string {
  const paragraph=(p:Extract<RichTextDoc['content'][number],{kind:'paragraph'}>)=>'<p>'+p.content.map(i=>{
    if(i.kind==='break')return '<br>';
    let s=escape(i.text);for(const mark of i.marks)s=mark.kind==='bold'?`<strong>${s}</strong>`:mark.kind==='italic'?`<em>${s}</em>`:`<a href="${escape(mark.href)}">${s}</a>`;return s;
  }).join('')+'</p>';
  return doc.content.map(b=>b.kind==='paragraph'?paragraph(b):`<${b.kind==='bulletList'?'ul':'ol'}>${b.items.map(item=>'<li>'+item.content.map(paragraph).join('')+'</li>').join('')}</${b.kind==='bulletList'?'ul':'ol'}>`).join('');
}
function textHtml(v:Extract<Value,{type:'text'}>):string {return typeof v.value==='string'?escape(v.value):richHtml(v.value);}
function valuesHtml(values:Value[],locale:'es'|'en'):string {
  return values.map((v,i)=>{
    switch(v.type){
      case 'text':{const previous=values[i-1],paired=v.role==='original'&&previous?.type==='text'&&previous.role==='translation',tag=typeof v.value==='string'?'span':'div';return `<${tag} lang="${escape(v.locale)}"${paired?' class="original"':''}>${paired?'(':''}${textHtml(v)}${paired?')':''}</${tag}>`;}
      case 'date':return escape(formatDate(v.value));
      case 'period':return [v.value.start?formatDate(v.value.start):'',v.value.ongoing?messages[locale].ongoing:v.value.end?formatDate(v.value.end):''].filter(Boolean).join(' – ');
      case 'number':return String(v.value);
      case 'link':return `<a href="${escape(v.url)}">${escape(v.label??v.url)}</a>`;
      case 'image':case 'cefr':return '';
    }
  }).join(' ');
}
const find=(fields:Datum[],key:Datum['field'])=>fields.find(f=>f.field===key)?.values??[];
export function visibleTitle(p:ExportProjection):string {
  const plain=(v:Value[])=>v.flatMap(v=>v.type==='text'?[typeof v.value==='string'?v.value:richText(v.value)]:[]).join(' ');
  return plain(p.documentTitle??[])||plain(find(p.personal,'displayName'))||messages[p.locale].cv;
}
export function simpleHtml(snapshot:RenderSnapshot):string {
  const p=snapshot.projection,locale=p.locale,m=messages[locale],out:string[]=[],content=(v:Value[])=>valuesHtml(v,locale);
  const datum=(fields:Datum[],key:Datum['field'])=>content(find(fields,key));
  const field=(f:Datum)=>{
    if(f.field==='contacts'||f.field==='web'||f.field==='contact')return f.values.map(v=>{
      if(v.type!=='text'||typeof v.value!=='string')return content([v]);const s=v.value;
      const href=/^https?:\/\//i.test(s)?s:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?'mailto:'+s:null;
      return href?`<a href="${escape(href)}">${escape(s)}</a>`:escape(s);
    }).join('<br>');
    return content(f.values);
  };
  const image=p.images[0];
  out.push('<header class="identity">');
  if(image)out.push(`<img class="photo" alt="" width="${image.width}" height="${image.height}" style="width:30mm;height:auto" src="data:image/png;base64,${image.dataBase64}">`);
  if(p.documentTitle)out.push(`<div class="period">${content(p.documentTitle)}</div>`);
  const display=datum(p.personal,'displayName'),given=datum(p.personal,'givenName'),family=datum(p.personal,'familyName');
  out.push(`<h1>${display||[given,family].filter(Boolean).join(' ')||escape(m.cv)}</h1>`);
  const headline=datum(p.personal,'headline');if(headline)out.push(`<div class="headline">${headline}</div>`);
  for(const f of p.personal){
    if(['displayName','headline','about','photo'].includes(f.field)||(!display&&['givenName','familyName'].includes(f.field)))continue;
    const label=m[f.field as keyof typeof m];out.push(`<div class="personal-line">${label?`<span class="label">${escape(label)}: </span>`:''}${field(f)}</div>`);
  }
  out.push('</header>');
  const about=datum(p.personal,'about');if(about)out.push(`<section><h2>${m.about}</h2><div>${about}</div></section>`);
  function entry(e:Section['entries'][number]):string {
    if(e.kind==='skill')return `<li class="skill">${datum(e.fields,'label')}</li>`;
    const title=e.kind==='work'?'position':e.kind==='nativeLanguage'||e.kind==='foreignLanguage'?'language':'title';
    const subtitle=e.kind==='work'?'employer':e.kind==='education'?'organization':e.kind==='certification'?'issuer':null;
    let s=`<article class="entry"><h3>${datum(e.fields,title)}</h3>`;
    if(subtitle&&find(e.fields,subtitle).length)s+=`<div class="organization">${datum(e.fields,subtitle)}</div>`;
    const period=datum(e.fields,'period');if(period)s+=`<div class="period">${period}</div>`;
    if(e.kind==='nativeLanguage')s+=`<p class="period">${m.native}</p>`;
    if(e.kind==='foreignLanguage'){
      const cefr=find(e.fields,'proficiency').find(v=>v.type==='cefr');
      s+=`<p class="period">${m.foreign}</p>`;
      if(cefr?.type==='cefr')s+='<dl class="cefr">'+(['listening','reading','spokenInteraction','spokenProduction','writing'] as const).map(k=>`<div><dt>${m[k]}</dt><dd>${cefr[k]??m.unrated}</dd></div>`).join('')+'</dl>';
    }
    const tail=e.fields.filter(f=>!['title','position','language','organization','employer','issuer','period','proficiency','description','links'].includes(f.field));
    for(const f of tail)s+=`<div class="detail"><span class="label">${escape(m[f.field as keyof typeof m]??f.field)}: </span>${field(f)}</div>`;
    const description=datum(e.fields,'description');if(description)s+=`<div class="description">${description}</div>`;
    const links=find(e.fields,'links');if(links.length)s+=`<div class="links">${links.map(v=>content([v])).join('<br>')}</div>`;
    return s+'</article>';
  }
  for(const section of p.sections){
    out.push(`<section><h2>${section.title?content(section.title):m[section.kind]}</h2>`);
    if(section.kind==='skills'){
      const grouped=new Set(section.groups.flatMap(g=>g.entryIndices)),ungrouped=section.entries.filter((_,i)=>!grouped.has(i));
      if(ungrouped.length)out.push('<ul class="skills">'+ungrouped.map(entry).join('')+'</ul>');
      for(const g of section.groups)out.push(`<div class="skill-group"><h3>${content(g.name)}</h3><ul class="skills">${g.entryIndices.map(i=>entry(section.entries[i]!)).join('')}</ul></div>`);
    }else out.push(...section.entries.map(entry));
    if(section.kind==='languages'&&p.presentation.showCefrGuide)out.push(`<p class="guide">${m.guide}</p>`);
    out.push('</section>');
  }
  const faces=snapshot.fonts.map(f=>`@font-face{font-family:CVForgeSans;font-style:${f.style};font-weight:${f.weight};src:url(data:font/ttf;base64,${f.dataBase64}) format('truetype')}`).join('');
  const size={compact:9.5,normal:10.5,spacious:11.5}[p.presentation.density];
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>${escape(visibleTitle(p))}</title><style>${faces}
  @page{size:A4;margin:18mm}*{box-sizing:border-box}html{font-family:CVForgeSans,sans-serif;color:#202630;font-size:${size}pt;line-height:1.4}body{width:174mm;margin:0}main{width:100%}p{margin:0 0 2.3mm;white-space:pre-wrap;orphans:3;widows:3}a{color:${p.presentation.accentColor};text-decoration:underline;overflow-wrap:anywhere}span,div,h1,h2,h3,li{overflow-wrap:anywhere}h1{font-size:26pt;line-height:1.12;margin:0 0 3mm;font-weight:700}h2{font-size:12pt;line-height:1.3;color:${p.presentation.accentColor};border-bottom:0.35mm solid ${p.presentation.accentColor};padding-bottom:1.4mm;margin:5mm 0 3mm}h3{font-size:${size+0.6}pt;line-height:1.35;margin:0 0 1mm}h1,h2,h3,.organization,.period{break-after:avoid-page}section{margin:0}.entry{margin-bottom:4mm}.entry.compact{break-inside:avoid-page}.identity{display:flow-root;margin-bottom:3mm}.photo{float:right;width:auto;height:auto;max-width:30mm;max-height:38mm;margin:0 0 3mm 5mm;object-fit:contain}.headline{font-size:12pt;margin-bottom:2mm}.personal-line,.detail{margin-bottom:1mm;white-space:pre-wrap}.label,.period,.guide{color:#495464}.period{font-size:${size-0.6}pt;margin-bottom:1.7mm}.organization{font-weight:700;margin-bottom:1mm}.original{display:block;font-weight:400;font-size:0.94em}.description{margin-top:1.8mm}.links{margin-top:1mm}ul,ol{margin:1mm 0 3mm;padding-left:5.5mm}li{padding-left:0.6mm;orphans:2;widows:2}li p{margin-bottom:0.8mm}.skills{margin-top:1mm}.skill{margin:0 0 0.7mm}.skill-group{margin-bottom:2mm}.cefr{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2mm;margin:1mm 0 3mm;break-inside:avoid}.cefr dt{font-size:${size-1.5}pt;line-height:1.25;min-height:2.5em}.cefr dd{margin:1mm 0 0;font-weight:700}.guide{font-size:8pt}
  </style></head><body><main>${out.join('')}</main></body></html>`;
}
