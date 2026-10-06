/**
 * src/components/QrCodeModal.jsx
 * Displays the qrImage (base64 PNG data URL) returned by create/reissue.
 * Provides Download and Print buttons.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   qrImage  – base64 PNG data URL string
 *   student  – { fullName, matricNumber }
 */
import { useEffect } from 'react';

export default function QrCodeModal({ isOpen, onClose, qrImage, student }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !qrImage) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `qr-${student?.matricNumber ?? 'student'}.png`;
    a.click();
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=500');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${student?.matricNumber ?? ''}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center;
                   justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif;
                   background: #fff; color: #111; }
            img  { width: 260px; height: 260px; }
            h2   { margin: 12px 0 4px; font-size: 18px; }
            p    { margin: 0; font-size: 14px; color: #555; }
          </style>
        </head>
        <body>
          <img src="${qrImage}" alt="QR Code" />
          <h2>${student?.fullName ?? ''}</h2>
          <p>${student?.matricNumber ?? ''}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="QR Code">
      <div className="modal-box max-w-full sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Student QR Code</h2>
          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 flex flex-col items-center gap-4">
          {/* QR image */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 dark:border-white/30 shadow-sm max-w-full">
            <img src={qrImage} alt="Student QR Code" className="w-52 h-52 max-w-full aspect-square object-contain" />
          </div>

          {/* Student info */}
          {student && (
            <div className="text-center min-w-0 max-w-full">
              <p className="text-base font-bold text-slate-900 dark:text-white break-words">{student.fullName}</p>
              <p className="text-sm font-mono text-brand-700 dark:text-brand-300">{student.matricNumber}</p>
            </div>
          )}

          {/* Warning */}
          <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            ⚠️ Save or print this QR code now. It will not be shown again without reissuing a new token.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-6 pb-5">
          <button id="qr-download-btn" onClick={handleDownload} className="btn-primary flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 10-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Download PNG
          </button>
          <button id="qr-print-btn" onClick={handlePrint} className="btn-ghost flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zM6.5 2.75v3.324c1.162-.083 2.337-.124 3.5-.124s2.338.041 3.5.124V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM5.115 13.5c.081-.52.164-1.04.249-1.558.064-.399.413-.692.818-.692h7.636c.405 0 .754.293.818.692.085.518.168 1.038.249 1.558H5.115z" clipRule="evenodd" />
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
