import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../../services/auditService';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { formatDateTime } from '../../utils/formatters';
import {
  ShieldCheck,
  User,
  Filter,
  Eye,
  FileCode,
  Globe,
  Clock,
  Shield
} from 'lucide-react';

const MODULES = ['All', 'AUTH', 'ASSETS', 'EMPLOYEES', 'ASSIGNMENTS', 'BOOKINGS', 'MAINTENANCE', 'SETTINGS', 'SYSTEM'];

export const AuditLogsList = () => {
  const { error: showError } = useNotification();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModule, setSelectedModule] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // JSON Details Modal
  const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditService.getLogs({
        module: selectedModule,
        search,
        page: currentPage,
        limit: 15
      });
      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch audit log stream.');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, search, currentPage, showError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('DELETED') || action.includes('REJECTED')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('ASSIGNED') || action.includes('LOGIN')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <div className="text-xs font-mono text-slate-600 whitespace-nowrap">
          {formatDateTime(row.timestamp)}
        </div>
      )
    },
    {
      header: 'User Identity',
      accessor: 'userName',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {row.userName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{row.userName}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{row.userRole}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Module & Action',
      accessor: 'action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {row.module}
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getActionColor(row.action)}`}>
            {row.action}
          </span>
        </div>
      )
    },
    {
      header: 'Target Record',
      accessor: 'targetName',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 line-clamp-1">
          {row.targetName || 'System Service'}
        </span>
      )
    },
    {
      header: 'Details & Context',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedLogForDetails(row);
            setIsDetailsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          Inspect Payload
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-blue-600" />
          Enterprise Compliance Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable server-side audit logs. Every asset allocation, state modification, and security event is permanently timestamped.
        </p>
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
          placeholder="Filter logs by user, email, action or target..."
          className="w-full md:flex-1"
        />

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Module:</span>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
        emptySubtext="Actions performed across the platform will automatically appear here."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={15}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* JSON Payload Inspection Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Audit Trail Context Payload"
        subtitle={`Action: ${selectedLogForDetails?.action} • Module: ${selectedLogForDetails?.module}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Actor</span>
              <span className="font-semibold text-slate-800">{selectedLogForDetails?.userName}</span>
              <span className="text-slate-500 block text-[11px]">{selectedLogForDetails?.userEmail}</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Target</span>
              <span className="font-semibold text-slate-800">{selectedLogForDetails?.targetName || 'N/A'}</span>
              <span className="text-slate-500 block text-[11px] font-mono">{selectedLogForDetails?.targetId}</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">IP Address</span>
              <span className="font-mono text-slate-700 text-[11px]">{selectedLogForDetails?.ipAddress || '127.0.0.1'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Recorded Time</span>
              <span className="font-mono text-slate-700 text-[11px]">
                {formatDateTime(selectedLogForDetails?.timestamp)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 mb-1.5 block">Audit Metadata (JSON)</span>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
              {JSON.stringify(selectedLogForDetails?.details, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogsList;
