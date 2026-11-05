import { useState } from 'react';
import { CalendarDays, Pause, Pencil, Play, Plus, Repeat, Trash2, Wallet } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate, formatMoney } from '../lib/format';
import { FREQUENCY_LABELS, deleteRecurring, isDue, monthlyEquivalent, updateRecurring, type Recurring } from '../lib/recurring';
import DueRecurring from '../components/DueRecurring';
import RecurringForm from '../components/RecurringForm';
import { CategoryIcon, EmptyState } from '../components/Icons';

export default function RecurringPage() {
  const user = useUser();
  const { recurring, getCategory } = useData();
  const [editing, setEditing] = useState<Recurring | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = recurring.filter((r) => r.active);
  const monthly = active.reduce((sum, r) => sum + monthlyEquivalent(r), 0);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch {
      setError('Could not update. Please try again.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recurring payments</h1>
          <p className="muted">Subscriptions and bills that repeat. When one is due, add it as an expense with one click.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>
          <Plus size={18} aria-hidden /> Add recurring
        </button>
      </div>

      <section className="stats">
        <div className="card stat hero">
          <div className="stat-top">
            <span className="stat-label">Per month (active)</span>
            <span className="stat-icon" aria-hidden><Wallet size={18} /></span>
          </div>
          <span className="stat-value">{formatMoney(monthly)}</span>
        </div>
        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Per year (active)</span>
            <span className="stat-icon" aria-hidden><CalendarDays size={18} /></span>
          </div>
          <span className="stat-value">{formatMoney(monthly * 12)}</span>
        </div>
        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Active / paused</span>
            <span className="stat-icon" aria-hidden><Repeat size={18} /></span>
          </div>
          <span className="stat-value">{active.length} / {recurring.length - active.length}</span>
        </div>
      </section>

      <DueRecurring />

      {error && <p className="error-banner" role="alert">{error}</p>}

      <section className="card">
        <div className="card-header">
          <h2>All recurring payments</h2>
        </div>
        {recurring.length === 0 ? (
          <EmptyState icon={Repeat} title="No recurring payments yet">Add things like rent, phone bill, or Netflix.</EmptyState>
        ) : (
          <ul className="expense-list">
            {recurring.map((r) => {
              const category = getCategory(r.categoryId);
              const due = isDue(r);
              return (
                <li key={r.id} className={`expense-row${r.active ? '' : ' paused'}`}>
                  <CategoryIcon id={category.custom ? 'custom' : category.id} />
                  <div className="expense-main">
                    <span className="expense-desc">{r.description}</span>
                    <span className="expense-meta">
                      <span className="chip">{category.name}</span>
                      <span className="chip primary">{FREQUENCY_LABELS[r.frequency]}</span>
                      {r.active ? (
                        due ? (
                          <span className="status-pill status-warning">Due {formatDate(r.nextDate)}</span>
                        ) : (
                          <>Next {formatDate(r.nextDate)}</>
                        )
                      ) : (
                        <>Paused</>
                      )}
                    </span>
                  </div>
                  <span className="expense-amount">{formatMoney(r.amount)}</span>
                  <div className="row-actions">
                    <button className="icon-btn sm" onClick={() => setEditing(r)} aria-label="Edit" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn sm"
                      onClick={() => run(() => updateRecurring(user.uid, r.id, { active: !r.active }))}
                      aria-label={r.active ? 'Pause' : 'Resume'}
                      title={r.active ? 'Pause' : 'Resume'}
                    >
                      {r.active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      className="icon-btn sm danger"
                      aria-label="Delete"
                      title="Delete"
                      onClick={() =>
                        window.confirm(`Delete recurring payment "${r.description}"? Past expenses are kept.`) &&
                        run(() => deleteRecurring(user.uid, r.id))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <RecurringForm
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
