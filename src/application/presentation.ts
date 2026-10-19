import { canonical, parse } from '../domain/index.js';
import type { CvDocument } from '../domain/index.js';
import { PresentationInputSchema, builtinTemplate, renderFail } from './render-contract.js';
import type { BuiltinResources, PresentationInput } from './render-contract.js';
import type { LibraryService } from './library.js';
export class PresentationService {
  constructor(private readonly library:LibraryService,private readonly resources:()=>Promise<BuiltinResources>){}
  async confirm(cvId:string,expectedRevision:number,input:PresentationInput):Promise<CvDocument>{
    const settings=parse(PresentationInputSchema,input);if(settings.fontFamily!=='Liberation Sans')renderFail('RENDER_FONT_UNSUPPORTED');
    const cv=await this.library.openCv(cvId);if(cv.revision!==expectedRevision)renderFail('REVISION_CONFLICT');
    const catalog=await this.resources(),template=settings.templateRef?builtinTemplate(settings.templateRef.id,settings.templateRef.version):catalog.template;
    const next={...cv,presentation:{...cv.presentation,...settings,templateRef:{id:template.id,version:template.version}}};
    if(canonical(next)===canonical(cv))return cv;
    return await this.library.confirmEntity(next,expectedRevision,{...catalog.resources,templates:[template]}) as CvDocument;
  }
}
