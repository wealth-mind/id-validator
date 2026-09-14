/**
 * src/components/LogsFilterBar.jsx
 * Filter controls for the audit logs page.
 *
 * Props:
 *   onFilter ({ result, dateFrom, dateTo }) => void
 *   loading  – boolean
 */
import { useState } from 'react';

const RESULTS = ['valid', 'invalid', 'expired', 'revoked', 'not_found'];

export default function LogsFilterBar({ onFilter, loading }) {
  const [result,   setResult]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const apply = () => onFilter({ result, dateFrom, dateTo });
  const reset = () => {
    setResult(''); setDateFrom(''); setDateTo('');
    onFilter({ result: '', dateFrom: '', dateTo: '' });
  };

  return (
    <div className="panel px-5 py-4 flex flex-wrap items-end gap-4">
      {/* Result filter */}
      <div className="min-w-[160px]">
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
          Result
        </label>
        <select
          id="log-result-filter"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          disabled={loading}
          className="select-field"
        >
          <option value="">All Results</option>
          {RESULTS.map((r) => (
            <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
          From
        </label>
        <input
          id="log-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          disabled={loading}
          className="input-field w-40"
        />
      </div>

      {/* Date to */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
          To
        </label>
        <input
          id="log-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          disabled={loading}
          className="input-field w-40"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pb-0.5">
        <button
          id="log-filter-apply"
          onClick={apply}
          disabled={loading}
          className="btn-primary"
        >
          Apply Filters
        </button>
        <button
          id="log-filter-reset"
          onClick={reset}
          disabled={loading}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
