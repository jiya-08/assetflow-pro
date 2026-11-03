import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { assetService } from '../../services/assetService';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QRCodeModal from '../../components/assets/QRCodeModal';
import AssetFormModal from '../../components/assets/AssetFormModal';
import { formatCurrency, formatDate, formatDateTime, getDaysRemaining } from '../../utils/formatters';
import {
  ArrowLeft,
  Boxes,
  QrCode,
  Edit2,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  User,
  ShieldAlert,
  Wrench,
  Clock,
  History,
  FileText
} from 'lucide-react';

export const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [asset, setAsset] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const res = await assetService.getAssetById(id);
      if (res.success) {
        setAsset(res.asset);
        setAssignmentHistory(res.assignmentHistory || []);
        setMaintenanceHistory(res.maintenanceHistory || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch asset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleEditSubmit = async (formData) => {
    try {
      setEditLoading(true);
      await assetService.updateAsset(asset._id, formData);
      success('Asset details updated successfully.');
      setIsEditModalOpen(false);
      fetchAsset();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update asset.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading asset profile & history..." />;
  }

  if (!asset) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Asset not found.</p>
        <Link to="/assets" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
          Return to Assets List
        </Link>
      </div>
    );
  }

  const daysUntilWarranty = getDaysRemaining(asset.warrantyExpiryDate);

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          onClick={() => navigate('/assets')}
          className="flex items-center gap-1 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </button>
        <span>/</span>
        <span className="font-mono text-slate-700">{asset.assetId}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                {asset.assetId}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {asset.category}
              </span>
              <StatusBadge status={asset.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {asset.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Brand: <span className="font-semibold text-slate-700">{asset.brand}</span> • Model: <span className="font-semibold text-slate-700">{asset.model}</span> • S/N: <span className="font-mono font-semibold text-slate-700">{asset.serialNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            Digital Tag
          </button>

          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit Asset
            </button>
          )}
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Purchase Price</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(asset.purchasePrice)}</p>
          <p className="text-xs text-slate-400 mt-1">Acquired on {formatDate(asset.purchaseDate)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Warranty Status</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-900">{formatDate(asset.warrantyExpiryDate)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {daysUntilWarranty !== null ? (
              daysUntilWarranty > 0 ? (
                <span className={daysUntilWarranty <= 90 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                  {daysUntilWarranty} days remaining
                </span>
              ) : (
                <span className="text-rose-600 font-bold">Warranty Expired</span>
              )
            ) : (
              'Not specified'
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Location</span>
            <MapPin className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-slate-900">{asset.location}</p>
          <p className="text-xs text-slate-400 mt-1">Site & Building Facility</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Department</span>
            <Building className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm font-bold text-slate-900">{asset.department}</p>
          <p className="text-xs text-slate-400 mt-1">Cost Center Allocation</p>
        </div>
      </div>

      {/* Description & Current Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Hardware Specifications & Notes
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {asset.description || 'No detailed specifications or notes recorded for this asset.'}
          </p>
        </div>

        {/* Current Assignment Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Current Deployment
          </h3>

          {asset.assignedEmployee ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {asset.assignedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{asset.assignedEmployee.name}</h4>
                  <p className="text-xs text-slate-500">{asset.assignedEmployee.designation}</p>
                  <p className="text-[11px] font-mono text-slate-400">{asset.assignedEmployee.employeeId}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/assignments')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Manage Assignment
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
              This asset is currently in inventory and available for deployment.
            </div>
          )}
        </div>
      </div>

      {/* Assignment History Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Assignment & Custody History ({assignmentHistory.length})
        </h3>

        {assignmentHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No assignment history recorded.</p>
        ) : (
          <div className="space-y-4">
            {assignmentHistory.map((h) => (
              <div key={h._id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {h.employee?.name || 'Employee'} ({h.employee?.employeeId})
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Assigned: {formatDate(h.assignmentDate)} • Expected Return: {formatDate(h.expectedReturnDate)}
                    {h.actualReturnDate && ` • Returned: ${formatDate(h.actualReturnDate)}`}
                  </p>
                  {h.notes && <p className="text-xs text-slate-600 mt-1 italic">"{h.notes}"</p>}
                  {h.returnNotes && <p className="text-xs text-slate-600 mt-0.5 italic">Return note: "{h.returnNotes}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-600" />
          Maintenance & Service Log ({maintenanceHistory.length})
        </h3>

        {maintenanceHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No maintenance activities recorded for this hardware item.</p>
        ) : (
          <div className="space-y-4">
            {maintenanceHistory.map((m) => (
              <div key={m._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.priority} />
                    <StatusBadge status={m.status} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Cost: {formatCurrency(m.maintenanceCost)}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{m.issueDescription}</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reported by {m.reportedBy?.name || 'Staff'} on {formatDate(m.createdAt)}
                  {m.assignedTechnician && ` • Service Partner: ${m.assignedTechnician}`}
                </p>
                {m.resolutionNotes && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-2 border border-emerald-100">
                    Resolution: {m.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        asset={asset}
      />

      {/* Edit Asset Modal */}
      <AssetFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        asset={asset}
        loading={editLoading}
      />
    </div>
  );
};

export default AssetDetail;
