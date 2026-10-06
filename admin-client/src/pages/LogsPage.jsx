/**
 * src/pages/LogsPage.jsx
 * Audit logs page for registrar admins to inspect scan verification history.
 */
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import LogsFilterBar from '../components/LogsFilterBar';
import LogsTable from '../components/LogsTable';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ result: '', locationTag: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 50);
      if (filters.result) params.set('result', filters.result);
      if (filters.locationTag) params.set('locationTag', filters.locationTag);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await axiosClient.get(`/api/logs?${params.toString()}`);
      setLogs(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Scan Audit Logs</h1>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-1">Immutable audit trail of every student ID verification attempt</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <LogsFilterBar onFilter={handleFilter} loading={loading} />

      {/* Logs Table */}
      <LogsTable
        logs={logs}
        total={total}
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  );
}
