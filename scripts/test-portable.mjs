import {spawnSync} from 'node:child_process';
// Explicit portable domain/application suite. POSIX permission/signal tests remain Linux regression.
const files=['domain','invariants','migrations','language-revisions','editor-rich','f5-domain','f5-i18n','f6-detection','f6-xml','f7-snapshot','f7-preview','f8-presentation','f8-portable','f9-json-safety','f9-validation-cache','f9-confirm-validation','platform','renderer-origin'];
const r=spawnSync(process.execPath,['--test',...files.map(f=>'dist/tests/'+f+'.test.js')],{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);
