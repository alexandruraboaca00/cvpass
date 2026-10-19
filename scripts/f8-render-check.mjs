import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const electron=createRequire(import.meta.url)('electron');
const child=spawn(electron,['--no-sandbox','--ozone-platform=x11','dist/tests/f8-electron.js'],{stdio:'inherit'});
const timer=setTimeout(()=>child.kill('SIGKILL'),240000);
child.once('error',e=>{clearTimeout(timer);throw e;});child.once('exit',code=>{clearTimeout(timer);process.exitCode=code??1;});
