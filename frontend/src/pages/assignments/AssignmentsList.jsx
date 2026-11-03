import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { assignmentService } from '../../services/assignmentService';
import { assetService } from '../../services/assetService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { formatDate } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  ClipboardList,
  Plus,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  Boxes,
  Loader2,
  Filter
} from 'lucide-react';

export const AssignmentsList = () => {
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [assignments, setAssignments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [assignFormData, setAssignFormData] = useState({
    assetId: '',
    employeeId: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);

  // Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAssignmentForReturn, setSelectedAssignmentForReturn] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getAssignments({
        status: statusFilter,
        search,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setAssignments(res.assignments);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, currentPage, showError]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleOpenAssignModal = async () => {
    try {
      setAssignLoading(true);
      const [assetsRes, employeesRes] = await Promise.all([
        assetService.getAssets({ status: 'Available', limit: 100 }),
        employeeService.getEmployees({ status: 'Active', limit: 100 })
      ]);

      setAvailableAssets(assetsRes.assets || []);
      setActiveEmployees(employeesRes.employees || []);

      setAssignFormData({
        assetId: assetsRes.assets?.[0]?._id || '',
        employeeId: employeesRes.employees?.[0]?._id || '',
        assignmentDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: '',
        notes: ''
      });

      setIsAssignModalOpen(true);
    } catch (err) {
      showError('Failed to load available assets and employees.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignFormData.assetId || !assignFormData.employeeId) {
      showError('Please select both an available asset and an employee.');
      return;
    }

    try {
      setAssignLoading(true);
      const res = await assignmentService.createAssignment(assignFormData);
      success(res.message || 'Asset assigned successfully.');
      setIsAssignModalOpen(false);
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to complete assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentForReturn) return;

    try {
      setReturnLoading(true);
      const res = await assignmentService.returnAssignment(selectedAssignmentForReturn._id, {
        returnDate: new Date(),
        returnNotes
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      success(res.message || 'Asset returned successfully.');
      setIsReturnModalOpen(false);
      setSelectedAssignmentForReturn(null);
      setReturnNotes('');
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to process return.');
    } finally {
      setReturnLoading(false);
    }
  };

  const columns = [
    {
      header: 'Hardware Asset',
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
            {row.asset?.brand} {row.asset?.model} • {row.asset?.category}
          </p>
        </div>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'employee',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {row.employee?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <p className="font-bold text-xs text-slate-900">{row.employee?.name || 'Employee'}</p>
            <p className="text-[11px] text-slate-500">{row.employee?.department} ({row.employee?.employeeId})</p>
          </div>
        </div>
      )
    },
    {
      header: 'Assignment Timeline',
      accessor: 'assignmentDate',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">Assigned: {formatDate(row.assignmentDate)}</p>
          <p className="text-slate-500">
            {row.status === 'Active'
              ? `Due: ${formatDate(row.expectedReturnDate)}`
              : `Returned: ${formatDate(row.actualReturnDate)}`}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'Active' && ['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAssignmentForReturn(row);
                setIsReturnModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              Check In
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Asset Assignment & Allocation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch company hardware to staff, manage check-in returns, and track active custody history.
          </p>
        </div>

        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <button
            type="button"
            onClick={handleOpenAssignModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            Allocate Asset
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          onClear={() => setSearch('')}
          placeholder="Search by asset name, ID, or employee name..."
          className="w-full md:flex-1"
        />

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Allocations</option>
            <option value="Active">Active Custody Only</option>
            <option value="Returned">Returned / Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={assignments}
        loading={loading}
        emptyMessage="No assignment records found"
        emptySubtext="Allocate an available asset to start tracking hardware custody."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={10}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Allocate Asset Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Allocate Asset to Employee"
        subtitle="Only Available assets can be allocated to Active personnel"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <FormInput
            label="Select Available Asset"
            name="assetId"
            type="select"
            value={assignFormData.assetId}
            onChange={(e) => setAssignFormData({ ...assignFormData, assetId: e.target.value })}
            options={
              availableAssets.length > 0
                ? availableAssets.map((a) => ({
                    value: a._id,
                    label: `${a.assetId} - ${a.name} (${a.category})`
                  }))
                : [{ value: '', label: 'No Available Assets Found' }]
            }
            required
          />

          <FormInput
            label="Select Employee"
            name="employeeId"
            type="select"
            value={assignFormData.employeeId}
            onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
            options={
              activeEmployees.length > 0
                ? activeEmployees.map((e) => ({
                    value: e._id,
                    label: `${e.employeeId} - ${e.name} (${e.department})`
                  }))
                : [{ value: '', label: 'No Active Employees Found' }]
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Assignment Date"
              name="assignmentDate"
              type="date"
              value={assignFormData.assignmentDate}
              onChange={(e) => setAssignFormData({ ...assignFormData, assignmentDate: e.target.value })}
              required
            />
            <FormInput
              label="Expected Return Date"
              name="expectedReturnDate"
              type="date"
              value={assignFormData.expectedReturnDate}
              onChange={(e) => setAssignFormData({ ...assignFormData, expectedReturnDate: e.target.value })}
            />
          </div>

          <FormInput
            label="Allocation Notes"
            name="notes"
            type="textarea"
            rows={3}
            value={assignFormData.notes}
            onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
            placeholder="Standard workstation setup, project allocation, accessory checklist..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={assignLoading}
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading || availableAssets.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {assignLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Asset Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Check In Hardware Return"
        subtitle={`Return ${selectedAssignmentForReturn?.asset?.name} (${selectedAssignmentForReturn?.asset?.assetId})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Returning this asset transitions its inventory status to{' '}
            <span className="font-semibold text-emerald-600">Available</span> and makes it available for immediate re-allocation.
          </p>

          <FormInput
            label="Condition & Return Notes"
            name="returnNotes"
            type="textarea"
            rows={3}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="Condition check passed, cables returned, factory reset completed..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={returnLoading}
              onClick={() => setIsReturnModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={returnLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              {returnLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Check-in
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignmentsList;
