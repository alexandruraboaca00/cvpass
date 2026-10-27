import { posix, win32 } from 'node:path';
export function userDataDirectory(appData:string,platform:NodeJS.Platform=process.platform):string {
  return (platform==='win32'?win32:posix).join(appData,platform==='win32'?'CVPass':'CVForge');
}
export function isWithinDirectory(directory:string,parent:string,platform:NodeJS.Platform=process.platform):boolean {
  const paths=platform==='win32'?win32:posix,relative=paths.relative(parent,directory);
  return relative===''||relative!=='..'&&!relative.startsWith('..'+paths.sep)&&!paths.isAbsolute(relative);
}
