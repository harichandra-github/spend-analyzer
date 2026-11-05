import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sumAmounts, totalsByCategory, spentByCategory, trend } from './analytics';
import { OVERALL_BUDGET } from './budgets';
import type { Category } from './categories';
import type { Expense } from './expenses';
import { daysInclusive, formatDate, formatMoneyPdf, monthsInRange, todayIso, type DateRange } from './format';

interface ReportOptions {
  expenses: Expense[];
  range: DateRange;
  getCategory: (id: string) => Category;
  categories: Category[];
  budgets: Map<string, number>;
  email: string;
  categoryFilter?: string;
}

const HEAD_STYLE = { fillColor: [42, 120, 214] as [number, number, number], textColor: 255 };

export function downloadReport({ expenses, range, getCategory, categories, budgets, email, categoryFilter }: ReportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const heading = (text: string) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }
    doc.setFontSize(13);
    doc.text(text, 14, y);
    y += 4;
  };
  const table = (head: string[], body: string[][], rightAlignFrom = 1) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      headStyles: HEAD_STYLE,
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.column.index >= rightAlignFrom) data.cell.styles.halign = 'right';
      },
    });
    y = lastY() + 12;
  };

  doc.setFontSize(18);
  doc.text('Spend Analyzer - Expense Report', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Period: ${formatDate(range.start)} to ${formatDate(range.end)}`, 14, y);
  doc.text(`Generated ${formatDate(todayIso())}`, pageWidth - 14, y, { align: 'right' });
  y += 5;
  doc.text(email, 14, y);
  if (categoryFilter) doc.text(`Category: ${getCategory(categoryFilter).name}`, pageWidth - 14, y, { align: 'right' });
  doc.setTextColor(0);
  y += 10;

  const total = sumAmounts(expenses);
  const largest = expenses.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);

  heading('Summary');
  table(
    ['Metric', 'Value'],
    [
      ['Total spent', formatMoneyPdf(total)],
      ['Number of expenses', String(expenses.length)],
      ['Daily average', formatMoneyPdf(total / daysInclusive(range))],
      ['Largest expense', largest ? `${formatMoneyPdf(largest.amount)} (${largest.description})` : '-'],
    ],
  );

  if (!categoryFilter) {
    heading('Spending by category');
    const byCat = totalsByCategory(expenses, getCategory);
    table(
      ['Category', 'Amount', 'Share', 'Expenses'],
      byCat.length
        ? byCat.map((c) => [c.name, formatMoneyPdf(c.amount), `${((c.amount / total) * 100).toFixed(1)}%`, String(c.count)])
        : [['No expenses in this period', '', '', '']],
    );
  }

  const months = monthsInRange(range).length;
  const spent = spentByCategory(expenses, getCategory);
  const budgetRows: string[][] = [];
  const addBudgetRow = (name: string, monthly: number, used: number) => {
    const budget = monthly * months;
    const diff = budget - used;
    budgetRows.push([name, formatMoneyPdf(budget), formatMoneyPdf(used), diff >= 0 ? formatMoneyPdf(diff) : `Over by ${formatMoneyPdf(-diff)}`]);
  };
  if (!categoryFilter && budgets.has(OVERALL_BUDGET)) addBudgetRow('Overall', budgets.get(OVERALL_BUDGET)!, total);
  for (const c of categories) {
    if (budgets.has(c.id) && (!categoryFilter || categoryFilter === c.id)) addBudgetRow(c.name, budgets.get(c.id)!, spent.get(c.id) ?? 0);
  }
  if (budgetRows.length) {
    heading(`Budget vs actual (monthly budget x ${months} month${months > 1 ? 's' : ''})`);
    table(['Budget', 'Budgeted', 'Spent', 'Remaining'], budgetRows);
  }

  const { granularity, points } = trend(expenses, range);
  if (granularity === 'month' && points.length > 1) {
    heading('Monthly totals');
    table(['Month', 'Amount'], points.map((p) => [p.label, formatMoneyPdf(p.amount)]));
  }

  heading('All expenses');
  table(
    ['Date', 'Description', 'Category', 'Payment', 'Amount'],
    [...expenses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [formatDate(e.date), e.description, getCategory(e.categoryId).name, e.paymentMethod || '-', formatMoneyPdf(e.amount)]),
    4,
  );

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  doc.save(`spend-report-${range.start}-to-${range.end}.pdf`);
}
