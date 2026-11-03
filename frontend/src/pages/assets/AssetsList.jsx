import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { assetService } from '../../services/assetService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AssetFormModal from '../../components/assets/AssetFormModal';
import QRCodeModal from '../../components/assets/QRCodeModal';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Boxes,
  Plus,
  Download,
  QrCode,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Filter,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = ['All', 'Laptop', 'Desktop', 'Monitor', 'Mobile', 'Printer', 'Networking Equipment', 'Furniture', 'Other'];
const STATUSES = ['All', 'Available', 'Assigned', 'Under Maintenance', 'Retired'];

export const AssetsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssetForDelete, setSelectedAssetForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assetService.getAssets({
        search,
        category,
        status,
        sortBy,
        order,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setAssets(res.assets);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch assets.');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sortBy, order, currentPage, showError]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Handle Create / Edit Asset submit
  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      if (selectedAssetForEdit) {
        await assetService.updateAsset(selectedAssetForEdit._id, formData);
        success(`Asset '${formData.assetId}' updated successfully.`);
      } else {
        await assetService.createAsset(formData);
        success(`Asset '${formData.assetId}' registered successfully.`);
      }
      setIsFormModalOpen(false);
      setSelectedAssetForEdit(null);
      fetchAssets();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save asset.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Asset
  const handleDeleteConfirm = async () => {
    if (!selectedAssetForDelete) return;
    try {
      setDeleteLoading(true);
      await assetService.deleteAsset(selectedAssetForDelete._id);
      success(`Asset '${selectedAssetForDelete.assetId}' deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedAssetForDelete(null);
      fetchAssets();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete asset.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const columns = [
      { key: 'assetId', label: 'Asset ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'status', label: 'Status' },
      { key: 'assignedEmployee.name', label: 'Assigned Employee' },
      { key: 'location', label: 'Location' },
      { key: 'department', label: 'Department' },
      { key: 'purchasePrice', label: 'Purchase Price ($)' },
      { key: 'purchaseDate', label: 'Purchase Date' },
      { key: 'warrantyExpiryDate', label: 'Warranty Expiry' }
    ];
    exportToCSV(assets, `AssetFlow-Assets-Inventory-${new Date().toISOString().split('T')[0]}.csv`, columns);
  };

  // Check for warranty alert assets
  const expiringAssets = assets.filter((a) => {
    const days = getDaysRemaining(a.warrantyExpiryDate);
    return days !== null && days >= 0 && days <= 90;
  });

  const columns = [
    {
      header: 'Asset ID & Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              {row.assetId}
            </span>
            <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
              {row.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {row.brand} {row.model} • S/N: <span className="font-mono text-[11px]">{row.serialNumber}</span>
          </p>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {row.category}
        </span>
      )
    },
    {
      header: 'Location / Dept',
      accessor: 'location',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{row.location}</p>
          <p className="text-slate-400">{row.department}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.assignedEmployee && (
            <p className="text-[11px] text-slate-500 mt-1">
              Assigned to: <span className="font-semibold text-slate-700">{row.assignedEmployee.name}</span>
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Valuation & Warranty',
      accessor: 'purchasePrice',
      render: (row) => {
        const days = getDaysRemaining(row.warrantyExpiryDate);
        const isExpiringSoon = days !== null && days >= 0 && days <= 90;
        const isExpired = days !== null && days < 0;

        return (
          <div className="text-xs">
            <p className="font-bold text-slate-900">{formatCurrency(row.purchasePrice)}</p>
            {row.warrantyExpiryDate && (
              <p
                className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
                  isExpired
                    ? 'text-rose-600'
                    : isExpiringSoon
                    ? 'text-amber-600 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {isExpiringSoon && <AlertTriangle className="w-3 h-3 text-amber-500 inline" />}
                Exp: {formatDate(row.warrantyExpiryDate)}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSelectedAssetForQR(row);
              setIsQRModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Generate & View QR Code Tag"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/assets/${row._id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Complete Asset Profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAssetForEdit(row);
                setIsFormModalOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Edit Asset Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              disabled={row.status === 'Assigned'}
              onClick={() => {
                setSelectedAssetForDelete(row);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={row.status === 'Assigned' ? 'Cannot delete an assigned asset' : 'Delete Asset'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-blue-600" />
            Hardware & Assets Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete lifecycle registry: physical assets, serial tags, warranty management, and allocation states.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAssetForEdit(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Warranty Expiry Notice Banner */}
      {expiringAssets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Warranty Renewal Alert: {expiringAssets.length} asset(s) expiring within 90 days
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Review support contracts and AppleCare/Dell ProSupport maintenance renewals.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSortBy('warrantyExpiryDate')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline whitespace-nowrap"
          >
            Sort by Expiry
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          onClear={() => setSearch('')}
          placeholder="Search by asset name, asset ID, brand, model, or serial number..."
          className="w-full md:flex-1"
        />

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap ml-2">
            <span>Status:</span>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Data Table */}
      <DataTable
        columns={columns}
        data={assets}
        loading={loading}
        emptyMessage="No assets match your search criteria"
        emptySubtext="Try adjusting your category or status filters, or register a new hardware asset."
        onRowClick={(row) => navigate(`/assets/${row._id}`)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={10}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Asset Form Modal (Add / Edit) */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedAssetForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        asset={selectedAssetForEdit}
        loading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAssetForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete Asset: ${selectedAssetForDelete?.assetId}`}
        message={`Are you sure you want to permanently delete '${selectedAssetForDelete?.name}'? This will erase all audit relationships and cannot be undone.`}
        confirmText="Confirm Delete"
        loading={deleteLoading}
      />

      {/* QR Code Tag Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedAssetForQR(null);
        }}
        asset={selectedAssetForQR}
      />
    </div>
  );
};

export default AssetsList;
