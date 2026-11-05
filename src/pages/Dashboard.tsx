import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Plus, ReceiptText, Repeat, TriangleAlert, Wallet, Inbox } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { spentByCategory, sumAmounts, totalsByCategory } from '../lib/analytics';
import { OVERALL_BUDGET, budgetStatus } from '../lib/budgets';
import { useExpenses } from '../lib/expenses';
import { currentMonth, formatMoney, formatMonth, monthRange } from '../lib/format';
import { monthlyEquivalent } from '../lib/recurring';
import BudgetMeter from '../components/BudgetMeter';
import DueRecurring from '../components/DueRecurring';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseRow from '../components/ExpenseRow';
import { CategoryIcon, EmptyState } from '../components/Icons';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const user = useUser();
  const { categories, getCategory, budgets, recurring } = useData();
  const month = currentMonth();
  const { start, end } = monthRange(month);
  const { expenses, loading, error } = useExpenses(user.uid, start, end);
  const [adding, setAdding] = useState(false);

  const total = sumAmounts(expenses);
  const breakdown = totalsByCategory(expenses, getCategory);
  const spent = spentByCategory(expenses, getCategory);
  const overallBudget = budgets.get(OVERALL_BUDGET);
  const activeRecurring = recurring.filter((r) => r.active);
  const recurringMonthly = activeRecurring.reduce((sum, r) => sum + monthlyEquivalent(r), 0);
  const alerts = categories
    .filter((c) => budgets.has(c.id) && budgetStatus(spent.get(c.id) ?? 0, budgets.get(c.id)!) !== 'ok')
    .map((c) => ({ category: c, spent: spent.get(c.id) ?? 0, budget: budgets.get(c.id)! }));
  const iconId = (id: string) => (getCategory(id).custom ? 'custom' : id);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">{formatMonth(month)}</p>
          <h1>{greeting()}</h1>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}>
          <Plus size={18} aria-hidden /> Add expense
        </button>
      </div>

      {error && <p className="error-banner" role="alert">Could not load expenses: {error}</p>}

      <DueRecurring />

      {loading ? (
        <div className="spinner" role="status" aria-label="Loading" />
      ) : (
        <>
          <section className="stats">
            <div className="card stat hero">
              <div className="stat-top">
                <span className="stat-label">Spent this month</span>
                <span className="stat-icon" aria-hidden><Wallet size={18} /></span>
              </div>
              <span className="stat-value">{formatMoney(total)}</span>
              {overallBudget !== undefined ? (
                <BudgetMeter spent={total} budget={overallBudget} onHero />
              ) : (
                <Link to="/budgets" className="stat-sub hero-link">Set a monthly budget →</Link>
              )}
            </div>
            <div className="card stat">
              <div className="stat-top">
                <span className="stat-label">Expenses</span>
                <span className="stat-icon" aria-hidden><ReceiptText size={18} /></span>
              </div>
              <span className="stat-value">{expenses.length}</span>
              <span className="stat-sub">{expenses.length ? `Avg ${formatMoney(total / expenses.length)} each` : 'None yet'}</span>
            </div>
            <div className="card stat">
              <div className="stat-top">
                <span className="stat-label">Top category</span>
                <span className="stat-icon" aria-hidden><Crown size={18} /></span>
              </div>
              <span className="stat-value truncate">{breakdown[0]?.name ?? '—'}</span>
              <span className="stat-sub">{breakdown[0] ? formatMoney(breakdown[0].amount) : 'No spending yet'}</span>
            </div>
            <div className="card stat">
              <div className="stat-top">
                <span className="stat-label">Recurring per month</span>
                <span className="stat-icon" aria-hidden><Repeat size={18} /></span>
              </div>
              <span className="stat-value">{formatMoney(recurringMonthly)}</span>
              <Link className="stat-sub" to="/recurring">{activeRecurring.length} active · Manage</Link>
            </div>
          </section>

          {alerts.length > 0 && (
            <section className="card">
              <div className="card-header">
                <h2>
                  <TriangleAlert size={18} className="status-warning" aria-hidden /> Budget alerts
                </h2>
                <Link to="/budgets" className="link-arrow">View budgets <ArrowRight size={14} aria-hidden /></Link>
              </div>
              <ul className="budget-list">
                {alerts.map((a) => (
                  <li key={a.category.id} className="alert-row">
                    <CategoryIcon id={iconId(a.category.id)} />
                    <div className="breakdown-body">
                      <div className="breakdown-label">
                        <span>{a.category.name}</span>
                        <span className="amount muted">{formatMoney(a.spent)} of {formatMoney(a.budget)}</span>
                      </div>
                      <BudgetMeter spent={a.spent} budget={a.budget} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid-main">
            <section className="card">
              <div className="card-header">
                <h2>Recent expenses</h2>
                <Link to="/expenses" className="link-arrow">View all <ArrowRight size={14} aria-hidden /></Link>
              </div>
              {expenses.length === 0 ? (
                <EmptyState icon={Inbox} title="No expenses yet this month">Add your first expense to get started.</EmptyState>
              ) : (
                <ul className="expense-list">
                  {expenses.slice(0, 6).map((e) => <ExpenseRow key={e.id} expense={e} />)}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2>By category</h2>
                <Link to="/analytics" className="link-arrow">Analytics <ArrowRight size={14} aria-hidden /></Link>
              </div>
              {breakdown.length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing to show yet" />
              ) : (
                <ul className="breakdown">
                  {breakdown.map((c) => (
                    <li key={c.id}>
                      <CategoryIcon id={iconId(c.id)} size={16} />
                      <div className="breakdown-body">
                        <div className="breakdown-label">
                          <span>{c.name}</span>
                          <span className="amount">{formatMoney(c.amount)}</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar" style={{ width: `${(c.amount / breakdown[0].amount) * 100}%` }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {adding && <ExpenseForm onClose={() => setAdding(false)} />}
    </>
  );
}
