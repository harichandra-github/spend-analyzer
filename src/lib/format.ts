const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const compactCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const plainNumber = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatMoney = (amount: number) => currency.format(amount);
export const formatMoneyCompact = (amount: number) => compactCurrency.format(amount);
// jsPDF's built-in fonts have no ₹ glyph.
export const formatMoneyPdf = (amount: number) => `Rs. ${plainNumber.format(amount)}`;

export interface DateRange {
  start: string;
  end: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayIso = () => toIso(new Date());
export const currentMonth = () => todayIso().slice(0, 7);

export function formatDate(iso: string) {
  return parseIso(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(month: string) {
  return parseIso(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatMonthShort(month: string) {
  return parseIso(`${month}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function addDays(iso: string, days: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function addMonths(iso: string, months: number) {
  const d = parseIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toIso(d);
}

export function monthRange(month: string): DateRange {
  const start = `${month}-01`;
  return { start, end: addDays(addMonths(start, 1), -1) };
}

export function daysInclusive({ start, end }: DateRange) {
  return Math.round((parseIso(end).getTime() - parseIso(start).getTime()) / 86_400_000) + 1;
}

export function monthsInRange({ start, end }: DateRange) {
  const months: string[] = [];
  for (let m = start.slice(0, 7); m <= end.slice(0, 7); m = addMonths(`${m}-01`, 1).slice(0, 7)) {
    months.push(m);
  }
  return months;
}
