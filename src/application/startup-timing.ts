// Opt-in numeric startup diagnostics; no CV values, paths or identifiers.
import { writeFileSync } from 'node:fs';
import { threadId } from 'node:worker_threads';
export const startupTracing=!!process.env.CVFORGE_STARTUP_TRACE;
const rows:{stage:string;ns:string;value?:number}[]=[];
export function startupMark(stage:string,value?:number):void{if(startupTracing)rows.push({stage,ns:process.hrtime.bigint().toString(),...(value===undefined?{}:{value})});}
export function flushStartup():void{if(startupTracing)writeFileSync(process.env.CVFORGE_STARTUP_TRACE+'.'+threadId+'.json',JSON.stringify({pid:process.pid,threadId,rows}));}
