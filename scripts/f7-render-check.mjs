import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const electron=createRequire(import.meta.url)('electron');
const child=spawn(electron,['--no-sandbox','dist/tests/f7-electron.js'],{stdio:'inherit'});
const timer=setTimeout(()=>child.kill('SIGKILL'),180_000);
child.once('error',error=>{clearTimeout(timer);throw error;});
child.once('exit',code=>{clearTimeout(timer);process.exitCode=code??1;});
