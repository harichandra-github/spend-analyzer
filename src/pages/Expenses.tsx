import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Plus, Search, SearchX, Upload, X } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { sumAmounts } from '../lib/analytics';
import { PAYMENT_METHODS, deleteExpense, useExpenses, type Expense } from '../lib/expenses';
import { currentMonth, formatMoney, formatMonth, monthRange } from '../lib/format';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseRow from '../components/ExpenseRow';
import { EmptyState } from '../components/Icons';

export default function Expenses() {
  const user = useUser();
  const { categories, getCategory } = useData();
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [payment, setPayment] = useState('');
  const { start, end } = monthRange(month);
  const { expenses, loading, error } = useExpenses(user.uid, start, end);
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const filtered = expenses.filter(
    (e) =>
      (!term || e.description.toLowerCase().includes(term) || e.notes.toLowerCase().includes(term)) &&
      (!categoryId || getCategory(e.categoryId).id === categoryId) &&
      (!payment || e.paymentMethod === payment),
  );
  const isFiltered = Boolean(term || categoryId || payment);

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`Delete "${expense.description}" (${formatMoney(expense.amount)})?`)) return;
    setActionError(null);
    try {
      await deleteExpense(user.uid, expense.id);
    } catch {
      setActionError('Could not delete the expense. Please try again.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="muted">Everything you spent in {formatMonth(month)}.</p>
        </div>
        <div className="header-actions">
          <Link className="btn ghost" to="/import">
            <Upload size={16} aria-hidden /> Import CSV
          </Link>
          <button className="btn primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden /> Add expense
          </button>
        </div>
      </div>

      <div className="filters">
        <input type="month" aria-label="Month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <div className="input-icon">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Search description or notes"
            aria-label="Search expenses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="Filter by category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select aria-label="Filter by payment method" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {isFiltered && (
          <button className="btn ghost small" onClick={() => { setSearch(''); setCategoryId(''); setPayment(''); }}>
            <X size={14} aria-hidden /> Clear filters
          </button>
        )}
      </div>

      {(error || actionError) && <p className="error-banner" role="alert">{actionError ?? `Could not load expenses: ${error}`}</p>}

      <section className="card">
        <div className="card-header">
          <p className="result-summary">
            {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'}
            {isFiltered && ` of ${expenses.length}`} · <strong>{formatMoney(sumAmounts(filtered))}</strong>
          </p>
        </div>
        {loading ? (
          <div className="spinner" role="status" aria-label="Loading" />
        ) : filtered.length === 0 ? (
          isFiltered ? (
            <EmptyState icon={SearchX} title="No expenses match your filters">Try a different search or clear the filters.</EmptyState>
          ) : (
            <EmptyState icon={Inbox} title="No expenses this month">Add one, or import a CSV from your bank.</EmptyState>
          )
        ) : (
          <ul className="expense-list">
            {filtered.map((e) => (
              <ExpenseRow key={e.id} expense={e} onEdit={() => setEditing(e)} onDelete={() => handleDelete(e)} />
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <ExpenseForm
          key={editing === 'new' ? 'new' : editing.id}
          expense={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
