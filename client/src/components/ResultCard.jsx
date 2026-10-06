/**
 * src/components/ResultCard.jsx
 *
 * Renders the scan validation response returned by POST /api/scan/validate.
 *
 * Props:
 *   result     – 'valid' | 'invalid' | 'expired' | 'revoked' | 'not_found'
 *   student    – object from response data (only present on 'valid')
 *   method     – 'qr_scan' | 'manual_entry'  (defaults to 'qr_scan')
 *   onScanNext – callback fired when the staff member presses "Scan Next"
 */

import { useEffect, useRef } from 'react';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

function StatusBadge({ result }) {
  const cfg = {
    valid:     { label: 'VALID',    classes: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' },
    expired:   { label: 'EXPIRED',  classes: 'bg-amber-500/20  text-amber-700 dark:text-amber-300  border-amber-500/40'    },
    revoked:   { label: 'REVOKED',  classes: 'bg-red-500/20    text-red-700 dark:text-red-300    border-red-500/40'      },
    invalid:   { label: 'INVALID',  classes: 'bg-red-500/20    text-red-700 dark:text-red-300    border-red-500/40'      },
    not_found: { label: 'NOT FOUND',classes: 'bg-red-500/20    text-red-700 dark:text-red-300    border-red-500/40'      },
  }[result] ?? { label: result?.toUpperCase(), classes: 'bg-slate-900/10 dark:bg-white/10 text-slate-600 dark:text-white/60 border-slate-900/20 dark:border-white/20' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${result === 'valid' ? 'bg-emerald-400' : result === 'expired' ? 'bg-amber-400' : 'bg-red-400'}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400 dark:text-white/30 flex-shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-white/40 font-semibold mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{value ?? '—'}</p>
      </div>
    </div>
  );
}

/**
 * Amber notice banner shown only for manual_entry results.
 * Reminds staff that physical card authenticity was NOT verified.
 */
function ManualEntryNotice() {
  return (
    <div className="mx-4 sm:mx-6 md:mx-8 mb-4 flex items-start gap-2.5 rounded-xl
                    bg-amber-500/10 border border-amber-500/25
                    px-3.5 py-2.5 animate-fade-in" role="note">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
      <p className="text-xs text-amber-700/90 dark:text-amber-300/90 leading-snug">
        <span className="font-semibold">Verified by matric number entry — card not scanned.</span>{' '}
        This confirms the record is currently valid, but does not authenticate the physical card.
      </p>
    </div>
  );
}

/* ── Icon set ────────────────────────────────────────────────────────────── */
const icons = {
  id:       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 6a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H4a3 3 0 01-3-3V6zm4 1.5a2 2 0 114 0 2 2 0 01-4 0zm2 3c-1.1 0-3.12.484-3.5 1.455v.545h7v-.545c-.38-.97-2.4-1.455-3.5-1.455zm5-2.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>,
  college:  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 16.5v-13h12v13h1.5a.75.75 0 000-1.5h-.75V3A1.5 1.5 0 0015.25 1.5h-10.5A1.5 1.5 0 003.25 3v12H2.5a.75.75 0 000 1.5H4zm2-10.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 016 6zm0 3.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 016 9.5zm0 3.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 016 13zm5.25-7a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" clipRule="evenodd" /></svg>,
  dept:     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h10.5a.75.75 0 010 1.5H12v13.75a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h.25V3.5H1.75A.75.75 0 011 2.75zm5.25 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM14.5 9a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v8.5a.5.5 0 01-.5.5H15a.5.5 0 01-.5-.5v-8.5zm.75 1.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm-.75 3a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>,
  status:   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>,
  calendar: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg>,
  level:    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /></svg>,
};

/* ── Main component ──────────────────────────────────────────────────────── */

export default function ResultCard({ result, student, method = 'qr_scan', onScanNext }) {
  const isManual = method === 'manual_entry';

  // Auto-focus the "Scan Next" button so staff can tap it instantly
  const btnRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => btnRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  /* ── VALID ──────────────────────────────────────────────────────────────── */
  if (result === 'valid' && student) {
    return (
      <div className="result-valid glass-card rounded-2xl overflow-hidden animate-slide-up w-full">
        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 tracking-wide text-sm">ID Verified</span>
          </div>
          <StatusBadge result="valid" />
        </div>

        {/* Manual entry notice — only shown when method === 'manual_entry' */}
        {isManual && <ManualEntryNotice />}

        {/* Student info */}
        <div className="p-4 sm:p-6 md:p-8 flex gap-4 sm:gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl object-cover border-2 border-emerald-500/40 bg-white dark:bg-white/10"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className={`w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-500/30 items-center justify-center text-3xl sm:text-5xl ${student.photoUrl ? 'hidden' : 'flex'}`}
              aria-hidden="true"
            >
              👤
            </div>
          </div>

          {/* Name + matric */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-1 break-words">
              {student.fullName}
            </h2>
            <p className="text-sm sm:text-base font-mono text-emerald-700 dark:text-emerald-300 font-semibold mb-3 break-all">
              {student.matricNumber}
            </p>

            <div className="space-y-2.5 md:space-y-3 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-3 md:space-y-0">
              {student.college && student.college !== '—' && (
                <InfoRow icon={icons.college}  label="College"     value={student.college} />
              )}
              <InfoRow icon={icons.dept}     label="Department"  value={student.department} />
              {student.programLevel && (
                <InfoRow icon={icons.level}  label="Level"       value={student.programLevel} />
              )}
              <InfoRow icon={icons.status}   label="Status"      value={student.status} />
              <InfoRow icon={icons.calendar} label="Valid Until" value={formatDate(student.validUntil)} />
            </div>
          </div>
        </div>

        {/* Scan Next */}
        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
          <button
            id="scan-next-btn"
            ref={btnRef}
            onClick={onScanNext}
            className="w-full btn-primary min-h-[52px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:ring-emerald-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 8.5h-2A2.25 2.25 0 012 6.25v-2zm9.5 0A2.25 2.25 0 0113.75 2h2A2.25 2.25 0 0118 4.25v2a2.25 2.25 0 01-2.25 2.25h-2a2.25 2.25 0 01-2.25-2.25v-2zm-9.5 9.5A2.25 2.25 0 014.25 11.5h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 18h-2A2.25 2.25 0 012 15.75v-2zm9.5 0A2.25 2.25 0 0113.75 11.5h2A2.25 2.25 0 0118 13.75v2A2.25 2.25 0 0115.75 18h-2a2.25 2.25 0 01-2.25-2.25v-2z" clipRule="evenodd" />
            </svg>
            Scan Next
          </button>
        </div>
      </div>
    );
  }

  /* ── NON-VALID (expired / revoked / invalid / not_found) ────────────────── */
  const cfg = {
    expired: {
      cardClass: 'result-expired',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
      ),
      title: 'ID Has Expired',
      message: 'This student ID has expired. The student must renew their registration with the registrar.',
    },
    revoked: {
      cardClass: 'result-revoked',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
        </svg>
      ),
      title: 'ID Revoked',
      message: "This student ID has been revoked. The student must contact the registrar's office for a replacement.",
    },
    invalid: {
      cardClass: 'result-invalid',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Not a Valid ID',
      message: 'This QR code is not a valid student ID. Do not grant access.',
    },
    not_found: {
      cardClass: 'result-invalid',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Not Found',
      message: 'No student record matches this matric number. Double-check the number and try again.',
    },
  }[result] ?? {
    cardClass: 'result-invalid',
    iconColor: 'text-red-600 dark:text-red-400',
    icon: null,
    title: 'Scan Failed',
    message: 'An unexpected error occurred. Please try again.',
  };

  return (
    <div className={`${cfg.cardClass} glass-card rounded-2xl overflow-hidden animate-slide-up w-full`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-slate-900/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            className={`w-6 h-6 ${result === 'expired' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`} aria-hidden="true">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
          </svg>
          <span className={`font-bold tracking-wide text-sm ${result === 'expired' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
            Access Denied
          </span>
        </div>
        <StatusBadge result={result} />
      </div>

      {/* Manual entry notice on non-valid results too */}
      {isManual && <ManualEntryNotice />}

      {/* Body */}
      <div className="flex flex-col items-center gap-4 px-4 sm:px-6 py-8 md:py-12 text-center">
        <span className={cfg.iconColor} aria-hidden="true">{cfg.icon}</span>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">{cfg.title}</h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-white/60 leading-relaxed max-w-xs md:max-w-md mx-auto">{cfg.message}</p>
        </div>
      </div>

      {/* Scan Next */}
      <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
        <button
          id="scan-next-btn"
          ref={btnRef}
          onClick={onScanNext}
          className="w-full btn-ghost min-h-[52px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 8.5h-2A2.25 2.25 0 012 6.25v-2zm9.5 0A2.25 2.25 0 0113.75 2h2A2.25 2.25 0 0118 4.25v2a2.25 2.25 0 01-2.25 2.25h-2a2.25 2.25 0 01-2.25-2.25v-2zm-9.5 9.5A2.25 2.25 0 014.25 11.5h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 18h-2A2.25 2.25 0 012 15.75v-2zm9.5 0A2.25 2.25 0 0113.75 11.5h2A2.25 2.25 0 0118 13.75v2A2.25 2.25 0 0115.75 18h-2a2.25 2.25 0 01-2.25-2.25v-2z" clipRule="evenodd" />
          </svg>
          Scan Next
        </button>
      </div>
    </div>
  );
}
