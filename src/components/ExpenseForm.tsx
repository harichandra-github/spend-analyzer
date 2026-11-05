import { useState, type FormEvent } from 'react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PAYMENT_METHODS, addExpense, updateExpense, type Expense } from '../lib/expenses';
import { todayIso } from '../lib/format';
import Modal from './Modal';

interface Props {
  expense?: Expense;
  onClose: () => void;
}

export default function ExpenseForm({ expense, onClose }: Props) {
  const user = useUser();
  const { categories, getCategory } = useData();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [date, setDate] = useState(expense?.date ?? todayIso());
  const [categoryId, setCategoryId] = useState(expense ? getCategory(expense.categoryId).id : categories[0].id);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '');
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    const input = {
      amount: Math.round(value * 100) / 100,
      date,
      categoryId,
      description: description.trim(),
      paymentMethod,
      notes: notes.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      if (expense) await updateExpense(user.uid, expense.id, input);
      else await addExpense(user.uid, input);
      onClose();
    } catch {
      setError('Could not save the expense. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal title={expense ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={handleSubmit}>

        <div className="form-row">
          <label>
            Amount (₹)
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Date
            <input type="date" required max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <label>
          Description
          <input required maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Payment method
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Notes
          <textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
