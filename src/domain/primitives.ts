import { z } from 'zod';

export const IdSchema = z.uuid();
export type Id = string;
export const NonBlank = z.string().max(100_000).refine(s => s.trim().length > 0, 'text.required');
export const Timestamp = z.iso.datetime({ precision: 3 });
export const Locale = z.string().max(64).refine(value => {
  try { return Intl.getCanonicalLocales(value).length === 1; } catch { return false; }
}, 'locale.invalid');
export const DocumentLocale = z.enum(['es', 'en']);
export const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const WebUrl = z.url({ protocol: /^https?$/ });
export const SafeLink = z.url({ protocol: /^(https?|mailto|tel)$/ });
export interface DomainContext { newId(): Id; now(): string }
export type Issue = { path: (string | number)[]; code: string; message: string };
export class DomainError extends Error {
  constructor(public readonly issues: Issue[]) { super(issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); this.name = 'DomainError'; }
}
export function fail(code: string, path: (string | number)[] = []): never {
  throw new DomainError([{ code, path, message: code }]);
}
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues.map(i => ({ path: i.path.map(v => typeof v === 'number' ? v : String(v)), code: i.code, message: i.message })));
  return result.data;
}
export function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}
export function assertOrder(order: string[], keys: string[], path: (string | number)[]): void {
  if (order.length !== keys.length || new Set(order).size !== order.length || keys.some(id => !order.includes(id))) fail('order.notPermutation', path);
}
export function checkMap<T extends { id: string }>(map: Record<string, T>, path: (string | number)[]): void {
  for (const [key, value] of Object.entries(map)) if (key !== value.id) fail('id.mapKeyMismatch', [...path, key]);
}
