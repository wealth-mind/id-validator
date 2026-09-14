/**
 * src/components/StudentFormModal.jsx
 * Create or edit a student record, with photo upload support.
 *
 * Photo upload flow:
 *  1. Admin selects / drops a file — PhotoUploadField shows a preview and
 *     immediately uploads to POST /api/uploads/photo.
 *  2. On successful upload, PhotoUploadField calls onChange(photoUrl) — the
 *     modal stores the hosted URL in form state.
 *  3. On form submit, the hosted photoUrl is included in the POST/PATCH payload.
 *     No re-upload on edit if no new photo was selected.
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onSuccess – ({ student, qrImage? }) => void
 *   student   – existing student (edit mode) | null (create mode)
 */
import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import PhotoUploadField from './PhotoUploadField';

const STATUSES = ['active', 'inactive', 'suspended', 'graduated'];
const LEVELS   = ['undergraduate', 'postgraduate', 'diploma', 'phd'];

const EMPTY = {
  matricNumber: '', fullName: '', college: '', department: '',
  programLevel: 'undergraduate', status: 'active',
  validUntil: '', photoUrl: '',
};

function toDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

export default function StudentFormModal({ isOpen, onClose, onSuccess, student }) {
  const isEdit = Boolean(student);

  const [form,        setForm]        = useState(EMPTY);
  const [photoUrl,    setPhotoUrl]    = useState('');   // confirmed uploaded URL
  const [isUploading, setIsUploading] = useState(false); // photo upload in flight
  const [loading,     setLoading]     = useState(false); // form submit in flight
  const [error,       setError]       = useState('');

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      const s = student;
      setForm(s
        ? {
            matricNumber:     s.matricNumber    ?? '',
            fullName:         s.fullName        ?? '',
            college:          s.college         ?? '',
            department:       s.department      ?? '',
            programLevel:     s.programLevel    ?? 'undergraduate',
            status:           s.status          ?? 'active',
            validUntil:       toDateInput(s.validUntil),
            photoUrl:         s.photoUrl        ?? '',
          }
        : EMPTY
      );
      setPhotoUrl(s?.photoUrl ?? '');
    }
  }, [isOpen, student]);

  // Close on Escape (only when neither submit nor photo-upload is in flight)
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape' && !loading && !isUploading) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, loading, isUploading, onClose]);

  if (!isOpen) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Called by PhotoUploadField when upload finishes (success or cancelled)
  const handlePhotoChange = (url) => setPhotoUrl(url ?? '');

  // We wrap PhotoUploadField's upload state so the submit button
  // stays disabled while an upload is in progress.
  // PhotoUploadField manages its own upload internally; we track it via
  // a wrapper that detects when value is temporarily an object URL.
  // Simpler: disable submit when photoUrl starts with "blob:" (still local).
  const submitBlocked = loading || isUploading || photoUrl.startsWith('blob:');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.fullName || !form.matricNumber || !form.college || !form.department || !form.programLevel || !form.validUntil) {
      setError('Please fill in all required fields.');
      return;
    }

    if (photoUrl.startsWith('blob:')) {
      setError('Please wait for the photo upload to finish before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName:         form.fullName.trim(),
        matricNumber:     form.matricNumber.trim().toUpperCase(),
        college:          form.college.trim(),
        department:       form.department.trim(),
        programLevel:     form.programLevel,
        status:           form.status,
        validUntil:       form.validUntil,
        ...(photoUrl ? { photoUrl } : {}),
      };

      let res;
      if (isEdit) {
        const { matricNumber: _m, ...editPayload } = payload;
        res = await axiosClient.patch(`/api/students/${student._id}`, editPayload);
        onSuccess({ student: res.data.data });
      } else {
        res = await axiosClient.post('/api/students', payload);
        const { student: s, qrImage } = res.data.data;
        onSuccess({ student: s, qrImage });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={loading || isUploading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="modal-box max-w-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="student-form-title" className="text-base font-bold text-white">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading || isUploading}
            aria-label="Close"
            className="text-white/30 hover:text-white transition-colors disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form id="student-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {error && (
            <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25
                     text-red-300 text-sm px-4 py-3 animate-fade-in leading-relaxed">
              {error}
            </div>
          )}

          {/* Photo + core fields row */}
          <div className="flex gap-5 items-start">
            {/* Photo upload */}
            <div className="flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                Photo
              </p>
              <PhotoUploadField
                value={photoUrl}
                onChange={handlePhotoChange}
                disabled={loading}
              />
            </div>

            {/* Matric + Full Name stacked */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                  Matric Number <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-matric"
                  type="text"
                  value={form.matricNumber}
                  onChange={set('matricNumber')}
                  disabled={isEdit || loading}
                  placeholder="e.g. CSC/2021/001"
                  className="input-field font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={set('fullName')}
                  disabled={loading}
                  placeholder="John Doe"
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* College / Department / Program Level / Status / Valid Until */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                College <span className="text-red-400">*</span>
              </label>
              <input
                id="field-college"
                type="text"
                value={form.college}
                onChange={set('college')}
                disabled={loading}
                placeholder="Computing"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Department <span className="text-red-400">*</span>
              </label>
              <input
                id="field-dept"
                type="text"
                value={form.department}
                onChange={set('department')}
                disabled={loading}
                placeholder="Computer Science"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Program Level <span className="text-red-400">*</span>
              </label>
              <select
                id="field-level"
                value={form.programLevel}
                onChange={set('programLevel')}
                disabled={loading}
                className="select-field"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Status
              </label>
              <select
                id="field-status"
                value={form.status}
                onChange={set('status')}
                disabled={loading}
                className="select-field"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Valid Until <span className="text-red-400">*</span>
              </label>
              <input
                id="field-validuntil"
                type="date"
                value={form.validUntil}
                onChange={set('validUntil')}
                disabled={loading}
                className="input-field"
                required
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} disabled={loading || isUploading} className="btn-ghost">
            Cancel
          </button>
          <button
            id="student-form-submit"
            type="submit"
            form="student-form"
            disabled={submitBlocked}
            className="btn-primary"
          >
            {loading ? (
              <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : isEdit ? 'Save Changes' : 'Create & Generate QR'}
          </button>
        </div>
      </div>
    </div>
  );
}
