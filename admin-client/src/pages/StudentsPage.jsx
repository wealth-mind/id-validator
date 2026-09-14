/**
 * src/pages/StudentsPage.jsx
 * Student management: search, filter, add, edit, and reissue QR tokens.
 */
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import StudentTable from '../components/StudentTable';
import StudentFormModal from '../components/StudentFormModal';
import QrCodeModal from '../components/QrCodeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StudentQrLookup from '../components/StudentQrLookup';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState({ qrImage: '', student: null });

  const [reissueTarget, setReissueTarget] = useState(null);
  const [reissueLoading, setReissueLoading] = useState(false);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await axiosClient.get(`/api/students?${params.toString()}`);
      setStudents(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load students list.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const handleStudentFoundFromScan = (student) => {
    setIsScannerOpen(false);
    setScanError('');
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const handleFormSuccess = ({ student, qrImage }) => {
    setFormModalOpen(false);
    fetchStudents();
    if (qrImage) {
      setQrData({ qrImage, student });
      setQrModalOpen(true);
    }
  };

  const handleConfirmReissue = async () => {
    if (!reissueTarget) return;
    setReissueLoading(true);
    try {
      const res = await axiosClient.post(`/api/students/${reissueTarget._id}/reissue-token`);
      const { student, qrImage } = res.data.data;
      setReissueTarget(null);
      fetchStudents();
      setQrData({ qrImage, student });
      setQrModalOpen(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reissue QR token.');
      setReissueTarget(null);
    } finally {
      setReissueLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Students</h1>
          <p className="text-sm text-white/40 mt-1">Manage student records and cryptographic QR tokens</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="scan-student-btn"
            onClick={() => {
              setScanError('');
              setIsScannerOpen(true);
            }}
            className="btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-400">
              <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h4.5A1.5 1.5 0 0110.5 4.5v4.5A1.5 1.5 0 019 10.5H4.5A1.5 1.5 0 013 9V4.5zm1.5 0v4.5h4.5V4.5h-4.5zM3 15a1.5 1.5 0 011.5-1.5h4.5A1.5 1.5 0 0110.5 15v4.5A1.5 1.5 0 019 21H4.5A1.5 1.5 0 013 19.5V15zm1.5 0v4.5h4.5V15h-4.5zM13.5 4.5A1.5 1.5 0 0115 3h4.5A1.5 1.5 0 0121 4.5v4.5A1.5 1.5 0 0119.5 10.5H15A1.5 1.5 0 0113.5 9V4.5zm1.5 0v4.5h4.5V4.5h-4.5zM15 13.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5V15a1.5 1.5 0 00-1.5-1.5H15zm0 1.5h4.5v4.5H15V15z" clipRule="evenodd" />
            </svg>
            Scan to find student
          </button>
          <button id="add-student-btn" onClick={handleOpenAdd} className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Table */}
      <StudentTable
        students={students}
        total={total}
        page={page}
        totalPages={totalPages}
        loading={loading}
        search={search}
        statusFilter={statusFilter}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onStatusFilter={(s) => { setStatusFilter(s); setPage(1); }}
        onPageChange={setPage}
        onEdit={handleOpenEdit}
        onReissue={(s) => setReissueTarget(s)}
      />

      {/* Student Form Modal (Add / Edit) */}
      <StudentFormModal
        isOpen={formModalOpen}
        student={editingStudent}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* QR Lookup & Scan Modal */}
      <StudentQrLookup
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScanError('');
        }}
        onStudentFound={handleStudentFoundFromScan}
        scanError={scanError}
        setScanError={setScanError}
      />

      {/* QR Code display modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        qrImage={qrData.qrImage}
        student={qrData.student}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Reissue confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(reissueTarget)}
        title="Reissue QR Token"
        variant="warning"
        confirmLabel="Revoke & Reissue"
        loading={reissueLoading}
        onConfirm={handleConfirmReissue}
        onCancel={() => setReissueTarget(null)}
        message={
          reissueTarget ? (
            <span>
              Are you sure you want to reissue a QR code for{' '}
              <strong className="text-white">{reissueTarget.fullName}</strong> ({reissueTarget.matricNumber})?
              The existing QR code will be immediately revoked and become invalid.
            </span>
          ) : ''
        }
      />
    </div>
  );
}
