/**
 * src/pages/ScanPage.jsx
 *
 * The main scanner screen used by security / library / exam staff.
 *
 * Scan modes:
 *   scanMode = 'qr'     – camera scanner (default)
 *   scanMode = 'manual' – manual matric-number entry fallback
 *
 * State machine (shared across both modes):
 *   scanning – ready (camera live OR manual input open)
 *   loading  – API call in flight
 *   result   – API responded; ResultCard displayed
 *
 * API contract:
 *   POST /api/scan/validate
 *   QR path:     { token: <decoded QR string> }
 *   Manual path: { matricNumber }
 *   Response:    { result, method, data?: { student } }
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ScannerView from '../components/ScannerView';
import ManualEntryView from '../components/ManualEntryView';
import ResultCard from '../components/ResultCard';
import LoadingSpinner from '../components/LoadingSpinner';

const SCAN_STATES = { SCANNING: 'scanning', LOADING: 'loading', RESULT: 'result' };

export default function ScanPage() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const [scanState,  setScanState]  = useState(SCAN_STATES.SCANNING);
  const [scanResult, setScanResult] = useState(null);   // { result, student?, method }
  const [apiError,   setApiError]   = useState('');
  const [scanMode,   setScanMode]   = useState('qr');   // 'qr' | 'manual'
  // Key used to remount ManualEntryView and clear its input after each result
  const [manualKey,  setManualKey]  = useState(0);

  // Camera active only in QR mode during scanning state
  const scannerActive = scanState === SCAN_STATES.SCANNING && scanMode === 'qr';

  // ── Shared submission handler ──────────────────────────────────────────────
  // Accepts either { token } (QR) or { matricNumber } (manual) — never both.
  const submitValidation = useCallback(async ({ token, matricNumber }) => {
    setScanState(SCAN_STATES.LOADING);
    setApiError('');

    try {
      const body = matricNumber
        ? { matricNumber }
        : { token };

      const response = await axiosClient.post('/api/scan/validate', body);

      const { result, method, data } = response.data;
      const student = data?.student ?? null;

      setScanResult({ result, student, method: method ?? (matricNumber ? 'manual_entry' : 'qr_scan') });
      setScanState(SCAN_STATES.RESULT);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Network error. Please check your connection and try again.';
      setApiError(msg);
      setScanState(SCAN_STATES.SCANNING);
    }
  }, []);

  // ── QR decode callback ─────────────────────────────────────────────────────
  const handleScanSuccess = useCallback((decodedText) => {
    submitValidation({ token: decodedText });
  }, [submitValidation]);

  // ── Manual entry submit ────────────────────────────────────────────────────
  const handleManualSubmit = useCallback((matricNumber) => {
    submitValidation({ matricNumber });
  }, [submitValidation]);

  // ── "Scan Next" — reset to QR mode and clear everything ───────────────────
  const handleScanNext = useCallback(() => {
    setScanResult(null);
    setApiError('');
    setScanMode('qr');          // always return to QR mode after each result
    setManualKey((k) => k + 1); // remount ManualEntryView to clear its input
    setScanState(SCAN_STATES.SCANNING);
  }, []);

  // ── Mode toggle ────────────────────────────────────────────────────────────
  const handleModeSwitch = (mode) => {
    if (mode === scanMode) return;
    setApiError('');
    setScanMode(mode);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isLoading = scanState === SCAN_STATES.LOADING;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="text-brand-400" style={{ width: '1.1rem', height: '1.1rem' }} aria-hidden="true">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ID Scanner</p>
            {staff && (
              <p className="text-[10px] text-white/35 leading-none mt-0.5 truncate max-w-[160px]">
                {staff.name}
              </p>
            )}
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={handleLogout}
          aria-label="Log out"
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.571.002.002a.75.75 0 000 1.11l-.001.001 2.5 2.572a.75.75 0 101.004-1.114l-1.048-1.08H18.25A.75.75 0 0019 10z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-5 gap-5">

        {/* ── Mode toggle — only when not in result state ─────────────────── */}
        {scanState !== SCAN_STATES.RESULT && (
          <div
            role="tablist"
            aria-label="Scan method"
            className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 p-1 gap-1 animate-fade-in"
          >
            <button
              id="mode-qr-tab"
              role="tab"
              aria-selected={scanMode === 'qr'}
              onClick={() => handleModeSwitch('qr')}
              disabled={isLoading}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200',
                scanMode === 'qr'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5',
                'disabled:opacity-40',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h2A2.25 2.25 0 018.5 4.25v2A2.25 2.25 0 016.25 8.5h-2A2.25 2.25 0 012 6.25v-2zm9.5 0A2.25 2.25 0 0113.75 2h2A2.25 2.25 0 0118 4.25v2a2.25 2.25 0 01-2.25 2.25h-2a2.25 2.25 0 01-2.25-2.25v-2zm-9.5 9.5A2.25 2.25 0 014.25 11.5h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 18h-2A2.25 2.25 0 012 15.75v-2zm9.5 0A2.25 2.25 0 0113.75 11.5h2A2.25 2.25 0 0118 13.75v2A2.25 2.25 0 0115.75 18h-2a2.25 2.25 0 01-2.25-2.25v-2z" clipRule="evenodd" />
              </svg>
              Scan QR Code
            </button>

            <button
              id="mode-manual-tab"
              role="tab"
              aria-selected={scanMode === 'manual'}
              onClick={() => handleModeSwitch('manual')}
              disabled={isLoading}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200',
                scanMode === 'manual'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5',
                'disabled:opacity-40',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              Enter Matric No.
            </button>
          </div>
        )}

        {/* ── SCANNING / LOADING — QR mode ──────────────────────────────── */}
        {(scanState === SCAN_STATES.SCANNING || isLoading) && scanMode === 'qr' && (
          <div className="flex flex-col gap-4">
            <div className="glass-card overflow-hidden p-3">
              {/* ScannerView is always rendered in QR mode to avoid remount cost,
                  but isActive=false pauses decoding during loading */}
              <ScannerView
                onScanSuccess={handleScanSuccess}
                isActive={scannerActive}
                onSwitchToManual={() => handleModeSwitch('manual')}
              />
            </div>

            {scanState === SCAN_STATES.SCANNING && (
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm animate-fade-in">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                Point the camera at a student ID QR code
              </div>
            )}

            {isLoading && (
              <div className="glass-card py-8 animate-fade-in">
                <LoadingSpinner overlay message="Validating ID…" />
              </div>
            )}
          </div>
        )}

        {/* ── SCANNING / LOADING — Manual mode ─────────────────────────── */}
        {(scanState === SCAN_STATES.SCANNING || isLoading) && scanMode === 'manual' && (
          <>
            {isLoading ? (
              <div className="glass-card py-8 animate-fade-in">
                <LoadingSpinner overlay message="Validating ID…" />
              </div>
            ) : (
              <ManualEntryView
                key={manualKey}
                onSubmit={handleManualSubmit}
                loading={isLoading}
              />
            )}
          </>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────── */}
        {scanState === SCAN_STATES.RESULT && scanResult && (
          <ResultCard
            result={scanResult.result}
            student={scanResult.student}
            method={scanResult.method}
            onScanNext={handleScanNext}
          />
        )}

        {/* ── API / network error banner ──────────────────────────────────── */}
        {apiError && scanState === SCAN_STATES.SCANNING && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-red-500/15 border border-red-500/30
                       text-red-300 text-sm px-4 py-3 animate-fade-in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {apiError}
          </div>
        )}
      </main>
    </div>
  );
}
