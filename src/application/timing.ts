// Opt-in, numeric diagnostics only. No document values or identifiers are collected.
export interface Timing { stage:string; ms:number; metrics?:Record<string,number> }
let active:Timing[]|undefined;
export function timingEnabled():boolean{return active!==undefined;}
export function includeTimings(rows:Timing[]):void{active?.push(...rows);}
export function measure<T>(stage:string,operation:()=>T):T {
  if(!active)return operation();
  const start=performance.now();try{return operation();}finally{active.push({stage,ms:performance.now()-start});}
}
export async function measureAsync<T>(stage:string,operation:()=>Promise<T>):Promise<T>{
  if(!active)return operation();
  const rows=active,start=performance.now();try{return await operation();}finally{rows.push({stage,ms:performance.now()-start});}
}
export async function captureTimings<T>(operation:()=>Promise<T>):Promise<{value:T;timings:Timing[]}>{
  const previous=active,rows:Timing[]=[];active=rows;
  try{return {value:await operation(),timings:rows};}finally{active=previous;}
}
