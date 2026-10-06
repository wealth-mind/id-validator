/**
 * src/components/StudentTable.jsx
 * Paginated, searchable student table with Edit and Reissue Token actions.
 *
 * Props:
 *   students      – array of student objects
 *   total         – total count (for pagination)
 *   page          – current page number
 *   totalPages    – total page count
 *   loading       – boolean
 *   search        – current search string
 *   statusFilter  – current status filter
 *   onSearch      – (q: string) => void
 *   onStatusFilter– (s: string) => void
 *   onPageChange  – (p: number) => void
 *   onEdit        – (student) => void
 *   onReissue     – (student) => void
 */
import { useRef } from 'react';

const STATUS_LABELS = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', graduated: 'Graduated' };
const STATUS_BADGE  = { active: 'badge-active', inactive: 'badge-inactive', suspended: 'badge-suspended', graduated: 'badge-graduated' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function StudentTable({
  students, total, page, totalPages, loading,
  search, statusFilter,
  onSearch, onStatusFilter, onPageChange,
  onEdit, onReissue,
}) {
  const debounceRef = useRef(null);

  const handleSearchInput = (e) => {
    const v = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v), 400);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/25" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            id="student-search"
            type="search"
            defaultValue={search}
            onChange={handleSearchInput}
            placeholder="Search name or matric number…"
            className="input-field pl-9"
          />
        </div>

        {/* Status filter */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="select-field w-full sm:w-40"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Record count */}
        <span className="text-xs text-slate-400 dark:text-white/30 sm:ml-auto whitespace-nowrap">
          {loading ? 'Loading…' : `${total} student${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="panel overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin-slow w-8 h-8 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
            </svg>
            <p className="text-sm">No students found</p>
          </div>
        ) : (
          <>
          {/* Mobile / small tablet: one stacked card per student (below md) */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {students.map((s) => (
              <li key={s._id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white break-words">{s.fullName}</p>
                    <p className="font-mono text-xs text-brand-700 dark:text-brand-300 break-all">{s.matricNumber}</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${STATUS_BADGE[s.status] ?? 'badge-inactive'}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="min-w-0">
                    <dt className="text-slate-500 dark:text-white/40">College</dt>
                    <dd className="text-slate-700 dark:text-white/70 break-words">{s.college ?? '—'}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500 dark:text-white/40">Department</dt>
                    <dd className="text-slate-700 dark:text-white/70 break-words">{s.department}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-white/40">Level</dt>
                    <dd className="text-slate-700 dark:text-white/70 capitalize">{s.programLevel}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-white/40">Valid Until</dt>
                    <dd className="text-slate-700 dark:text-white/70">{formatDate(s.validUntil)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-white/40">Token</dt>
                    <dd>
                      {s.currentToken?.revoked ? (
                        <span className="badge badge-revoked text-[10px]">Revoked</span>
                      ) : s.currentToken ? (
                        <span className="badge badge-valid text-[10px]">Issued</span>
                      ) : (
                        <span className="badge badge-inactive text-[10px]">None</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id={`edit-btn-m-${s._id}`}
                    onClick={() => onEdit(s)}
                    className="min-h-[44px] text-sm px-3 py-2 rounded-lg bg-slate-900/8 dark:bg-white/8 hover:bg-slate-900/15 dark:hover:bg-white/15 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    Edit
                  </button>
                  <button
                    id={`reissue-btn-m-${s._id}`}
                    onClick={() => onReissue(s)}
                    className="min-h-[44px] text-sm px-3 py-2 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-700 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 transition-all"
                  >
                    Reissue Token
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* md and up: full table (still inside its own overflow-x-auto wrapper) */}
          <table className="data-table hidden md:table">
            <thead>
              <tr>
                <th>Matric No.</th>
                <th>Full Name</th>
                <th>College</th>
                <th>Department</th>
                <th>Level</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Token</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="font-mono text-xs text-brand-700 dark:text-brand-300">{s.matricNumber}</td>
                  <td className="font-medium text-slate-900 dark:text-white">{s.fullName}</td>
                  <td className="text-slate-600 dark:text-white/60 max-w-[140px] truncate">{s.college ?? '—'}</td>
                  <td className="text-slate-600 dark:text-white/60 max-w-[140px] truncate">{s.department}</td>
                  <td className="text-slate-600 dark:text-white/60 capitalize">{s.programLevel}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-inactive'}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="text-slate-600 dark:text-white/50 text-xs">{formatDate(s.validUntil)}</td>
                  <td>
                    {s.currentToken?.revoked ? (
                      <span className="badge badge-revoked text-[10px]">Revoked</span>
                    ) : s.currentToken ? (
                      <span className="badge badge-valid text-[10px]">Issued</span>
                    ) : (
                      <span className="badge badge-inactive text-[10px]">None</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`edit-btn-${s._id}`}
                        onClick={() => onEdit(s)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/8 dark:bg-white/8 hover:bg-slate-900/15 dark:hover:bg-white/15 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
                      >
                        Edit
                      </button>
                      <button
                        id={`reissue-btn-${s._id}`}
                        onClick={() => onReissue(s)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-700 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 transition-all"
                      >
                        Reissue Token
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 text-sm">
          <span className="text-slate-400 dark:text-white/30 text-center sm:text-left">Page {page} of {totalPages}</span>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
