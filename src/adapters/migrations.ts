import { DOMAIN_MODEL_VERSION, validateProject, fail } from '../domain/index.js';
import type { ProjectSnapshot } from '../domain/index.js';
import { decodeJson } from './json.js';
export interface DomainMigration { from:number;to:number;transform(snapshot:unknown):unknown }
/** Explicit opt-in migration boundary. No legacy format is enabled by default. */
export function migrateProjectSnapshot(bytes:Uint8Array,sourceVersion:number,migrations:readonly DomainMigration[]=[]):{snapshot:ProjectSnapshot;original:{domainModelVersion:number;bytes:Uint8Array};appliedVersions:number[]} {
 if(!Number.isSafeInteger(sourceVersion)||sourceVersion<0||sourceVersion>DOMAIN_MODEL_VERSION)fail('migration.unsupportedVersion');
 const original={domainModelVersion:sourceVersion,bytes:new Uint8Array(bytes)};
 let value=decodeJson(original.bytes),version=sourceVersion;const appliedVersions:number[]=[];
 while(version<DOMAIN_MODEL_VERSION){
  const candidates=migrations.filter(m=>m.from===version);if(candidates.length!==1)fail('migration.missingOrAmbiguousStep');const step=candidates[0]!;
  if(step.to!==version+1||step.to>DOMAIN_MODEL_VERSION)fail('migration.invalidStep');
  value=step.transform(structuredClone(value));version=step.to;appliedVersions.push(version);
 }
 return {snapshot:validateProject(value),original,appliedVersions};
}
