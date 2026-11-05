import { useState, type FormEvent } from 'react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { spentByCategory, sumAmounts } from '../lib/analytics';
import { OVERALL_BUDGET, setBudget } from '../lib/budgets';
import { addCategory, deleteCategory, renameCategory, type Category } from '../lib/categories';
import { useExpenses } from '../lib/expenses';
import { currentMonth, formatMoney, monthRange } from '../lib/format';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import BudgetMeter from '../components/BudgetMeter';
import { CategoryIcon } from '../components/Icons';

function BudgetInput({ budgetKey, label }: { budgetKey: string; label: string }) {
  const user = useUser();
  const { budgets } = useData();
  const saved = budgets.get(budgetKey);
  const [value, setValue] = useState(saved !== undefined ? String(saved) : '');
  const [error, setError] = useState(false);

  async function commit() {
    const trimmed = value.trim();
    const amount = trimmed === '' ? null : Math.round(Number(trimmed) * 100) / 100;
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      setValue(saved !== undefined ? String(saved) : '');
      return;
    }
    if (amount === (saved ?? null)) return;
    try {
      await setBudget(user.uid, budgetKey, amount);
      setError(false);
    } catch {
      setError(true);
    }
  }

  return (
    <span className="budget-input">
      <input
        type="number"
        inputMode="decimal"
        min="1"
        step="1"
        placeholder="No budget"
        aria-label={`Monthly budget for ${label}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      {error && <span className="error small" role="alert">Not saved</span>}
    </span>
  );
}

function CategoryActions({ category, names }: { category: Category; names: Set<string> }) {
  const user = useUser();
  const [error, setError] = useState<string | null>(null);

  async function rename() {
    const name = window.prompt('New name for this category', category.name)?.trim();
    if (!name || name === category.name) return;
    if (names.has(name.toLowerCase())) {
      setError('A category with that name already exists.');
      return;
    }
    try {
      await renameCategory(user.uid, category.id, name);
      setError(null);
    } catch {
      setError('Could not rename. Please try again.');
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Delete "${category.name}"? Existing expenses in this category will show as "Other", and its budget will be removed.`,
    );
    if (!ok) return;
    try {
      await deleteCategory(user.uid, category.id);
    } catch {
      setError('Could not delete. Please try again.');
    }
  }

  return (
    <span className="row-actions">
      <button className="icon-btn sm" onClick={rename} aria-label="Rename" title="Rename">
        <Pencil size={16} />
      </button>
      <button className="icon-btn sm danger" onClick={remove} aria-label="Delete" title="Delete">
        <Trash2 size={16} />
      </button>
      {error && <span className="error small" role="alert">{error}</span>}
    </span>
  );
}

export default function Budgets() {
  const user = useUser();
  const { categories, getCategory, budgets } = useData();
  const [month, setMonth] = useState(currentMonth());
  const { start, end } = monthRange(month);
  const { expenses, error } = useExpenses(user.uid, start, end);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const spent = spentByCategory(expenses, getCategory);
  const total = sumAmounts(expenses);
  const names = new Set(categories.map((c) => c.name.toLowerCase()));

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (names.has(name.toLowerCase())) {
      setAddError('A category with that name already exists.');
      return;
    }
    try {
      await addCategory(user.uid, name);
      setNewName('');
      setAddError(null);
    } catch {
      setAddError('Could not add the category. Please try again.');
    }
  }

  const rows: { key: string; name: string; spent: number; category?: Category }[] = [
    { key: OVERALL_BUDGET, name: 'Overall (all spending)', spent: total },
    ...categories.map((c) => ({ key: c.id, name: c.name, spent: spent.get(c.id) ?? 0, category: c })),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Budgets &amp; categories</h1>
          <p className="muted">Set a monthly limit for any category. You'll see a warning at 80% and an alert when you go over.</p>
        </div>
        <input type="month" aria-label="Month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="month-picker" />
      </div>

      {error && <p className="error-banner" role="alert">Could not load expenses: {error}</p>}

      <section className="card">
        <ul className="budget-table">
          {rows.map((row) => {
            const budget = budgets.get(row.key);
            return (
              <li key={row.key} className={row.key === OVERALL_BUDGET ? 'overall' : undefined}>
                <div className="budget-name">
                  <CategoryIcon id={row.category?.custom ? 'custom' : row.key} />
                  <div className="budget-name-text">
                    <strong className="truncate">
                      {row.name}
                      {row.category?.custom && <span className="chip primary">Custom</span>}
                    </strong>
                    <span className="muted small">Spent {formatMoney(row.spent)}</span>
                  </div>
                </div>
                <BudgetInput key={`${row.key}-${budget}`} budgetKey={row.key} label={row.name} />
                <div className="budget-status">
                  {budget !== undefined && <BudgetMeter spent={row.spent} budget={budget} />}
                </div>
                <div className="budget-actions">
                  {row.category?.custom && <CategoryActions category={row.category} names={names} />}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="card-header">
          <h2><Tag size={18} aria-hidden /> Add a custom category</h2>
        </div>
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            required
            maxLength={40}
            placeholder="e.g. Pets, Travel, Gifts"
            aria-label="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn primary" type="submit"><Plus size={18} aria-hidden /> Add category</button>
        </form>
        {addError && <p className="error" role="alert">{addError}</p>}
      </section>
    </>
  );
}
