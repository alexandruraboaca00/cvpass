import test from 'node:test';
import assert from 'node:assert/strict';
import { context } from './fixtures.js';
import { europassXml, utf16Xml, xmlBytes } from './f6/fixtures.js';
import { parseXml } from '../src/adapters/import/xml.js';
import { adaptEuropass } from '../src/adapters/import/europass.js';
import { importRichText } from '../src/adapters/import/rich-text.js';
import { validateImportDraft } from '../src/application/import-draft.js';
import { validateCv, entryIds, richText } from '../src/domain/index.js';

test('F6 XML UTF-8 and UTF-16 LE/BE use URI and structure, independent of prefixes',()=>{
  const source=europassXml();
  for(const bytes of [new TextEncoder().encode(source),utf16Xml(source),utf16Xml(source,true),new TextEncoder().encode(source.replaceAll('e:','cv:').replace('xmlns:e=','xmlns:cv='))]){
    const data=adaptEuropass(bytes,context(),'Synthetic import');const cv=validateImportDraft(data.draft);
    assert.equal(cv.personalInformation.displayName,'Persona Sintética Ștefan');assert.equal(cv.documentLocale,'es');
  }
});
test('F6 synthetic Europass maps all MVP areas, exact values, groups, CEFR and source sequence',()=>{
  const {draft,project}=adaptEuropass(xmlBytes(),context(),'Synthetic import'),cv=validateCv(draft.cv),sections=Object.values(cv.sectionsById);
  const education=sections.find(s=>s.kind==='education')!,work=sections.find(s=>s.kind==='work')!,skills=sections.find(s=>s.kind==='skills')!,languages=sections.find(s=>s.kind==='languages')!;
  assert.equal(education.entryOrder!.length,8);assert.equal(work.entryOrder!.length,3);assert.equal(entryIds(skills).length,18);assert.equal(skills.groupOrder.length,2);
  assert.equal(skills.groupsById[skills.groupOrder[1]!]!.name.class,'A');assert.equal(skills.groupsById[skills.groupOrder[1]!]!.skillIds.length,9);
  const e=education.entriesById[education.entryOrder![0]!]!;if(e.kind!=='education')throw new Error();assert.equal(e.fields.title.original!.value,'Titulación sintética 1');assert.equal(e.fields.organization!.value,'Instituto Sintético 1');assert.deepEqual(e.fields.period,{start:{precision:'year',year:2023},end:null,ongoing:true});assert(richText(e.fields.description!.current.value).includes('Aprendizaje propio'));assert.equal(e.fields.links[0]!.url,'https://example.test/education/1');
  const second=education.entriesById[education.entryOrder![1]!]!;assert(second.kind==='education');assert.deepEqual(second.fields.period,{start:null,end:{precision:'month',year:2024,month:2},ongoing:false});
  const entries=Object.values(languages.entriesById),foreign=entries.find(e=>e.kind==='foreignLanguage')!;assert(foreign.kind==='foreignLanguage');assert.equal(entries.filter(e=>e.kind==='nativeLanguage').length,2);assert.equal(foreign.fields.language.code,'en');assert.deepEqual(foreign.fields.proficiency,{listening:'B2',reading:'B2',spokenInteraction:'B2',spokenProduction:'B2',writing:'B2'});
  assert.equal(sections.filter(s=>s.kind==='custom').length,2);assert.equal(sections.find(s=>s.kind==='certifications')!.entryOrder!.length,2);assert.equal(sections.find(s=>s.kind==='projects')!.entryOrder!.length,2);assert.equal(Object.keys(project.snapshot.assetsById).length,1);assert(draft.mappings.length>80);
});
test('F6 partial CEFR and multiple mother tongues never invent a global or C2 level',()=>{
  const {draft}=adaptEuropass(xmlBytes({listeningOnly:true}),context(),'Synthetic');
  const entries=Object.values(draft.cv.sectionsById).flatMap(s=>Object.values(s.entriesById)),foreign=entries.find(e=>e.kind==='foreignLanguage')!;assert(foreign.kind==='foreignLanguage');assert.deepEqual(foreign.fields.proficiency,{listening:'B1',reading:null,spokenInteraction:null,spokenProduction:null,writing:null});
  assert(entries.filter(e=>e.kind==='nativeLanguage').every(e=>!('proficiency' in e.fields)));
});
test('F6 invalid dates remain raw and block confirmation until explicitly corrected',()=>{
  const {draft}=adaptEuropass(xmlBytes({partialDate:'2024-02-30'}),context(),'Synthetic'),key=Object.keys(draft.rawDates).find(k=>draft.rawDates[k]==='2024-02-30')!;
  assert.equal(draft.rawDates[key],'2024-02-30');assert(draft.issues.some(i=>i.code==='DATE_INVALID'));assert.throws(()=>validateImportDraft(draft));draft.rawDates[key]='2024-02';assert.equal(validateImportDraft(draft).documentLocale,'es');
});
test('F6 unknown values, invalid assets and foreign namespaces produce private explicit issues',()=>{
  const {draft,project}=adaptEuropass(xmlBytes({unknown:true,photo:'invalid-image'}),context(),'Synthetic');assert(draft.issues.some(i=>i.code==='FIELD_UNMAPPED'&&i.valuePreview==='SYNTHETIC_UNMAPPED_PRIVATE'));assert(draft.issues.some(i=>i.code==='PHOTO_INVALID'));assert.equal(draft.cv.personalInformation.photo,null);assert.equal(Object.keys(project.snapshot.assetsById).length,0);
  const spoof=europassXml().replace('<o:GivenName>Persona</o:GivenName>','<bad:GivenName xmlns:bad="urn:not-oagis">Not the name</bad:GivenName>');
  const other=adaptEuropass(new TextEncoder().encode(spoof),context(),'Synthetic');assert.equal(other.draft.cv.personalInformation.givenName,null);assert(other.draft.issues.some(i=>i.valuePreview==='Not the name'));
});
test('F6 corrupt, truncated, DTD, encoding mismatch, depth and future Europass fail with safe codes',()=>{
  const encode=(s:string)=>new TextEncoder().encode(s);
  for(const source of ['<broken>','<a>&unknown;</a>','<!DOCTYPE a SYSTEM "https://example.test/no-network"><a/>','<!DOCTYPE a [<!ENTITY x "secret">]><a>&x;</a>', '<a>'.repeat(65)+'</a>'.repeat(65),europassXml().replace('UTF-8','ISO-8859-1')])assert.throws(()=>parseXml(encode(source)),error=>error instanceof Error&&/^XML_[A-Z_]+$/.test(error.message));
  assert.throws(()=>adaptEuropass(encode(europassXml().replace('schemeVersionID="4.0"','schemeVersionID="99.0"')),context(),'Synthetic'),/EUROPASS_VERSION_UNSUPPORTED/);
  const missing=adaptEuropass(encode(europassXml().replace(/<e:PersonName>.*?<\/e:PersonName>/,'')),context(),'Synthetic');assert(missing.draft.issues.some(i=>i.code==='DISPLAY_NAME_REQUIRED'));assert.throws(()=>validateImportDraft(missing.draft));
});
test('F6 enriched HTML becomes only the semantic tree, never executable HTML or remote resources',()=>{
  const result=importRichText('<p>Hello <b>world</b><br><a href="https://example.test">safe</a><a href="javascript:alert(1)">unsafe</a></p><ol style="list-style-type:disc"><li>Bullet</li></ol><script>PRIVATE_SCRIPT</script><img src="https://example.test/no-network">');
  assert(result.degraded);assert.equal(result.doc.content[1]!.kind,'bulletList');assert(!JSON.stringify(result.doc).includes('javascript:'));assert(!richText(result.doc).includes('PRIVATE_SCRIPT'));assert(richText(result.doc).includes('Hello world'));
});
test('F6 organization web in a second communication maps safely; lowercase country and scheme-less URLs require distinct handling',()=>{
  const source=europassXml().replace('<e:EducationLevelCode>6</e:EducationLevelCode>','<e:OrganizationContact><e:Communication><e:ChannelCode>Address</e:ChannelCode><e:Address><o:CityName>Ciudad Sintética</o:CityName></e:Address></e:Communication><e:Communication><e:ChannelCode>Web</e:ChannelCode><o:URI>https://example.test/institute</o:URI></e:Communication></e:OrganizationContact><e:EducationLevelCode>6</e:EducationLevelCode>')
    .replace('<e:ChannelCode>Web</e:ChannelCode><o:URI>https://example.test/profile</o:URI>','<e:ChannelCode>Web</e:ChannelCode><o:URI>www.example.test/profile</o:URI>')
    .replace('</e:CandidatePerson>','<e:Communication><e:Address><o:CityName>Ciudad Sintética</o:CityName><e:CountryCode>es</e:CountryCode></e:Address></e:Communication></e:CandidatePerson>');
  const {draft}=adaptEuropass(new TextEncoder().encode(source),context(),'Synthetic'),e=Object.values(draft.cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='education')!;
  assert(e.kind==='education');assert.equal(e.fields.web,'https://example.test/institute');assert.equal(draft.cv.personalInformation.addresses[0]!.countryCode,'ES');assert(draft.issues.some(i=>i.code==='CONTACT_URL_REQUIRES_CORRECTION'));assert.throws(()=>validateImportDraft(draft));
  const c=draft.cv.personalInformation.contacts.find(c=>c.kind==='website')!;if(c.kind!=='phone')c.value='https://www.example.test/profile';validateImportDraft(draft);
});

test('F6 a scheme-less institution web remains editable and blocks confirmation until explicit correction',()=>{
 const {draft}=adaptEuropass(new TextEncoder().encode(europassXml().replace('<e:EducationLevelCode>6</e:EducationLevelCode>','<e:OrganizationContact><e:Communication><e:ChannelCode>Web</e:ChannelCode><o:URI>www.example.test/institute</o:URI></e:Communication></e:OrganizationContact><e:EducationLevelCode>6</e:EducationLevelCode>')),context(),'Synthetic');
 const e=Object.values(draft.cv.sectionsById).flatMap(s=>Object.values(s.entriesById)).find(e=>e.kind==='education')!;assert(e.kind==='education');assert.equal(e.fields.web,'www.example.test/institute');assert.throws(()=>validateImportDraft(draft));assert(draft.issues.some(i=>i.code==='LINK_INVALID'));e.fields.web='https://www.example.test/institute';validateImportDraft(draft);
});
