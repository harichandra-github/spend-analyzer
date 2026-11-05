import { Pencil, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Expense } from '../lib/expenses';
import { formatDate, formatMoney } from '../lib/format';
import { CategoryIcon } from './Icons';

interface Props {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ExpenseRow({ expense, onEdit, onDelete }: Props) {
  const { getCategory } = useData();
  const category = getCategory(expense.categoryId);
  return (
    <li className="expense-row">
      <CategoryIcon id={category.custom ? 'custom' : category.id} />
      <div className="expense-main">
        <span className="expense-desc">{expense.description}</span>
        <span className="expense-meta">
          <span className="chip">{category.name}</span>
          {formatDate(expense.date)}
          {expense.paymentMethod && <> · {expense.paymentMethod}</>}
        </span>
        {expense.notes && <span className="expense-notes">{expense.notes}</span>}
      </div>
      <span className="expense-amount">{formatMoney(expense.amount)}</span>
      {(onEdit || onDelete) && (
        <div className="row-actions">
          {onEdit && (
            <button className="icon-btn sm" onClick={onEdit} aria-label="Edit" title="Edit">
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button className="icon-btn sm danger" onClick={onDelete} aria-label="Delete" title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
