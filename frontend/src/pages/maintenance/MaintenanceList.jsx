import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  User,
  Loader2,
  Filter,
  FileText
} from 'lucide-react';

const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['All', 'Pending', 'In Progress', 'Completed', 'Rejected'];

export const MaintenanceList = () => {
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Submit Request Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [submitFormData, setSubmitFormData] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'Medium',
    scheduledDate: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Update Service Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRecordForUpdate, setSelectedRecordForUpdate] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    status: 'In Progress',
    assignedTechnician: '',
    maintenanceCost: '',
    scheduledDate: '',
    completedDate: '',
    resolutionNotes: '',
    priority: 'Medium'
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getRecords({
        status: statusFilter,
        priority: priorityFilter,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setRecords(res.records);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load maintenance records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, currentPage, showError]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenSubmitModal = async () => {
    try {
      setSubmitLoading(true);
      const res = await assetService.getAssets({ limit: 100 });
      setAvailableAssets(res.assets || []);

      setSubmitFormData({
        assetId: res.assets?.[0]?._id || '',
        issueDescription: '',
        priority: 'Medium',
        scheduledDate: ''
      });

      setIsSubmitModalOpen(true);
    } catch (err) {
      showError('Failed to load asset list.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!submitFormData.assetId || !submitFormData.issueDescription.trim()) {
      showError('Please select an asset and describe the issue.');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await maintenanceService.createRecord(submitFormData);
      success(res.message || 'Maintenance request logged successfully.');
      setIsSubmitModalOpen(false);
      fetchRecords();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit maintenance request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenUpdateModal = (record) => {
    setSelectedRecordForUpdate(record);
    setUpdateFormData({
      status: record.status || 'In Progress',
      assignedTechnician: record.assignedTechnician || '',
      maintenanceCost: record.maintenanceCost !== undefined ? record.maintenanceCost : '',
      scheduledDate: record.scheduledDate ? new Date(record.scheduledDate).toISOString().split('T')[0] : '',
      completedDate: record.completedDate ? new Date(record.completedDate).toISOString().split('T')[0] : '',
      resolutionNotes: record.resolutionNotes || '',
      priority: record.priority || 'Medium'
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecordForUpdate) return;

    try {
      setUpdateLoading(true);
      const res = await maintenanceService.updateRecord(selectedRecordForUpdate._id, {
        ...updateFormData,
        maintenanceCost: updateFormData.maintenanceCost ? Number(updateFormData.maintenanceCost) : 0
      });
      success(res.message || 'Maintenance record updated.');
      setIsUpdateModalOpen(false);
      fetchRecords();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update maintenance record.');
    } finally {
      setUpdateLoading(false);
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
            {row.asset?.brand} • {row.asset?.location}
          </p>
        </div>
      )
    },
    {
      header: 'Issue Description',
      accessor: 'issueDescription',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-xs font-medium text-slate-800 line-clamp-2">{row.issueDescription}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Reported by {row.reportedBy?.name || 'Staff'} on {formatDate(row.createdAt)}
          </p>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <StatusBadge status={row.priority} />
    },
    {
      header: 'Service Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Technician & Cost',
      accessor: 'maintenanceCost',
      render: (row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">{formatCurrency(row.maintenanceCost)}</p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {row.assignedTechnician || 'Unassigned vendor'}
          </p>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const canManage = ['ADMIN', 'MANAGER'].includes(user?.role);
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenUpdateModal(row)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Service
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-7 h-7 text-blue-600" />
            Maintenance & Service Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track equipment repairs, assign certified vendor technicians, log costs, and manage hardware state transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenSubmitModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Report Hardware Issue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No maintenance tickets found"
        emptySubtext="Report a damaged laptop keyboard, printer jam, or monitor flicker to initiate servicing."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={10}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Submit Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Hardware Maintenance Request"
        subtitle="Report broken equipment or schedule preventive servicing"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <FormInput
            label="Hardware Asset"
            name="assetId"
            type="select"
            value={submitFormData.assetId}
            onChange={(e) => setSubmitFormData({ ...submitFormData, assetId: e.target.value })}
            options={
              availableAssets.length > 0
                ? availableAssets.map((a) => ({
                    value: a._id,
                    label: `${a.assetId} - ${a.name} (${a.brand})`
                  }))
                : [{ value: '', label: 'No assets available' }]
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Urgency / Priority"
              name="priority"
              type="select"
              value={submitFormData.priority}
              onChange={(e) => setSubmitFormData({ ...submitFormData, priority: e.target.value })}
              options={['Low', 'Medium', 'High', 'Critical']}
              required
            />
            <FormInput
              label="Preferred Service Date"
              name="scheduledDate"
              type="date"
              value={submitFormData.scheduledDate}
              onChange={(e) => setSubmitFormData({ ...submitFormData, scheduledDate: e.target.value })}
            />
          </div>

          <FormInput
            label="Detailed Problem Description"
            name="issueDescription"
            type="textarea"
            rows={3}
            value={submitFormData.issueDescription}
            onChange={(e) => setSubmitFormData({ ...submitFormData, issueDescription: e.target.value })}
            placeholder="Describe hardware malfunction, error codes displayed, or physical damage..."
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={submitLoading}
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Maintenance Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Maintenance Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Service Ticket"
        subtitle={`Servicing ticket for ${selectedRecordForUpdate?.asset?.name} (${selectedRecordForUpdate?.asset?.assetId})`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateRecordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Service Status"
              name="status"
              type="select"
              value={updateFormData.status}
              onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
              options={['Pending', 'In Progress', 'Completed', 'Rejected']}
              helperText="Marking 'In Progress' changes asset to Under Maintenance; 'Completed' restores it to Available."
            />
            <FormInput
              label="Priority Level"
              name="priority"
              type="select"
              value={updateFormData.priority}
              onChange={(e) => setUpdateFormData({ ...updateFormData, priority: e.target.value })}
              options={['Low', 'Medium', 'High', 'Critical']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Assigned Technician / Vendor"
              name="assignedTechnician"
              value={updateFormData.assignedTechnician}
              onChange={(e) => setUpdateFormData({ ...updateFormData, assignedTechnician: e.target.value })}
              placeholder="e.g. AppleCare Certified Support"
            />
            <FormInput
              label="Repair Cost ($)"
              name="maintenanceCost"
              type="number"
              value={updateFormData.maintenanceCost}
              onChange={(e) => setUpdateFormData({ ...updateFormData, maintenanceCost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <FormInput
            label="Resolution & Inspection Notes"
            name="resolutionNotes"
            type="textarea"
            rows={3}
            value={updateFormData.resolutionNotes}
            onChange={(e) => setUpdateFormData({ ...updateFormData, resolutionNotes: e.target.value })}
            placeholder="Parts replaced, firmware updated, test diagnostics passed..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={updateLoading}
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              {updateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Service Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceList;
