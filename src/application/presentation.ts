import { canonical, parse } from '../domain/index.js';
import type { CvDocument } from '../domain/index.js';
import { PresentationInputSchema, renderFail } from './render-contract.js';
import type { BuiltinResources, PresentationInput } from './render-contract.js';
import type { LibraryService } from './library.js';
export class PresentationService {
  constructor(private readonly library:LibraryService,private readonly resources:()=>Promise<BuiltinResources>){}
  async confirm(cvId:string,expectedRevision:number,input:PresentationInput):Promise<CvDocument>{
    const settings=parse(PresentationInputSchema,input);if(settings.fontFamily!=='Liberation Sans')renderFail('RENDER_FONT_UNSUPPORTED');
    const cv=await this.library.openCv(cvId);if(cv.revision!==expectedRevision)renderFail('REVISION_CONFLICT');
    const catalog=await this.resources(),next={...cv,presentation:{...cv.presentation,...settings,templateRef:{id:catalog.template.id,version:catalog.template.version}}};
    if(canonical(next)===canonical(cv))return cv;
    return await this.library.confirmEntity(next,expectedRevision,catalog.resources) as CvDocument;
  }
}
