import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { bookingService } from '../../services/bookingService';
import { assetService } from '../../services/assetService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { formatDateTime } from '../../utils/formatters';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Ban,
  Loader2,
  Filter
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

export const BookingsList = () => {
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [bookFormData, setBookFormData] = useState({
    assetId: '',
    startDate: '',
    endDate: '',
    purpose: ''
  });
  const [bookLoading, setBookLoading] = useState(false);

  // Review (Approve/Reject) Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings({
        status: statusFilter,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setBookings(res.bookings);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage, showError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenBookModal = async () => {
    try {
      setBookLoading(true);
      // Fetch assets that are not retired
      const res = await assetService.getAssets({ limit: 100 });
      const validAssets = (res.assets || []).filter(
        (a) => a.status !== 'Retired' && a.status !== 'Under Maintenance'
      );
      setBookableAssets(validAssets);

      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      const formatDatetimeLocal = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setBookFormData({
        assetId: validAssets[0]?._id || '',
        startDate: formatDatetimeLocal(inOneHour),
        endDate: formatDatetimeLocal(inThreeHours),
        purpose: ''
      });

      setIsBookModalOpen(true);
    } catch (err) {
      showError('Failed to load bookable resources.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookFormData.assetId || !bookFormData.startDate || !bookFormData.endDate || !bookFormData.purpose) {
      showError('Please complete all reservation fields.');
      return;
    }

    try {
      setBookLoading(true);
      const res = await bookingService.createBooking(bookFormData);
      success(res.message || 'Booking request submitted.');
      setIsBookModalOpen(false);
      fetchBookings();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reserve resource.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    try {
      setReviewLoading(true);
      const res = await bookingService.updateStatus(selectedBookingForReview._id, {
        status: reviewStatus,
        reviewNotes
      });
      success(res.message || `Booking ${reviewStatus.toLowerCase()} successfully.`);
      setIsReviewModalOpen(false);
      setSelectedBookingForReview(null);
      setReviewNotes('');
      fetchBookings();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingService.cancelBooking(bookingId);
      success('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const columns = [
    {
      header: 'Reserved Resource',
      accessor: 'asset',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              {row.asset?.assetId || 'N/A'}
            </span>
            <span className="font-bold text-slate-900">{row.asset?.name || 'Asset'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {row.asset?.category} • Location: {row.asset?.location}
          </p>
        </div>
      )
    },
    {
      header: 'Reservation Period',
      accessor: 'startDate',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">From: {formatDateTime(row.startDate)}</p>
          <p className="text-slate-500">To: {formatDateTime(row.endDate)}</p>
        </div>
      )
    },
    {
      header: 'Requested By & Purpose',
      accessor: 'purpose',
      render: (row) => (
        <div className="text-xs max-w-xs">
          <p className="font-bold text-slate-900">{row.requestedBy?.name || 'Staff'}</p>
          <p className="text-slate-600 italic line-clamp-2 mt-0.5">"{row.purpose}"</p>
        </div>
      )
    },
    {
      header: 'Status & Review',
      accessor: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.reviewNotes && (
            <p className="text-[11px] text-slate-500 mt-1 italic">
              Note: {row.reviewNotes}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const isManagerOrAdmin = ['ADMIN', 'MANAGER'].includes(user?.role);
        const isOwner = row.requestedBy?._id === user?.id || row.requestedBy?._id === user?._id;

        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {row.status === 'Pending' && isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBookingForReview(row);
                  setReviewStatus('Approved');
                  setIsReviewModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Review
              </button>
            )}

            {row.status !== 'Cancelled' && (isOwner || user?.role === 'ADMIN') && (
              <button
                type="button"
                onClick={() => handleCancelBooking(row._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Cancel Booking"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-blue-600" />
            Resource Reservations & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reserve testing handsets, conference cameras, laser projectors, and shared engineering devices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenBookModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Reserve Resource
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        emptyMessage="No reservations found"
        emptySubtext="Book a conference room projector or test hardware unit to get started."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={10}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Reserve Resource Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Reserve Company Resource"
        subtitle="Schedule a shared hardware asset or meeting room facility"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <FormInput
            label="Resource to Reserve"
            name="assetId"
            type="select"
            value={bookFormData.assetId}
            onChange={(e) => setBookFormData({ ...bookFormData, assetId: e.target.value })}
            options={
              bookableAssets.length > 0
                ? bookableAssets.map((a) => ({
                    value: a._id,
                    label: `${a.assetId} - ${a.name} (${a.location})`
                  }))
                : [{ value: '', label: 'No Bookable Assets Available' }]
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Start Date & Time"
              name="startDate"
              type="datetime-local"
              value={bookFormData.startDate}
              onChange={(e) => setBookFormData({ ...bookFormData, startDate: e.target.value })}
              required
            />
            <FormInput
              label="End Date & Time"
              name="endDate"
              type="datetime-local"
              value={bookFormData.endDate}
              onChange={(e) => setBookFormData({ ...bookFormData, endDate: e.target.value })}
              required
            />
          </div>

          <FormInput
            label="Purpose of Reservation"
            name="purpose"
            type="textarea"
            rows={3}
            value={bookFormData.purpose}
            onChange={(e) => setBookFormData({ ...bookFormData, purpose: e.target.value })}
            placeholder="e.g. Q4 Executive AGM presentation, QA regression testing on iOS 18..."
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={bookLoading}
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookLoading || bookableAssets.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {bookLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Reservation Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal (Approve / Reject) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Resource Reservation"
        subtitle={`Approve or reject booking for ${selectedBookingForReview?.asset?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <p>
              <span className="font-bold text-slate-700">Requested by:</span>{' '}
              {selectedBookingForReview?.requestedBy?.name} ({selectedBookingForReview?.requestedBy?.department})
            </p>
            <p>
              <span className="font-bold text-slate-700">Window:</span>{' '}
              {formatDateTime(selectedBookingForReview?.startDate)} to{' '}
              {formatDateTime(selectedBookingForReview?.endDate)}
            </p>
            <p>
              <span className="font-bold text-slate-700">Purpose:</span>{' '}
              {selectedBookingForReview?.purpose}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReviewStatus('Approved')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                reviewStatus === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Approve Request
            </button>
            <button
              type="button"
              onClick={() => setReviewStatus('Rejected')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                reviewStatus === 'Rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Reject Request
            </button>
          </div>

          <FormInput
            label="Reviewer Comments"
            name="reviewNotes"
            type="textarea"
            rows={2}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Room access confirmed, setup technician notified..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={reviewLoading}
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewLoading}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                reviewStatus === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              {reviewLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit {reviewStatus}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BookingsList;
