import { canonical, entitiesOf, parse, IdSchema, validateProject } from '../domain/index.js';
import type { DomainContext, ProjectSnapshot } from '../domain/index.js';
import { reject } from './contracts.js';

// Copy entity-owned identities across current content AND recoverable history.
// Resource identities are immutable and reusable; blob bytes are deduplicated by SHA-256.
export function copyProjectIdentities(project: ProjectSnapshot, ctx: DomainContext): ProjectSnapshot {
  const source = validateProject(project), ids = new Set<string>();
  function collect(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(collect); return; }
    for (const [key, x] of Object.entries(value)) {
      if (['sourceRef','catalog','templateRef'].includes(key)) continue;
      if (key === 'id' && typeof x === 'string') ids.add(x); else collect(x);
    }
  }
  entitiesOf(source).forEach(collect);
  source.revisions.forEach(r => { ids.add(r.id); collect(r.snapshot); });
  if (source.scope === 'workspace') ids.add(source.workspace.id);
  const assigned = new Set([...ids,...Object.keys(source.assetsById)]), map = new Map<string,string>();
  ids.forEach(id => {
    const next = parse(IdSchema,ctx.newId()); if (assigned.has(next)) reject('COPY_ID_COLLISION');
    assigned.add(next); map.set(id,next);
  });
  const refKeys = new Set(['id','entityId','approvalId','groupId']);
  const orderKeys = new Set(['sectionOrder','entryOrder','groupOrder','ungroupedSkillIds','skillIds','contacts','addresses','cvOrder']);
  function copy(value: unknown, parent = ''): unknown {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(x => typeof x === 'string' && orderKeys.has(parent) ? map.get(x) ?? x : copy(x));
    return Object.fromEntries(Object.entries(value).map(([key,x]) => [map.get(key) ?? key,
      ['sourceRef','catalog','templateRef','assetsById','templates'].includes(key) ? structuredClone(x) :
        typeof x === 'string' && refKeys.has(key) ? map.get(x) ?? x : copy(x,key)]));
  }
  const result = validateProject(copy(source));
  if (canonical(source) === canonical(result)) reject('COPY_DID_NOT_MATERIALIZE');
  return result;
}
