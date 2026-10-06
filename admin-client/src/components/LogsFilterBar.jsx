/**
 * src/components/LogsFilterBar.jsx
 * Filter controls for the audit logs page.
 *
 * Props:
 *   onFilter ({ result, dateFrom, dateTo }) => void
 *   loading  – boolean
 */
import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const RESULTS = ['valid', 'invalid', 'expired', 'revoked', 'not_found'];

export default function LogsFilterBar({ onFilter, loading }) {
  const [result,      setResult]      = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [locations,   setLocations]   = useState([]);

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await axiosClient.get('/api/locations?includeInactive=true');
        const list = res.data.locations || res.data.data?.locations || [];
        setLocations(list.map((l) => (typeof l === 'string' ? l : l.name)));
      } catch (_) {
        // Fail gracefully
      }
    }
    loadLocations();
  }, []);

  const apply = () => onFilter({ result, locationTag, dateFrom, dateTo });
  const reset = () => {
    setResult(''); setLocationTag(''); setDateFrom(''); setDateTo('');
    onFilter({ result: '', locationTag: '', dateFrom: '', dateTo: '' });
  };

  return (
    <div className="panel px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] items-end gap-4">
      {/* Result filter */}
      <div className="min-w-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
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

      {/* Location filter */}
      <div className="min-w-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
          Location
        </label>
        <select
          id="log-location-filter"
          value={locationTag}
          onChange={(e) => setLocationTag(e.target.value)}
          disabled={loading}
          className="select-field"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="min-w-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
          From
        </label>
        <input
          id="log-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          disabled={loading}
          className="input-field"
        />
      </div>

      {/* Date to */}
      <div className="min-w-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
          To
        </label>
        <input
          id="log-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          disabled={loading}
          className="input-field"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:flex gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-1">
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
