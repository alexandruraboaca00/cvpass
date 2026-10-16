import { encodeCvproj, decodeCvproj } from './cvproj.js';
import type { ProjectCodec } from '../application/contracts.js';
export const cvprojCodec: ProjectCodec = { encode:encodeCvproj, decode:decodeCvproj };
