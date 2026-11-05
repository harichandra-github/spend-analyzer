import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryTotal, TrendPoint } from '../lib/analytics';
import { formatMoney, formatMoneyCompact } from '../lib/format';

interface TooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly { value?: unknown; payload?: { name?: string } }[];
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <span className="muted small">{item.payload?.name ?? label}</span>
      <strong>{formatMoney(Number(item.value))}</strong>
    </div>
  );
}

const AXIS_TICK = { fontSize: 12 };

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const tickInterval = data.length > 16 ? Math.ceil(data.length / 8) - 1 : 0;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} tick={AXIS_TICK} interval={tickInterval} />
          <YAxis tickFormatter={formatMoneyCompact} tickLine={false} axisLine={false} tick={AXIS_TICK} width={64} />
          <Tooltip content={ChartTooltip} cursor={{ className: 'chart-cursor' }} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryTotal[] }) {
  const height = data.length * 36 + 40;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={formatMoneyCompact} tickLine={false} tick={AXIS_TICK} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} width={110} />
          <Tooltip content={ChartTooltip} cursor={{ className: 'chart-cursor' }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
