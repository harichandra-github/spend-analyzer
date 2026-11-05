import Papa from 'papaparse';
import { OTHER_ID, type Category } from './categories';
import type { ExpenseInput } from './expenses';
import { toIso } from './format';

export const MAX_IMPORT_ROWS = 2000;

const COLUMN_ALIASES = {
  date: ['date', 'transaction date', 'txn date', 'value date'],
  amount: ['amount', 'debit', 'withdrawal', 'withdrawal amount'],
  description: ['description', 'narration', 'details', 'particulars', 'remarks'],
  category: ['category'],
  paymentMethod: ['payment method', 'payment', 'mode'],
  notes: ['notes', 'note'],
};

type Column = keyof typeof COLUMN_ALIASES;
const REQUIRED: Column[] = ['date', 'amount', 'description'];

export interface ParsedRow {
  line: number;
  date: string;
  amount: string;
  description: string;
  category: string;
  input?: ExpenseInput;
  error?: string;
  warning?: string;
}

export const CSV_TEMPLATE = [
  'Date,Amount,Description,Category,Payment Method,Notes',
  '2026-11-01,250,Lunch,Food,UPI,',
  '05/11/2026,1200,Electricity bill,Bills,Net banking,October bill',
].join('\n');

export function parseDate(value: string): string | null {
  const v = value.trim();
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toIso(date);
}

export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/₹|rs\.?|inr|,|\s/gi, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Math.abs(Number(cleaned));
  return amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function parseCsv(file: File, categories: Category[]): Promise<ParsedRow[]> {
  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim().toLowerCase(),
      error: (err) => reject(new Error(err.message)),
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const columnFor = {} as Record<Column, string | undefined>;
        for (const col of Object.keys(COLUMN_ALIASES) as Column[]) {
          columnFor[col] = COLUMN_ALIASES[col].find((alias) => fields.includes(alias));
        }
        const missing = REQUIRED.filter((c) => !columnFor[c]);
        if (missing.length) {
          reject(new Error(`Missing column(s): ${missing.join(', ')}. Your file has: ${fields.join(', ') || 'no header row'}.`));
          return;
        }
        if (result.data.length > MAX_IMPORT_ROWS) {
          reject(new Error(`The file has ${result.data.length} rows. Please import at most ${MAX_IMPORT_ROWS} at a time.`));
          return;
        }

        const get = (row: Record<string, string>, col: Column) => (columnFor[col] ? (row[columnFor[col]!] ?? '').trim() : '');

        resolve(
          result.data.map((row, i) => {
            const parsed: ParsedRow = {
              line: i + 2,
              date: get(row, 'date'),
              amount: get(row, 'amount'),
              description: get(row, 'description'),
              category: get(row, 'category'),
            };
            const date = parseDate(parsed.date);
            const amount = parseAmount(parsed.amount);
            if (!date) parsed.error = 'Invalid date (use YYYY-MM-DD or DD/MM/YYYY)';
            else if (amount === null) parsed.error = 'Invalid or zero amount';
            else if (!parsed.description) parsed.error = 'Description is empty';
            if (parsed.error) return parsed;

            let categoryId = byName.get(parsed.category.toLowerCase());
            if (!categoryId) {
              categoryId = OTHER_ID;
              parsed.warning = parsed.category ? `Unknown category "${parsed.category}", saved as Other` : 'No category, saved as Other';
            }
            parsed.input = {
              amount: amount!,
              date: date!,
              categoryId,
              description: parsed.description.slice(0, 120),
              paymentMethod: get(row, 'paymentMethod'),
              notes: get(row, 'notes').slice(0, 500),
            };
            return parsed;
          }),
        );
      },
    });
  });
}
