import { useState } from 'react';
import { CalendarDays, ChartColumn, Coins, Inbox, ReceiptText, TrendingUp } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { sumAmounts, totalsByCategory, trend } from '../lib/analytics';
import { useExpenses } from '../lib/expenses';
import { daysInclusive, formatDate, formatMoney } from '../lib/format';
import { CategoryChart, TrendChart } from '../components/Charts';
import DateRangeFilter, { presetRange } from '../components/DateRangeFilter';
import { EmptyState } from '../components/Icons';

export default function Analytics() {
  const user = useUser();
  const { getCategory } = useData();
  const [range, setRange] = useState(() => presetRange('last6'));
  const { expenses, loading, error } = useExpenses(user.uid, range.start, range.end);

  const total = sumAmounts(expenses);
  const byCategory = totalsByCategory(expenses, getCategory);
  const { granularity, points } = trend(expenses, range);
  const largest = expenses.reduce<(typeof expenses)[number] | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);

  const stats = [
    { label: 'Total spent', value: formatMoney(total), icon: Coins, hero: true },
    { label: 'Daily average', value: formatMoney(total / daysInclusive(range)), icon: CalendarDays },
    { label: 'Expenses', value: String(expenses.length), icon: ReceiptText },
    { label: 'Largest expense', value: largest ? formatMoney(largest.amount) : '—', sub: largest?.description, icon: TrendingUp },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="muted">{formatDate(range.start)} – {formatDate(range.end)}</p>
        </div>
      </div>

      <DateRangeFilter initial="last6" value={range} onChange={setRange} />

      {error && <p className="error-banner" role="alert">Could not load expenses: {error}</p>}

      <div className={`stack${loading ? ' stale' : ''}`} aria-busy={loading}>
        <section className="stats">
          {stats.map(({ label, value, sub, icon: Icon, hero }) => (
            <div key={label} className={`card stat${hero ? ' hero' : ''}`}>
              <div className="stat-top">
                <span className="stat-label">{label}</span>
                <span className="stat-icon" aria-hidden><Icon size={18} /></span>
              </div>
              <span className="stat-value">{value}</span>
              {sub && <span className="stat-sub truncate">{sub}</span>}
            </div>
          ))}
        </section>

        {expenses.length === 0 && !loading ? (
          <section className="card">
            <EmptyState icon={Inbox} title="No expenses in this period">Pick a different period above.</EmptyState>
          </section>
        ) : (
          <div className="grid-2">
            <section className="card">
              <div className="card-header">
                <h2><ChartColumn size={18} aria-hidden /> Spending per {granularity}</h2>
              </div>
              <TrendChart data={points} />
              <details>
                <summary>View as table</summary>
                <table className="data-table">
                  <thead>
                    <tr><th>{granularity === 'day' ? 'Day' : 'Month'}</th><th className="num">Amount</th></tr>
                  </thead>
                  <tbody>
                    {points.map((p) => (
                      <tr key={p.key}><td>{p.label}</td><td className="num">{formatMoney(p.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Spending by category</h2>
              </div>
              {byCategory.length > 0 && <CategoryChart data={byCategory} />}
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th className="num">Amount</th><th className="num">Share</th><th className="num">Count</th></tr>
                </thead>
                <tbody>
                  {byCategory.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td className="num">{formatMoney(c.amount)}</td>
                      <td className="num">{((c.amount / total) * 100).toFixed(1)}%</td>
                      <td className="num">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
