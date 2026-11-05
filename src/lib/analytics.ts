import type { Category } from './categories';
import type { Expense } from './expenses';
import { addDays, daysInclusive, formatMonthShort, monthsInRange, parseIso, type DateRange } from './format';

export const sumAmounts = (expenses: Expense[]) => expenses.reduce((sum, e) => sum + e.amount, 0);

export interface CategoryTotal {
  id: string;
  name: string;
  amount: number;
  count: number;
}

export function totalsByCategory(expenses: Expense[], getCategory: (id: string) => Category): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();
  for (const e of expenses) {
    const c = getCategory(e.categoryId);
    const t = totals.get(c.id) ?? { id: c.id, name: c.name, amount: 0, count: 0 };
    t.amount += e.amount;
    t.count += 1;
    totals.set(c.id, t);
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export function spentByCategory(expenses: Expense[], getCategory: (id: string) => Category) {
  const spent = new Map<string, number>();
  for (const e of expenses) {
    const id = getCategory(e.categoryId).id;
    spent.set(id, (spent.get(id) ?? 0) + e.amount);
  }
  return spent;
}

export interface TrendPoint {
  key: string;
  label: string;
  amount: number;
}

export function trend(expenses: Expense[], range: DateRange): { granularity: 'day' | 'month'; points: TrendPoint[] } {
  const daily = daysInclusive(range) <= 31;
  const buckets = new Map<string, TrendPoint>();

  if (daily) {
    for (let d = range.start; d <= range.end; d = addDays(d, 1)) {
      const label = parseIso(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      buckets.set(d, { key: d, label, amount: 0 });
    }
  } else {
    for (const m of monthsInRange(range)) buckets.set(m, { key: m, label: formatMonthShort(m), amount: 0 });
  }

  for (const e of expenses) {
    const bucket = buckets.get(daily ? e.date : e.date.slice(0, 7));
    if (bucket) bucket.amount += e.amount;
  }
  return { granularity: daily ? 'day' : 'month', points: [...buckets.values()] };
}
