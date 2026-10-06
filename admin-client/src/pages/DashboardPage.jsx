/**
 * src/pages/DashboardPage.jsx
 * Admin dashboard overview with key statistics and recent activity.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/StatCard';

function formatTs(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

const RESULT_BADGE = {
  valid:     'badge-valid',
  invalid:   'badge-invalid',
  expired:   'badge-expired',
  revoked:   'badge-revoked',
  not_found: 'badge-not_found',
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalLogs: 0,
    validScans: 0,
    activeLocations: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        const [studentsRes, activeRes, logsRes, locationsRes] = await Promise.all([
          axiosClient.get('/api/students?limit=1'),
          axiosClient.get('/api/students?status=active&limit=1'),
          axiosClient.get('/api/logs?limit=5'),
          axiosClient.get('/api/locations'),
        ]);

        const recentList = logsRes.data.data ?? [];
        const activeLocations = (locationsRes.data.locations ?? []).filter((l) => l.isActive !== false).length;

        setStats({
          totalStudents: studentsRes.data.total ?? 0,
          activeStudents: activeRes.data.total ?? 0,
          totalLogs: logsRes.data.total ?? 0,
          validScans: recentList.filter((l) => l.result === 'valid').length,
          activeLocations,
        });

        setRecentLogs(recentList);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-1">System status and scan verification metrics</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Students"
          value={loading ? '…' : stats.totalStudents}
          colorClass="text-brand-700 dark:text-brand-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
            </svg>
          }
        />
        <StatCard
          label="Active Enrollments"
          value={loading ? '…' : stats.activeStudents}
          colorClass="text-emerald-700 dark:text-emerald-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Total Scans Logged"
          value={loading ? '…' : stats.totalLogs}
          colorClass="text-purple-700 dark:text-purple-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Active Locations"
          value={loading ? '…' : `${stats.activeLocations} Checkpoint${stats.activeLocations !== 1 ? 's' : ''}`}
          colorClass="text-amber-700 dark:text-amber-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="System Status"
          value="Operational"
          colorClass="text-emerald-600 dark:text-emerald-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* Recent Scan Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Validation Scans</h2>
          <Link to="/logs" className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200">
            View All Logs →
          </Link>
        </div>

        <div className="panel overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin-slow w-6 h-6 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-white/30 py-8 text-sm">No recent scans recorded</p>
          ) : (
            <table className="data-table">
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
                {recentLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-xs text-slate-600 dark:text-white/50">{formatTs(log.createdAt)}</td>
                    <td>
                      {log.student ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{log.student.fullName}</p>
                          <p className="text-xs font-mono text-brand-700 dark:text-brand-300">{log.student.matricNumber}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-white/40 text-xs font-mono">{log.matricNumberAttempted || '—'}</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-slate-700 dark:text-white/80">{log.staff?.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 dark:text-white/35 capitalize">{log.staff?.role?.replace('_', ' ') ?? ''}</p>
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
                      <span className={`badge ${RESULT_BADGE[log.result] ?? 'badge-inactive'} uppercase text-[10px]`}>
                        {log.result?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
