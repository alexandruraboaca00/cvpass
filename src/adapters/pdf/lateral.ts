import type { RenderSnapshot } from '../../application/render-contract.js';
import { simpleHtml } from './simple.js';

// Share the escaped semantic markup and pinned fonts, never change Simple's CSS/output.
export function lateralHtml(snapshot:RenderSnapshot):string {
  let index=0;
  const kinds=[...(snapshot.projection.personal.some(f=>f.field==='about')?['about']:[]),...snapshot.projection.sections.map(s=>s.kind)];
  const html=simpleHtml(snapshot).replace(/<section>/g,()=>`<section data-lane="${['skills','languages'].includes(kinds[index++]!)?'side':'body'}">`);
  return html.replace('</style>',`
    .lateral-page{height:261mm;width:174mm;break-after:page;display:flex;flex-direction:column}
    .lateral-page:last-child{break-after:auto}
    .lateral-heading{border-bottom:0.7mm solid ${snapshot.projection.presentation.accentColor};padding:0 0 4mm;margin-bottom:5mm}
    .lateral-heading h1{font-size:25pt}.lateral-heading .headline{margin-bottom:0}
    .lateral-columns{display:flex;gap:8mm;flex:1;min-height:0;align-items:stretch}
    .lateral-side{width:52mm;flex:none;background:#f0f3f6;border-left:0.6mm solid ${snapshot.projection.presentation.accentColor};padding:4mm}
    .lateral-body{width:114mm;flex:none;padding-top:0}
    .lateral-column{min-height:0;display:flow-root}
    .lateral-column h2{font-size:11.5pt;border-bottom:0.2mm solid #b3bdc9;margin-top:4mm}
    .lateral-column>section:first-child>h2:first-child{margin-top:0}
    .lateral-side{font-size:0.94em}.lateral-side h3{font-size:1em}
    .lateral-side .photo{float:none;display:block;width:30mm;margin:0 auto 4mm;max-height:38mm}
    .lateral-side .cefr{display:block;margin-bottom:3mm}
    .lateral-side .cefr>div{display:flex;gap:2mm;justify-content:space-between;margin:0 0 1.2mm}
    .lateral-side .cefr dt{font-size:0.94em;min-height:0;max-width:32mm}
    .lateral-side .cefr dd{font-size:0.94em;margin:0;white-space:nowrap}
    .lateral-side .guide{font-size:7.5pt}
    .lateral-column .entry{margin-bottom:3.5mm}
  </style>`);
}

// Runs only inside the isolated print window after local fonts/images are ready.
// Measured, bounded fragmentation: no fixed-height clipping and no changes to the projection.
export function paginateLateral():{pages:number;overflow:boolean} {
  const main=document.querySelector('main')!;
  const identity=main.querySelector<HTMLElement>('header.identity')!;
  const heading=document.createElement('header');heading.className='lateral-heading';
  const side:Node[]=[],body:Node[]=[];
  for(const el of [...identity.children]) {
    if(el.matches('h1,.headline')||el.classList.contains('period'))heading.append(el);
    else side.push(el);
  }
  for(const el of [...main.children])if(el!==identity)(el.getAttribute('data-lane')==='side'?side:body).push(el);
  main.replaceChildren();
  const text=(nodes:Node[])=>nodes.map(n=>n.textContent??'').join('');
  const expected={side:text(side),body:text(body)};
  const pending={side:[...side],body:[...body]};
  let pages=0;
  const fits=(column:HTMLElement)=>column.scrollHeight<=column.clientHeight+0.5;
  const keep=(node:Node)=>node instanceof Element&&node.matches('h1,h2,h3,.organization,.period');
  // Append the largest safe prefix. Return the unconsumed suffix, preserving inline marks/URLs.
  function fill(node:Node,parent:Node,column:HTMLElement):Node|null {
    parent.appendChild(node);
    if(fits(column))return null;
    parent.removeChild(node);
    if(node.nodeType===Node.TEXT_NODE){
      const source=node.textContent??'';let lo=0,hi=source.length;
      const prefix=document.createTextNode('');parent.appendChild(prefix);
      while(lo<hi){const mid=Math.ceil((lo+hi)/2);prefix.textContent=source.slice(0,mid);if(fits(column))lo=mid;else hi=mid-1;}
      // Prefer a word boundary, without dropping any characters. Long URLs can split anywhere.
      let cut=lo;if(cut<source.length){const boundary=source.slice(0,cut).search(/\s+\S*$/);if(boundary>0)cut=boundary+1;}
      // Avoid splitting a surrogate pair.
      if(cut>0&&/[\uD800-\uDBFF]/.test(source[cut-1]!))cut--;
      prefix.textContent=source.slice(0,cut);if(!cut)prefix.remove();
      return document.createTextNode(source.slice(cut));
    }
    if(!(node instanceof HTMLElement)||node.matches('img,h1,h2,h3,br,.organization,.period'))return node;
    const prefix=node.cloneNode(false) as HTMLElement,rest=node.cloneNode(false) as HTMLElement;
    parent.appendChild(prefix);
    const children=[...node.childNodes];
    for(let i=0;i<children.length;i++){
      const remaining=fill(children[i]!,prefix,column);
      if(!remaining)continue;
      rest.append(remaining,...children.slice(i+1));
      // A heading/metadata chain must have its first content on the same page.
      while(prefix.lastChild&&keep(prefix.lastChild))rest.prepend(prefix.lastChild);
      if(!prefix.textContent?.trim()&&!prefix.querySelector('img')){prefix.remove();return rest;}
      if(node.matches('ol'))rest.setAttribute('start',String(Number(node.getAttribute('start')??1)+prefix.children.length));
      return rest;
    }
    return null;
  }
  while(pending.side.length||pending.body.length){
    if(++pages>200)throw Error('RENDER_PAGE_LIMIT');
    const page=document.createElement('div');page.className='lateral-page';main.append(page);
    if(pages===1)page.append(heading);
    const row=document.createElement('div');row.className='lateral-columns';page.append(row);
    let progress=false;
    for(const lane of ['side','body'] as const){
      const column=document.createElement('div');column.className=`lateral-column lateral-${lane}`;row.append(column);
      // Freeze its measured available height so scrollHeight detects a real overflow.
      column.style.height=row.getBoundingClientRect().height+'px';
      const queue=pending[lane];
      while(queue.length){
        const node=queue.shift()!,before=text([node]);
        const remaining=fill(node,column,column);
        if(remaining){queue.unshift(remaining);if(text([remaining])!==before||column.querySelector('img'))progress=true;break;}
        progress=true;
      }
    }
    if(!progress)throw Error('RENDER_BLOCK_TOO_LARGE');
  }
  if(!pages)throw Error('RENDER_EMPTY');
  const actual=(lane:string)=>[...main.querySelectorAll('.lateral-'+lane)].map(e=>e.textContent??'').join('');
  if(actual('side')!==expected.side||actual('body')!==expected.body)throw Error('RENDER_CONTENT_LOSS');
  let overflow=false;
  for(const column of main.querySelectorAll<HTMLElement>('.lateral-column')){
    const bounds=column.getBoundingClientRect();
    if(!fits(column))overflow=true;
    for(const child of column.querySelectorAll('*')){const r=child.getBoundingClientRect();if(r.width&&(r.left<bounds.left-1||r.right>bounds.right+1||r.bottom>bounds.bottom+1))overflow=true;}
  }
  return {pages,overflow};
}
