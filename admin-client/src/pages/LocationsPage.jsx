/**
 * src/pages/LocationsPage.jsx
 *
 * Admin management for checkpoint scan locations.
 * Allows registrar_admin to view all locations (including inactive),
 * add new locations, rename existing ones, deactivate/reactivate checkpoints,
 * and permanently delete them.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import ConfirmDialog from '../components/ConfirmDialog';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState(null); // { _id, name }
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Deactivate confirmation dialog state
  const [deactivateTarget, setDeactivateTarget] = useState(null); // location object
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // location object
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast state: { type: 'success' | 'error', message }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Fetch all locations (including inactive)
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/api/locations?includeInactive=true');
      const list = res.data.locations || res.data.data?.locations || [];
      setLocations(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // ── Add Location ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddName('');
    setAddError('');
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    if (addLoading) return;
    setIsAddOpen(false);
    setAddName('');
    setAddError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) {
      setAddError('Location name is required.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      await axiosClient.post('/api/locations', { name: trimmed });
      handleCloseAdd();
      fetchLocations();
    } catch (err) {
      if (err?.response?.status === 409) {
        setAddError(err.response.data?.message || 'A location with this name already exists.');
      } else {
        setAddError(err?.response?.data?.message || 'Failed to create location.');
      }
    } finally {
      setAddLoading(false);
    }
  };

  // ── Rename Location ───────────────────────────────────────────────────────
  const handleOpenRename = (loc) => {
    setRenameTarget(loc);
    setRenameName(loc.name);
    setRenameError('');
  };

  const handleCloseRename = () => {
    if (renameLoading) return;
    setRenameTarget(null);
    setRenameName('');
    setRenameError('');
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    const trimmed = renameName.trim();
    if (!trimmed) {
      setRenameError('Location name is required.');
      return;
    }

    if (trimmed === renameTarget.name) {
      handleCloseRename();
      return;
    }

    setRenameLoading(true);
    setRenameError('');
    try {
      await axiosClient.patch(`/api/locations/${renameTarget._id}`, { name: trimmed });
      handleCloseRename();
      fetchLocations();
    } catch (err) {
      if (err?.response?.status === 409) {
        setRenameError(err.response.data?.message || 'A location with this name already exists.');
      } else {
        setRenameError(err?.response?.data?.message || 'Failed to rename location.');
      }
    } finally {
      setRenameLoading(false);
    }
  };

  // ── Deactivate Location ───────────────────────────────────────────────────
  const handleOpenDeactivate = (loc) => {
    setDeactivateTarget(loc);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateLoading(true);
    try {
      await axiosClient.patch(`/api/locations/${deactivateTarget._id}`, { isActive: false });
      setDeactivateTarget(null);
      fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to deactivate location.');
      setDeactivateTarget(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ── Reactivate Location ───────────────────────────────────────────────────
  const handleReactivate = async (loc) => {
    try {
      await axiosClient.patch(`/api/locations/${loc._id}`, { isActive: true });
      fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reactivate location.');
    }
  };

  // ── Delete Location (permanent) ───────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteLoading(true);
    try {
      await axiosClient.delete(`/api/locations/${target._id}`);
      setLocations((prev) => prev.filter((l) => l._id !== target._id));
      showToast('success', `Deleted '${target.name}'.`);
    } catch (err) {
      if (err?.response?.status === 404) {
        // Already gone on the server — drop the stale row too
        setLocations((prev) => prev.filter((l) => l._id !== target._id));
        showToast('error', 'Location no longer exists.');
      } else {
        showToast('error', err?.response?.data?.message || 'Failed to delete location.');
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Scan Locations</h1>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
            Manage physical checkpoints and verification stations for ID validation
          </p>
        </div>

        <button
          id="add-location-btn"
          onClick={handleOpenAdd}
          className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Location
        </button>
      </div>

      {/* Page Error Banner */}
      {error && (
        <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Deactivate vs Delete explainer */}
      <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">
        <span className="text-slate-600 dark:text-white/60 font-semibold">Deactivate</span> is reversible — it hides the
        location from the scanner's dropdown, and you can reactivate it later.{' '}
        <span className="text-red-700 dark:text-red-300 font-semibold">Delete</span> is permanent — the location record is
        gone for good. Past scan logs are unaffected either way, since they store the location name directly.
      </p>

      {/* Locations Table */}
      <div className="panel overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin-slow w-8 h-8 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-white/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">No locations found. Click "Add Location" to create one.</p>
          </div>
        ) : (
          <table className="data-table min-w-[560px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th className="!text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-600/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.28 4.25-4.577C16.804 11.458 17 9.877 17 8.5 17 4.91 13.866 2 10 2S3 4.91 3 8.5c0 1.377.196 2.958 1.382 5.275 1.12 2.297 3.006 3.807 4.25 4.577.311.193.571.337.757.433a5.741 5.741 0 00.28.14l.019.008.006.003zM10 11.25a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{loc.name}</span>
                    </div>
                  </td>
                  <td>
                    {loc.isActive ? (
                      <span className="badge badge-active uppercase text-[10px] tracking-wide">
                        Active
                      </span>
                    ) : (
                      <span className="badge badge-inactive uppercase text-[10px] tracking-wide">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-nowrap items-center justify-center gap-2">
                      <button
                        id={`rename-loc-${loc._id}`}
                        onClick={() => handleOpenRename(loc)}
                        className="btn-ghost flex-shrink-0 whitespace-nowrap px-2.5 py-1 text-xs text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                      >
                        Rename
                      </button>

                      {loc.isActive ? (
                        <button
                          id={`deactivate-loc-${loc._id}`}
                          onClick={() => handleOpenDeactivate(loc)}
                          className="inline-flex items-center justify-center flex-shrink-0 whitespace-nowrap min-h-[44px] sm:min-h-0 px-2.5 py-1 text-xs rounded-xl font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          id={`reactivate-loc-${loc._id}`}
                          onClick={() => handleReactivate(loc)}
                          className="inline-flex items-center justify-center flex-shrink-0 whitespace-nowrap min-h-[44px] sm:min-h-0 px-2.5 py-1 text-xs rounded-xl font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        id={`delete-loc-${loc._id}`}
                        onClick={() => setDeleteTarget(loc)}
                        title="Permanently delete (cannot be undone)"
                        aria-label={`Permanently delete ${loc.name}`}
                        className="inline-flex items-center justify-center gap-1 flex-shrink-0 whitespace-nowrap min-h-[44px] sm:min-h-0 px-2.5 py-1 text-xs rounded-xl font-semibold text-white bg-red-600/80 hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Location Modal ────────────────────────────────────────────── */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={handleCloseAdd} role="dialog" aria-modal="true" aria-labelledby="add-loc-title">
          <div className="modal-box max-w-full sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="add-loc-title" className="text-base font-bold text-slate-900 dark:text-white">Add New Scan Location</h2>
              <button onClick={handleCloseAdd} aria-label="Close" className="-mr-2 inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 sm:p-6 space-y-4">
              {addError && (
                <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-xs px-3.5 py-2.5">
                  {addError}
                </div>
              )}

              <div>
                <label htmlFor="add-location-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Location Name *
                </label>
                <input
                  id="add-location-name"
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Science Complex, Exam Hall C..."
                  autoFocus
                  disabled={addLoading}
                  className="input-field"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAdd}
                  className="btn-ghost"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  id="submit-add-location-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={!addName.trim() || addLoading}
                >
                  {addLoading ? 'Saving…' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rename Location Modal ─────────────────────────────────────────── */}
      {renameTarget && (
        <div className="modal-overlay" onClick={handleCloseRename} role="dialog" aria-modal="true" aria-labelledby="rename-loc-title">
          <div className="modal-box max-w-full sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="rename-loc-title" className="text-base font-bold text-slate-900 dark:text-white">Rename Location</h2>
              <button onClick={handleCloseRename} aria-label="Close" className="-mr-2 inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleRenameSubmit} className="p-4 sm:p-6 space-y-4">
              {renameError && (
                <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-xs px-3.5 py-2.5">
                  {renameError}
                </div>
              )}

              <div>
                <label htmlFor="rename-location-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Location Name *
                </label>
                <input
                  id="rename-location-name"
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="e.g. Main Gate"
                  autoFocus
                  disabled={renameLoading}
                  className="input-field"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRename}
                  className="btn-ghost"
                  disabled={renameLoading}
                >
                  Cancel
                </button>
                <button
                  id="submit-rename-location-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={!renameName.trim() || renameLoading}
                >
                  {renameLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirmation Dialog ───────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        title="Deactivate Location"
        message={
          <>
            Are you sure you want to deactivate{' '}
            <strong className="text-slate-900 dark:text-white">{deactivateTarget?.name}</strong>?
            <br /><br />
            Staff will not be able to select this checkpoint for future scans. Historical scan logs and audit trails will not be changed.
          </>
        }
        variant="danger"
        confirmLabel="Deactivate"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        loading={deactivateLoading}
      />

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Location"
        message={
          <>
            Permanently delete{' '}
            <strong className="text-slate-900 dark:text-white">'{deleteTarget?.name}'</strong>?{' '}
            <strong className="text-red-700 dark:text-red-300">This cannot be undone.</strong>
            <br /><br />
            Past scan logs that used this location will be unaffected.
          </>
        }
        variant="danger"
        confirmLabel="Delete Permanently"
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!deleteLoading) setDeleteTarget(null); }}
        loading={deleteLoading}
      />

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          id="locations-toast"
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto z-[100] sm:max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-500/20 border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-200'
              : 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
