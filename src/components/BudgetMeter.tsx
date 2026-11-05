import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { budgetStatus } from '../lib/budgets';
import { formatMoney } from '../lib/format';

const STATUS = {
  ok: { Icon: CircleCheck, className: 'status-ok' },
  warning: { Icon: TriangleAlert, className: 'status-warning' },
  over: { Icon: CircleX, className: 'status-over' },
};

export default function BudgetMeter({ spent, budget, onHero }: { spent: number; budget: number; onHero?: boolean }) {
  const status = budgetStatus(spent, budget);
  const pct = Math.round((spent / budget) * 100);
  const label =
    status === 'over'
      ? `Over by ${formatMoney(spent - budget)}`
      : status === 'warning'
        ? `${pct}% used · ${formatMoney(budget - spent)} left`
        : `${formatMoney(budget - spent)} left of ${formatMoney(budget)}`;
  const { Icon, className } = STATUS[status];

  return (
    <div className={`meter ${className}${onHero ? ' on-hero' : ''}`}>
      <div
        className="meter-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.min(spent, budget)}
        aria-label={`${formatMoney(spent)} of ${formatMoney(budget)} spent`}
      >
        <div className="meter-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="meter-label small">
        <Icon size={14} aria-hidden /> {label}
      </span>
    </div>
  );
}
