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
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">
          {loading ? 'Loading…' : `${total} log entr${total !== 1 ? 'ies' : 'y'}`}
        </span>
        <span className="text-xs text-white/30">Page {page} of {Math.max(totalPages, 1)}</span>
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin-slow w-8 h-8 text-brand-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">No logs found for the selected filters</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Student</th>
                <th>Staff</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="text-xs text-white/50 whitespace-nowrap">{formatTs(log.createdAt)}</td>
                  <td>
                    {log.student ? (
                      <div>
                        <p className="text-sm font-medium text-white">{log.student.fullName}</p>
                        <p className="text-xs font-mono text-brand-300">{log.student.matricNumber}</p>
                      </div>
                    ) : (
                      <span className="text-white/30 text-sm">
                        {log.matricNumberAttempted
                          ? <span className="font-mono text-xs text-white/40">{log.matricNumberAttempted}</span>
                          : '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    {log.staff ? (
                      <div>
                        <p className="text-sm text-white/80">{log.staff.name}</p>
                        <p className="text-xs text-white/35 capitalize">{log.staff.role?.replace('_', ' ')}</p>
                      </div>
                    ) : '—'}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">← Prev</button>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
