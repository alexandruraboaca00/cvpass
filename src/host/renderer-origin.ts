// Capture once, only after the main process's explicit loadFile has completed.
// Chromium can canonicalize Windows temporary/8.3 paths differently from Node.
export function captureRendererOrigin(loadedUrl:string):string {
  if(new URL(loadedUrl).protocol!=='file:')throw new Error('RENDERER_ORIGIN_INVALID');
  return loadedUrl;
}
export function matchesRendererOrigin(callerUrl:string,trustedUrl:string|undefined):boolean {
  return trustedUrl!==undefined&&callerUrl===trustedUrl;
}
