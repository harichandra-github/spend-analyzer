import { useState, type FormEvent } from 'react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PAYMENT_METHODS } from '../lib/expenses';
import { todayIso } from '../lib/format';
import { FREQUENCY_LABELS, addRecurring, updateRecurring, type Frequency, type Recurring } from '../lib/recurring';
import Modal from './Modal';

interface Props {
  item?: Recurring;
  onClose: () => void;
}

export default function RecurringForm({ item, onClose }: Props) {
  const user = useUser();
  const { categories, getCategory } = useData();
  const [amount, setAmount] = useState(item ? String(item.amount) : '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState(item ? getCategory(item.categoryId).id : 'bills');
  const [paymentMethod, setPaymentMethod] = useState(item?.paymentMethod ?? '');
  const [frequency, setFrequency] = useState<Frequency>(item?.frequency ?? 'monthly');
  const [nextDate, setNextDate] = useState(item?.nextDate ?? todayIso());
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
      description: description.trim(),
      categoryId,
      paymentMethod,
      frequency,
      nextDate,
      active: item?.active ?? true,
    };
    setSaving(true);
    setError(null);
    try {
      if (item) await updateRecurring(user.uid, item.id, input);
      else await addRecurring(user.uid, input);
      onClose();
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal title={item ? 'Edit recurring payment' : 'Add recurring payment'} onClose={onClose}>
      <form onSubmit={handleSubmit}>

        <label>
          Description
          <input required maxLength={120} autoFocus placeholder="e.g. Netflix, Rent, Gym" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Amount (₹)
            <input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Repeats
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
              ))}
            </select>
          </label>
        </div>

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
          Next due date
          <input type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
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
