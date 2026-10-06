/**
 * src/components/StudentQrLookup.jsx
 *
 * QR scanner modal and manual fallback lookup for looking up and editing
 * student records in the Admin Dashboard.
 *
 * Calls POST /api/students/lookup-by-qr with decoded QR token or
 * falls back to GET /api/students?search=<matric> for manual input.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosClient from '../api/axiosClient';

const SCANNER_DOM_ID = 'admin-qr-reader';

const QR_CONFIG = {
  fps: 10,
  qrbox: { width: 220, height: 220 },
  aspectRatio: 1.0,
  disableFlip: false,
};

export default function StudentQrLookup({
  isOpen,
  onClose,
  onStudentFound,
  scanError,
  setScanError,
}) {
  const html5QrRef = useRef(null);
  const isRunningRef = useRef(false);
  const isLookingUpRef = useRef(false);

  const [cameraError, setCameraError] = useState(null); // null | 'permission_denied' | 'no_device' | 'unknown'
  const [retryKey, setRetryKey] = useState(0);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Manual fallback input state
  const [manualInput, setManualInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Stop camera and cleanup instance
  const stopScanner = useCallback(async () => {
    if (html5QrRef.current && isRunningRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {
        // ignore errors during cleanup
      }
      isRunningRef.current = false;
    }
    if (html5QrRef.current) {
      try { html5QrRef.current.clear(); } catch (_) {}
      html5QrRef.current = null;
    }
  }, []);

  // Handle successful QR decode
  const handleQrDecoded = useCallback(
    async (decodedText) => {
      if (isLookingUpRef.current) return;
      isLookingUpRef.current = true;
      setIsLookingUp(true);
      if (setScanError) setScanError('');

      try {
        const res = await axiosClient.post('/api/students/lookup-by-qr', {
          qrToken: decodedText.trim(),
        });

        const student = res.data.student || res.data.data?.student || res.data.data;
        if (student) {
          await stopScanner();
          onStudentFound(student);
          return;
        }
        throw new Error('No student data returned from lookup.');
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to lookup student record from this QR code.';
        if (setScanError) setScanError(msg);

        // Allow retry after a short delay so the camera stays active
        setTimeout(() => {
          isLookingUpRef.current = false;
          setIsLookingUp(false);
        }, 1500);
      }
    },
    [onStudentFound, setScanError, stopScanner]
  );

  // Initialize and start scanner when opened
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let cancelled = false;
    isLookingUpRef.current = false;
    setIsLookingUp(false);
    setCameraError(null);
    setManualInput('');

    const startScanner = async () => {
      try {
        html5QrRef.current = new Html5Qrcode(SCANNER_DOM_ID, { verbose: false });

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;

        if (!cameras || cameras.length === 0) {
          setCameraError('no_device');
          return;
        }

        const rearCamera = cameras.find((c) =>
          /back|rear|environment/i.test(c.label)
        );
        const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

        await html5QrRef.current.start(
          cameraId,
          QR_CONFIG,
          (decodedText) => {
            if (!cancelled) handleQrDecoded(decodedText);
          },
          undefined // per-frame decode failure ignored
        );

        if (cancelled) {
          await stopScanner();
          return;
        }

        isRunningRef.current = true;
      } catch (err) {
        if (cancelled) return;
        console.error('[StudentQrLookup] camera error:', err);

        if (
          err?.name === 'NotAllowedError' ||
          err?.message?.toLowerCase().includes('permission')
        ) {
          setCameraError('permission_denied');
        } else if (
          err?.name === 'NotFoundError' ||
          err?.message?.toLowerCase().includes('not found')
        ) {
          setCameraError('no_device');
        } else {
          setCameraError('unknown');
        }
      }
    };

    // Small timeout to ensure DOM container is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, retryKey, handleQrDecoded, stopScanner]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLookingUp && !manualLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLookingUp, manualLoading, onClose]);

  // Manual fallback submit (GET /api/students?search=<matric>)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const query = manualInput.trim();
    if (!query) return;

    setManualLoading(true);
    if (setScanError) setScanError('');

    try {
      const res = await axiosClient.get(`/api/students?search=${encodeURIComponent(query)}`);
      const list = res.data.data ?? [];

      if (list.length === 1) {
        await stopScanner();
        onStudentFound(list[0]);
        return;
      }

      if (list.length > 1) {
        // Check for exact matric number match
        const exactMatch = list.find(
          (s) => s.matricNumber.toUpperCase() === query.toUpperCase()
        );
        if (exactMatch) {
          await stopScanner();
          onStudentFound(exactMatch);
          return;
        }
        if (setScanError) {
          setScanError(`Multiple students matched (${list.length}). Please enter the exact matric number.`);
        }
        return;
      }

      if (setScanError) {
        setScanError(`No student record found matching "${query}".`);
      }
    } catch (err) {
      if (setScanError) {
        setScanError(err?.response?.data?.message || 'Failed to search student record.');
      }
    } finally {
      setManualLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={isLookingUp || manualLoading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-lookup-modal-title"
    >
      <div
        className="modal-box max-w-full sm:max-w-md animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h4.5A1.5 1.5 0 0110.5 4.5v4.5A1.5 1.5 0 019 10.5H4.5A1.5 1.5 0 013 9V4.5zm1.5 0v4.5h4.5V4.5h-4.5zM3 15a1.5 1.5 0 011.5-1.5h4.5A1.5 1.5 0 0110.5 15v4.5A1.5 1.5 0 019 21H4.5A1.5 1.5 0 013 19.5V15zm1.5 0v4.5h4.5V15h-4.5zM13.5 4.5A1.5 1.5 0 0115 3h4.5A1.5 1.5 0 0121 4.5v4.5A1.5 1.5 0 0119.5 10.5H15A1.5 1.5 0 0113.5 9V4.5zm1.5 0v4.5h4.5V4.5h-4.5zM15 13.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5V15a1.5 1.5 0 00-1.5-1.5H15zm0 1.5h4.5v4.5H15V15z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="qr-lookup-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Scan Student QR Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/40">Point camera at ID card to view/edit record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLookingUp || manualLoading}
            aria-label="Close scanner"
            className="-mr-2 inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Inline Error Alert */}
          {scanError && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 text-xs px-3.5 py-2.5 animate-fade-in flex items-start gap-2.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">{scanError}</span>
            </div>
          )}

          {/* Looking up in flight overlay / indicator */}
          {isLookingUp && (
            <div className="rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-700 dark:text-brand-300 text-xs px-3.5 py-2 animate-fade-in flex items-center gap-2">
              <svg className="animate-spin-slow w-4 h-4 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Decoding & looking up student record…</span>
            </div>
          )}

          {/* Camera Error Display */}
          {cameraError ? (
            <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl p-5 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-slate-700 dark:text-white/70 max-w-xs">
                {cameraError === 'permission_denied'
                  ? 'Camera access was denied. Please allow camera permissions in your browser.'
                  : cameraError === 'no_device'
                  ? 'No camera found on this device.'
                  : 'Unable to start camera. You can use manual matric entry below.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setRetryKey((k) => k + 1);
                }}
                className="btn-ghost text-xs px-3 py-1.5"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            /* Camera Viewport */
            <div className="relative w-full max-w-full rounded-xl overflow-hidden bg-black/40 border border-slate-900/10 dark:border-white/10 min-h-[240px] flex items-center justify-center">
              <div id={SCANNER_DOM_ID} className="w-full" />

              {/* Decorative reticle */}
              {!cameraError && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44">
                    {['tl', 'tr', 'bl', 'br'].map((corner) => {
                      const isTop = corner.startsWith('t');
                      const isLeft = corner.endsWith('l');
                      return (
                        <span
                          key={corner}
                          className={`absolute w-6 h-6 border-brand-400
                            ${isTop ? 'top-0 border-t-2' : 'bottom-0 border-b-2'}
                            ${isLeft ? 'left-0 border-l-2' : 'right-0 border-r-2'}
                            ${isTop && isLeft ? 'rounded-tl-md' : ''}
                            ${isTop && !isLeft ? 'rounded-tr-md' : ''}
                            ${!isTop && isLeft ? 'rounded-bl-md' : ''}
                            ${!isTop && !isLeft ? 'rounded-br-md' : ''}
                          `}
                        />
                      );
                    })}
                    <div className="absolute left-1 right-1 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-75 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-900/10 dark:border-white/10"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 dark:text-white/30 font-medium">
              Or enter matric number
            </span>
            <div className="flex-grow border-t border-slate-900/10 dark:border-white/10"></div>
          </div>

          {/* Manual Fallback Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              id="manual-matric-input"
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. CSC/2021/001"
              disabled={isLookingUp || manualLoading}
              className="input-field font-mono sm:text-xs uppercase flex-1 min-w-0"
            />
            <button
              id="manual-lookup-btn"
              type="submit"
              disabled={!manualInput.trim() || isLookingUp || manualLoading}
              className="btn-primary text-xs px-4 py-2 whitespace-nowrap flex-shrink-0"
            >
              {manualLoading ? (
                <svg className="animate-spin-slow w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                'Find Student'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 sm:px-5 py-3.5 bg-slate-900/[0.02] dark:bg-white/[0.02] border-t border-slate-900/5 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLookingUp || manualLoading}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
