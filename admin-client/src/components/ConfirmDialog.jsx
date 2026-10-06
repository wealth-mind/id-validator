/**
 * src/components/ConfirmDialog.jsx
 * Reusable confirmation modal for destructive / high-impact actions.
 *
 * Props:
 *   isOpen    – boolean
 *   title     – string
 *   message   – string or JSX
 *   variant   – 'danger' | 'warning'
 *   confirmLabel – string (default "Confirm")
 *   onConfirm – () => void
 *   onCancel  – () => void
 *   loading   – boolean
 */
import { useEffect } from 'react';

export default function ConfirmDialog({
  isOpen, title, message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  onConfirm, onCancel,
  loading = false,
}) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconCls   = variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
  const confirmCls = variant === 'danger' ? 'btn-danger' : 'btn-primary bg-amber-600 hover:bg-amber-500';

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-box max-w-full sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3 min-w-0">
            <span className={iconCls}>
              {variant === 'danger' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <h2 id="confirm-title" className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4">
          <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed break-words">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-4 sm:px-6 pb-5">
          <button id="confirm-cancel-btn" onClick={onCancel} className="btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button id="confirm-ok-btn" onClick={onConfirm} className={confirmCls} disabled={loading}>
            {loading ? (
              <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
