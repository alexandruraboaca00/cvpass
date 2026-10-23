// Local private acceptance only. Arguments are never committed or printed.
import {readFile,mkdir,writeFile,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {LocalStructuredImport} from '../dist/src/adapters/import/worker-port.js';
import {StructuredImportService} from '../dist/src/application/structured-import.js';
import {SqliteLibraryRepository} from '../dist/src/adapters/sqlite/repository.js';
import {LibraryService} from '../dist/src/application/library.js';
import {cvprojCodec} from '../dist/src/adapters/library-cvproj.js';
import {entryIds,plainText} from '../dist/src/domain/index.js';
import {sha256} from '../dist/src/adapters/asset-bytes.js';
const paths=process.argv.slice(2);assert.equal(paths.length,2,'Two private PDF paths required');
const output=process.env.CVFORGE_F9_PRIVATE_OUTPUT??'/tmp/cvforge-f9/private';await mkdir(output,{recursive:true});
const ctx={newId:randomUUID,now:()=>new Date().toISOString()},results=[];
const canonicalLanguage=s=>Intl.getCanonicalLocales(s)[0];
const date=p=>!p?null:p.precision==='year'?String(p.year):`${p.year}-${String(p.month).padStart(2,'0')}`+(p.precision==='day'?`-${String(p.day).padStart(2,'0')}`:'');
const period=p=>({start:date(p.start),end:date(p.end),ongoing:p.ongoing});
for(let i=0;i<paths.length;i++){
  const bytes=new Uint8Array(await readFile(paths[i])),originalHash=sha256(bytes),task=getDocument({data:new Uint8Array(bytes),verbosity:0}),pdf=await task.promise;
  const attachments=await pdf.getAttachments();let oracle;
  for(const id of attachments?.keys()??[]){
    const parsed=spawnSync('python3',['scripts/f9-europass-oracle.py'],{input:await pdf.getAttachmentContent(id),maxBuffer:10*1024*1024,encoding:'utf8'});
    if(parsed.status===0){oracle=JSON.parse(parsed.stdout);break;}
  }
  await task.destroy();
  assert(oracle,'Independent XML oracle failed');
  const dir=await mkdtemp(join(output,'library-')),repo=await SqliteLibraryRepository.open(dir),library=new LibraryService(repo,ctx,cvprojCodec);await library.initialize();
  const service=new StructuredImportService(library,new LocalStructuredImport(),ctx),view=await service.begin(ctx.newId(),bytes,'private-acceptance.pdf');assert(view.draft);
  const draft=structuredClone(view.draft);let reviewedUrls=0;
  // Explicit local review of the five previously observed missing protocols.
  // No automatic correction is added to the application/import adapter.
  const reviewed=v=>{if(v&&!/^https?:\/\//i.test(v)){reviewedUrls++;return 'https://'+v;}return v;};
  for(const c of draft.cv.personalInformation.contacts)if(c.kind==='social'||c.kind==='website')c.value=reviewed(c.value);
  for(const s of Object.values(draft.cv.sectionsById))for(const e of Object.values(s.entriesById))if(e.kind==='education'&&e.fields.web)e.fields.web=reviewed(e.fields.web);
  assert.equal(reviewedUrls,5,'Unexpected URL review count');
  const {cvId}=await service.confirm(view.id,{cv:draft.cv,rawDates:draft.rawDates,rawNumbers:draft.rawNumbers,documentLocale:draft.documentLocale,acknowledgeIssues:true});
  const before=await library.openCv(cvId),project=await library.exportCvproj(cvId);await repo.close();
  const reopened=await SqliteLibraryRepository.open(dir),next=new LibraryService(reopened,ctx,cvprojCodec);try{
    const cv=await next.openCv(cvId);assert.deepEqual(cv,before);
    const entries=cv.sectionOrder.flatMap(id=>{const s=cv.sectionsById[id];return entryIds(s).map(id=>s.entriesById[id]);});
    const ed=entries.filter(e=>e.kind==='education'),work=entries.filter(e=>e.kind==='work'),skills=entries.filter(e=>e.kind==='skill'),native=entries.filter(e=>e.kind==='nativeLanguage'),foreign=entries.filter(e=>e.kind==='foreignLanguage');
    assert.deepEqual([ed.length,work.length,skills.length,native.length,foreign.length],[8,3,18,2,1]);
    assert.deepEqual(ed.map(e=>({title:e.fields.title.original.value,organization:e.fields.organization?.value??'',period:period(e.fields.period),web:e.fields.web??''})),oracle.education.map(e=>({...e,web:e.web&&!/^https?:/.test(e.web)?'https://'+e.web:e.web})));
    assert.deepEqual(work.map(e=>({title:plainText(e.fields.position),organization:e.fields.employer?.value??'',period:period(e.fields.period)})),oracle.work);
    const ss=Object.values(cv.sectionsById).find(s=>s.kind==='skills');assert(ss);assert.equal(ss.groupOrder.length,2);
    assert.deepEqual(ss.groupOrder.map(id=>({name:plainText(ss.groupsById[id].name),skills:ss.groupsById[id].skillIds.map(id=>plainText(ss.entriesById[id].fields.label))})),oracle.groups);
    assert.deepEqual(native.map(e=>e.fields.language.code),oracle.native.map(canonicalLanguage));assert.equal(foreign[0].fields.language.code,canonicalLanguage(oracle.foreign[0].code));assert.deepEqual(Object.values(foreign[0].fields.proficiency),['B2','B2','B2','B2','B2']);assert.deepEqual(Object.values(oracle.foreign[0].scores),['B2','B2','B2','B2','B2']);
    const state=await next.snapshot(),photo=state.content.assetsById[cv.personalInformation.photo.assetId];assert.equal(photo.sha256,oracle.photoSha256);assert.equal(sha256(state.content.blobs.get(photo.sha256)),oracle.photoSha256);
    for(const expected of oracle.contacts){const k=expected.kind.toLowerCase();if(k==='email')assert(cv.personalInformation.contacts.some(c=>c.kind==='email'&&c.value===expected.uri));if(k==='telephone')assert(cv.personalInformation.contacts.some(c=>c.kind==='phone'&&c.number===expected.number));if(k==='web'||k==='socialmedia')assert(cv.personalInformation.contacts.some(c=>(c.kind==='website'||c.kind==='social')&&(c.value===expected.uri||c.value==='https://'+expected.uri)));}
    assert.equal(state.content.workspace.profile,null);assert.equal(state.content.workspace.cvOrder.length,1);assert.equal(state.content.drafts.length,0);assert.deepEqual((await reopened.health()).integrity,['ok']);assert.equal(sha256(new Uint8Array(await readFile(paths[i]))),originalHash);assert(project.length>0);
    const photoBase64=Buffer.from(state.content.blobs.get(photo.sha256)).toString('base64');
    const prohibited=[cv.personalInformation.displayName,originalHash,photo.sha256,photoBase64.slice(Math.floor(photoBase64.length/2),Math.floor(photoBase64.length/2)+80),...cv.personalInformation.contacts.flatMap(c=>c.kind==='email'?[c.value]:[])].filter(s=>s.length>=8);
    const sources=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(f=>/\.(?:md|ts|tsx|cts|mjs|js|py|json|yml|yaml|html|css|txt)$/.test(f));
    for(const path of sources){const text=await readFile(path,'utf8');assert(!prohibited.some(s=>text.includes(s)),'PRIVATE_ACCEPTANCE_DATA_IN_REPOSITORY');}
    const objects=execFileSync('git',['rev-list','--objects','main..HEAD'],{encoding:'utf8'}).trim().split('\n').map(row=>row.split(' ')[0]).filter(Boolean);
    for(const id of objects){if(execFileSync('git',['cat-file','-t',id],{encoding:'utf8'}).trim()!=='blob')continue;const text=execFileSync('git',['cat-file','blob',id],{maxBuffer:20*1024*1024}).toString('utf8');assert(!prohibited.some(s=>text.includes(s)),'PRIVATE_ACCEPTANCE_DATA_IN_F9_HISTORY');}
    assert.equal(execFileSync('git',['log','--all','--format=','--name-only','--','*.pdf','*.PDF'],{encoding:'utf8'}).trim(),'','PRIVATE_PDF_TRACKED_IN_HISTORY');
    results.push({case:i+1,pass:true,education:8,work:3,skills:18,groups:2,native:2,foreign:1,fiveB2:true,valuesCompared:true,contactsCompared:true,photoCompared:true,reviewedUrls,partial:true,reopened:true,originalUnchanged:true,repositoryScan:true});
  }finally{await reopened.close();}
}
await writeFile(join(output,'results.json'),JSON.stringify({results,privateValuesPublished:false},null,2));console.log(JSON.stringify({privateAcceptance:results.map(r=>({case:r.case,pass:r.pass,valuesCompared:r.valuesCompared,reopened:r.reopened})),privateValuesPublished:false}));
