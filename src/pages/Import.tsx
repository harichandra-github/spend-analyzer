import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, Download, FileSpreadsheet, TriangleAlert, Upload } from 'lucide-react';
import { useUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CSV_TEMPLATE, MAX_IMPORT_ROWS, parseCsv, type ParsedRow } from '../lib/csv';
import { addExpensesBulk } from '../lib/expenses';
import { formatDate, formatMoney } from '../lib/format';

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spend-analyzer-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Import() {
  const user = useUser();
  const { categories, getCategory } = useData();
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  const valid = rows?.filter((r) => r.input) ?? [];
  const invalid = rows?.filter((r) => r.error) ?? [];

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    setRows(null);
    setError(null);
    setImported(null);
    try {
      setRows(await parseCsv(file, categories));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the file.');
    }
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      await addExpensesBulk(user.uid, valid.map((r) => r.input!));
      setImported(valid.length);
      setRows(null);
      setFileName('');
    } catch {
      setError('Import failed. Some rows may have been saved; check your expenses before trying again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Import from CSV</h1>
          <p className="muted">
            Columns <strong>Date, Amount, Description</strong> are required; <strong>Category, Payment Method, Notes</strong> are optional.
            Dates can be YYYY-MM-DD or DD/MM/YYYY. Up to {MAX_IMPORT_ROWS} rows at a time.
          </p>
        </div>
        <button className="btn ghost" onClick={downloadTemplate}>
          <Download size={16} aria-hidden /> Download template
        </button>
      </div>

      <label className="dropzone">
        <span className="empty-icon" aria-hidden><FileSpreadsheet size={22} /></span>
        <span className="empty-title">{fileName || 'Choose a CSV file'}</span>
        <span className="muted small">{fileName ? 'Click to choose a different file' : 'Click here or drop your bank export'}</span>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} aria-label="Choose CSV file" />
      </label>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {imported !== null && (
        <p className="success-banner" role="status">
          <CircleCheck size={18} aria-hidden /> Imported {imported} {imported === 1 ? 'expense' : 'expenses'}. <Link to="/expenses">View expenses</Link>
        </p>
      )}

      {rows && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Preview</h2>
              <p className="muted small">
                {valid.length} ready · {invalid.length} with errors (skipped)
              </p>
            </div>
            <button className="btn primary" disabled={valid.length === 0 || importing} onClick={handleImport}>
              <Upload size={16} aria-hidden /> {importing ? 'Importing…' : `Import ${valid.length} ${valid.length === 1 ? 'row' : 'rows'}`}
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line</th><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className={r.error ? 'row-error' : undefined}>
                    <td className="muted">{r.line}</td>
                    <td>{r.input ? formatDate(r.input.date) : r.date}</td>
                    <td>{r.description}</td>
                    <td>{r.input ? getCategory(r.input.categoryId).name : r.category}</td>
                    <td className="num">{r.input ? formatMoney(r.input.amount) : r.amount}</td>
                    <td>
                      {r.error ? (
                        <span className="status-pill status-over"><CircleX size={13} aria-hidden /> {r.error}</span>
                      ) : r.warning ? (
                        <span className="status-pill status-warning"><TriangleAlert size={13} aria-hidden /> {r.warning}</span>
                      ) : (
                        <span className="status-pill status-ok"><CircleCheck size={13} aria-hidden /> OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
