/**
 * src/components/PhotoUploadField.jsx
 *
 * Reusable photo upload field with:
 *  - Click-to-select or drag-and-drop
 *  - Instant live preview (URL.createObjectURL)
 *  - Client-side type + size validation (before any network request)
 *  - Upload to POST /api/uploads/photo via axiosClient
 *  - Spinner overlay during upload, inline error on failure
 *  - Memory-safe: revokes object URL on unmount / replacement
 *
 * Props:
 *   value       – current photoUrl string (from parent form state)
 *   onChange    – (newPhotoUrl: string | null) => void
 *   disabled    – boolean (outer form is submitting)
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES      = 5 * 1024 * 1024; // 5 MB

export default function PhotoUploadField({ value, onChange, disabled = false }) {
  const inputRef      = useRef(null);
  const previewUrlRef = useRef(null); // tracks the object URL to revoke it

  const [preview,    setPreview]    = useState(value || null); // currently shown image src
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Keep preview in sync if parent resets the value (e.g. modal close)
  useEffect(() => {
    // Only sync from parent when no local object URL is active
    if (!previewUrlRef.current) {
      setPreview(value || null);
    }
  }, [value]);

  // Revoke any object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setError('');

    // ── Client-side validation ───────────────────────────────────────
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      return;
    }

    // ── Local preview (instant) ──────────────────────────────────────
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objUrl = URL.createObjectURL(file);
    previewUrlRef.current = objUrl;
    setPreview(objUrl);

    // ── Upload ───────────────────────────────────────────────────────
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await axiosClient.post('/api/uploads/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { photoUrl } = res.data;

      // Replace object URL preview with the real hosted URL
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreview(photoUrl);
      onChange(photoUrl);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Photo upload failed. Please try again.';
      setError(msg);
      // Revert preview to previous server URL on failure
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreview(value || null);
      onChange(value || null);
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  // ── Input change ─────────────────────────────────────────────────
  const handleInputChange = (e) => processFile(e.target.files?.[0]);

  // ── Drag and drop ─────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragOver(true);  };
  const handleDragLeave = ()  => setIsDragOver(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const isInteractive = !disabled && !uploading;

  return (
    <div className="flex flex-col gap-2">
      {/* Photo box */}
      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label="Upload student photo"
        onClick={() => isInteractive && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && isInteractive && inputRef.current?.click()}
        onDragOver={isInteractive ? handleDragOver : undefined}
        onDragLeave={isInteractive ? handleDragLeave : undefined}
        onDrop={isInteractive ? handleDrop : undefined}
        className={[
          'relative w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center',
          'border-2 border-dashed transition-all duration-150 select-none',
          isDragOver
            ? 'border-brand-400 bg-brand-600/10 scale-[1.02]'
            : 'border-white/20 bg-white/5',
          isInteractive
            ? 'cursor-pointer hover:border-brand-400 hover:bg-brand-600/10'
            : 'cursor-not-allowed opacity-50',
        ].join(' ')}
      >
        {/* Photo / placeholder */}
        {preview ? (
          <img
            src={preview}
            alt="Student photo"
            className="w-full h-full object-cover"
            onError={() => setPreview(null)}
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            className="w-10 h-10 text-white/20">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
          </svg>
        )}

        {/* Upload spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <svg className="animate-spin-slow w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {/* Edit badge when photo exists and not uploading */}
        {preview && !uploading && isInteractive && (
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-center
                          bg-black/40 py-1 opacity-0 hover:opacity-100 transition-opacity text-[10px]
                          text-white/80 font-medium gap-1 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.583 1.556a.25.25 0 00.323.323l1.556-.583a2.75 2.75 0 00.892-.596l4.261-4.263a1.75 1.75 0 000-2.475zM4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0114 9v2.25A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5A2.75 2.75 0 014.75 2H7a.75.75 0 010 1.5H4.75z" />
            </svg>
            Change
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-[10px] text-white/25 leading-snug max-w-[7rem]">
        JPEG, PNG, or WEBP · max 5 MB
      </p>

      {/* Inline error */}
      {error && (
        <p className="text-xs text-red-400 max-w-[200px] leading-snug animate-fade-in" role="alert">
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="photo-upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleInputChange}
        disabled={!isInteractive}
      />
    </div>
  );
}
