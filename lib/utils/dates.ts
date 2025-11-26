import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, addMonths, subMonths, addDays, differenceInDays, differenceInMonths, parseISO } from 'date-fns';

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function getStartOfMonth(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfMonth(d);
}

export function getEndOfMonth(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfMonth(d);
}

export function getStartOfWeek(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d);
}

export function getEndOfWeek(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfWeek(d);
}

export function getStartOfYear(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfYear(d);
}

export function getEndOfYear(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfYear(d);
}

export function addMonthsToDate(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(d, months);
}

export function subtractMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return subMonths(d, months);
}

export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addDays(d, days);
}

export function getDaysBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return differenceInDays(e, s);
}

export function getMonthsBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMonths(e, s);
}

export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return d >= s && d <= e;
}
