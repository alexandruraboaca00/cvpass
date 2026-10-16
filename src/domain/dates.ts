import { z } from 'zod';
import { parse } from './primitives.js';
const year = z.int().min(1).max(9999);
const month = z.int().min(1).max(12);
export function daysInMonth(y: number, m: number): number {
  return [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!;
}
export const PartialDateSchema = z.discriminatedUnion('precision', [
  z.strictObject({ precision: z.literal('year'), year }),
  z.strictObject({ precision: z.literal('month'), year, month }),
  z.strictObject({ precision: z.literal('day'), year, month, day: z.int().min(1).max(31) }),
]).superRefine((d, ctx) => {
  if (d.precision === 'day' && d.day > daysInMonth(d.year, d.month)) ctx.addIssue({ code: 'custom', path: ['day'], message: 'date.invalidDay' });
});
export type PartialDate = z.infer<typeof PartialDateSchema>;
export function dateBounds(d: PartialDate): [number, number] {
  const firstMonth = d.precision === 'year' ? 1 : d.month;
  const lastMonth = d.precision === 'year' ? 12 : d.month;
  return [d.year * 10000 + firstMonth * 100 + (d.precision === 'day' ? d.day : 1),
    d.year * 10000 + lastMonth * 100 + (d.precision === 'day' ? d.day : daysInMonth(d.year, lastMonth))];
}
export const PeriodSchema = z.strictObject({ start: PartialDateSchema.nullable(), end: PartialDateSchema.nullable(), ongoing: z.boolean() }).superRefine((p, ctx) => {
  if (p.ongoing && p.end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'period.ongoingWithEnd' });
  if (p.start && p.end && dateBounds(p.end)[1] < dateBounds(p.start)[0]) ctx.addIssue({ code: 'custom', path: ['end'], message: 'period.inverted' });
});
export type Period = z.infer<typeof PeriodSchema>;
export function periodOrder(p: Period): 'ordered' | 'ambiguous' | 'open' {
  parse(PeriodSchema, p);
  if (!p.start || !p.end) return 'open';
  return dateBounds(p.start)[1] > dateBounds(p.end)[0] ? 'ambiguous' : 'ordered';
}
export function reduceDate(d: PartialDate, precision: 'year' | 'month' | 'day'): PartialDate {
  parse(PartialDateSchema, d);
  if (precision === 'year') return { precision: 'year', year: d.year };
  if (precision === 'month' && d.precision !== 'year') return { precision: 'month', year: d.year, month: d.month };
  return structuredClone(d); // Never invent missing precision.
}
