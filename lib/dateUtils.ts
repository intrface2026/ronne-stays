export type DateISO = `${number}-${number}-${number}`;

export function toISODate(d: Date): DateISO {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as DateISO;
}

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // Expect YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isAfterDay(a: Date, b: Date) {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export function clampToTodayOrAfter(d: Date) {
  const today = startOfDay(new Date());
  return isBeforeDay(d, today) ? today : d;
}

export function formatMonthYear(d: Date) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function formatShortDateRange(a: Date | null, b: Date | null) {
  if (!a && !b) return 'Add dates';
  if (a && !b) return `${a.toLocaleString(undefined, { month: 'short' })} ${a.getDate()} →`;
  if (!a && b) return `→ ${b.toLocaleString(undefined, { month: 'short' })} ${b.getDate()}`;
  return `${a!.toLocaleString(undefined, { month: 'short' })} ${a!.getDate()} – ${b!.toLocaleString(undefined, { month: 'short' })} ${b!.getDate()}`;
}

