import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { sumAmounts } from '../lib/analytics';
import { useExpenses } from '../lib/expenses';
import { formatDate, formatMoney } from '../lib/format';
import DateRangeFilter, { presetRange } from '../components/DateRangeFilter';

export default function Reports() {
  const user = useUser();
  const { categories, getCategory, budgets } = useData();
  const [range, setRange] = useState(() => presetRange('thisMonth'));
  const [categoryId, setCategoryId] = useState('');
  const { expenses, loading, error } = useExpenses(user.uid, range.start, range.end);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const selected = categoryId ? expenses.filter((e) => getCategory(e.categoryId).id === categoryId) : expenses;

  async function handleDownload() {
    setGenerating(true);
    setGenError(null);
    try {
      const { downloadReport } = await import('../lib/report');
      downloadReport({
        expenses: selected,
        range,
        getCategory,
        categories,
        budgets,
        email: user.email ?? '',
        categoryFilter: categoryId || undefined,
      });
    } catch {
      setGenError('Could not create the PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const preview = [
    { label: 'Period', value: `${formatDate(range.start)} – ${formatDate(range.end)}` },
    { label: 'Category', value: categoryId ? getCategory(categoryId).name : 'All categories' },
    { label: 'Expenses', value: loading ? '…' : String(selected.length) },
    { label: 'Total', value: loading ? '…' : formatMoney(sumAmounts(selected)) },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Download a PDF with a summary, category breakdown, budget comparison and every expense.</p>
        </div>
      </div>

      <div className="filters">
        <DateRangeFilter initial="thisMonth" value={range} onChange={setRange} />
        <select aria-label="Filter by category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="error-banner" role="alert">Could not load expenses: {error}</p>}

      <section className="card report-card">
        <div className="card-header">
          <h2><FileText size={18} aria-hidden /> Report preview</h2>
        </div>
        <dl className="report-preview">
          {preview.map((p) => (
            <div key={p.label} className="preview-item">
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
        <div className="report-cta">
          <button className="btn primary" onClick={handleDownload} disabled={loading || generating || selected.length === 0}>
            <Download size={18} aria-hidden /> {generating ? 'Creating PDF…' : 'Download PDF'}
          </button>
          {!loading && selected.length === 0 && <span className="muted small">No expenses in this period to report on.</span>}
        </div>
        {genError && <p className="error-banner" role="alert">{genError}</p>}
      </section>
    </>
  );
}
