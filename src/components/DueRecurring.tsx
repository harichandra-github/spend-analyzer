import { useState } from 'react';
import { CalendarClock, Check } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate, formatMoney } from '../lib/format';
import { isDue, logPayment, skipPayment } from '../lib/recurring';
import { CategoryIcon } from './Icons';

export default function DueRecurring() {
  const user = useUser();
  const { recurring, getCategory } = useData();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const due = recurring.filter(isDue);

  if (due.length === 0) return null;

  async function run(id: string, action: typeof logPayment) {
    setBusy(id);
    setError(null);
    try {
      await action(user.uid, id);
    } catch {
      setError('Could not update the payment. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card due-card" aria-labelledby="due-heading">
      <div className="card-header">
        <h2 id="due-heading">
          <span className="due-icon" aria-hidden><CalendarClock size={18} /></span>
          {due.length} recurring {due.length === 1 ? 'payment is' : 'payments are'} due
        </h2>
      </div>
      <ul className="expense-list">
        {due.map((r) => {
          const category = getCategory(r.categoryId);
          return (
            <li key={r.id} className="expense-row">
              <CategoryIcon id={category.custom ? 'custom' : category.id} />
              <div className="expense-main">
                <span className="expense-desc">{r.description}</span>
                <span className="expense-meta">
                  <span className="chip">{category.name}</span> Due {formatDate(r.nextDate)}
                </span>
              </div>
              <span className="expense-amount">{formatMoney(r.amount)}</span>
              <div className="row-actions">
                <button className="btn primary small" disabled={busy === r.id} onClick={() => run(r.id, logPayment)}>
                  <Check size={15} aria-hidden /> Add as expense
                </button>
                <button className="btn ghost small" disabled={busy === r.id} onClick={() => run(r.id, skipPayment)}>
                  Skip
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
