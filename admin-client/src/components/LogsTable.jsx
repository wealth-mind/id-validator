/**
 * src/components/LogsTable.jsx
 * Paginated scan audit log table.
 *
 * Props:
 *   logs       – array of populated log objects
 *   total      – total count
 *   page       – current page
 *   totalPages – total pages
 *   loading    – boolean
 *   onPageChange(p) – callback
 */

const RESULT_BADGE = {
  valid:     'badge-valid',
  invalid:   'badge-invalid',
  expired:   'badge-expired',
  revoked:   'badge-revoked',
  not_found: 'badge-not_found',
};

function formatTs(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function LogsTable({ logs, total, page, totalPages, loading, onPageChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-xs text-slate-400 dark:text-white/30">
          {loading ? 'Loading…' : `${total} log entr${total !== 1 ? 'ies' : 'y'}`}
        </span>
        <span className="text-xs text-slate-400 dark:text-white/30">Page {page} of {Math.max(totalPages, 1)}</span>
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin-slow w-8 h-8 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">No logs found for the selected filters</p>
          </div>
        ) : (
          <>
          {/* Mobile / small tablet: stacked card per log entry (below md) */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {logs.map((log) => (
              <li key={log._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {log.student ? (
                      <>
                        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{log.student.fullName}</p>
                        <p className="text-xs font-mono text-brand-700 dark:text-brand-300 break-all">{log.student.matricNumber}</p>
                      </>
                    ) : (
                      <p className="font-mono text-xs text-slate-500 dark:text-white/40 break-all">
                        {log.matricNumberAttempted || '—'}
                      </p>
                    )}
                  </div>
                  <span className={`badge flex-shrink-0 ${RESULT_BADGE[log.result] ?? 'badge-inactive'} uppercase text-[10px] tracking-wide`}>
                    {log.result?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-white/50">
                  <span>{formatTs(log.createdAt)}</span>
                  {log.locationTag && <span className="font-medium text-slate-700 dark:text-white/80">· {log.locationTag}</span>}
                </div>
                {log.staff && (
                  <p className="text-xs text-slate-500 dark:text-white/35">
                    Staff: <span className="text-slate-700 dark:text-white/70">{log.staff.name}</span>
                    {log.staff.role && <span className="capitalize"> ({log.staff.role.replace('_', ' ')})</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {/* md and up: full table (inside its own overflow-x-auto wrapper) */}
          <table className="data-table hidden md:table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Student</th>
                <th>Staff</th>
                <th>Location</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="text-xs text-slate-600 dark:text-white/50 whitespace-nowrap">{formatTs(log.createdAt)}</td>
                  <td>
                    {log.student ? (
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{log.student.fullName}</p>
                        <p className="text-xs font-mono text-brand-700 dark:text-brand-300">{log.student.matricNumber}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-white/30 text-sm">
                        {log.matricNumberAttempted
                          ? <span className="font-mono text-xs text-slate-500 dark:text-white/40">{log.matricNumberAttempted}</span>
                          : '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    {log.staff ? (
                      <div>
                        <p className="text-sm text-slate-700 dark:text-white/80">{log.staff.name}</p>
                        <p className="text-xs text-slate-500 dark:text-white/35 capitalize">{log.staff.role?.replace('_', ' ')}</p>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    {log.locationTag ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-white/80 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" aria-hidden="true">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.28 4.25-4.577C16.804 11.458 17 9.877 17 8.5 17 4.91 13.866 2 10 2S3 4.91 3 8.5c0 1.377.196 2.958 1.382 5.275 1.12 2.297 3.006 3.807 4.25 4.577.311.193.571.337.757.433a5.741 5.741 0 00.28.14l.019.008.006.003zM10 11.25a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5z" clipRule="evenodd" />
                        </svg>
                        {log.locationTag}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${RESULT_BADGE[log.result] ?? 'badge-inactive'} uppercase text-[10px] tracking-wide`}>
                      {log.result?.replace('_', ' ')}
                    </span>
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
        <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">← Prev</button>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
