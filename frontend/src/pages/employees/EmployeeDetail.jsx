import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { assignmentService } from '../../services/assignmentService';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  Boxes,
  RotateCcw,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  const [employee, setEmployee] = useState(null);
  const [currentAssets, setCurrentAssets] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAssignmentForReturn, setSelectedAssignmentForReturn] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployeeById(id);
      if (res.success) {
        setEmployee(res.employee);
        setCurrentAssets(res.currentAssets || []);
        setAssignmentHistory(res.assignmentHistory || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentForReturn) return;

    try {
      setReturnLoading(true);
      await assignmentService.returnAssignment(selectedAssignmentForReturn._id, {
        returnDate: new Date(),
        returnNotes
      });
      success('Asset returned and marked as Available.');
      setIsReturnModalOpen(false);
      setSelectedAssignmentForReturn(null);
      setReturnNotes('');
      fetchEmployeeData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to process return.');
    } finally {
      setReturnLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading employee custody profile..." />;
  }

  if (!employee) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Employee not found.</p>
        <Link to="/employees" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-1 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
        </button>
        <span>/</span>
        <span className="font-mono text-slate-700">{employee.employeeId}</span>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                {employee.employeeId}
              </span>
              <StatusBadge status={employee.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {employee.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              {employee.designation} • {employee.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{employee.phone}</span>
          </div>
        </div>
      </div>

      {/* Currently Assigned Assets Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              Active Hardware Deployments ({currentAssets.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Physical items currently in employee custody</p>
          </div>
        </div>

        {currentAssets.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
            No active hardware assets currently deployed to this employee.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentAssets.map((asset) => {
              const activeAssignment = assignmentHistory.find(
                (h) => h.asset?._id === asset._id && h.status === 'Active'
              );

              return (
                <div
                  key={asset._id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {asset.assetId}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded">
                        {asset.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{asset.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {asset.brand} {asset.model} • S/N: <span className="font-mono">{asset.serialNumber}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {formatCurrency(asset.purchasePrice)}
                    </span>

                    {activeAssignment && (
                      <button
                        onClick={() => {
                          setSelectedAssignmentForReturn(activeAssignment);
                          setIsReturnModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-colors shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        Return Asset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Assignment History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Custody & Allocation History ({assignmentHistory.length})
        </h3>

        {assignmentHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past assignment history recorded.</p>
        ) : (
          <div className="space-y-3">
            {assignmentHistory.map((h) => (
              <div key={h._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{h.asset?.assetId}</span>
                    <span className="text-xs font-bold text-slate-900">{h.asset?.name}</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Assigned: {formatDate(h.assignmentDate)} • Expected Return: {formatDate(h.expectedReturnDate)}
                    {h.actualReturnDate && ` • Returned: ${formatDate(h.actualReturnDate)}`}
                  </p>
                  {h.notes && <p className="text-xs text-slate-600 mt-0.5 italic">"{h.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Asset Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Process Asset Return"
        subtitle={`Check in hardware from ${employee.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirming this return will automatically transition the asset status back to{' '}
            <span className="font-semibold text-emerald-600">Available</span> and detach employee custody.
          </p>

          <FormInput
            label="Condition & Return Inspection Notes"
            name="returnNotes"
            type="textarea"
            rows={3}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="Hardware condition verified, accessories received, clean wiped..."
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
              Confirm Return & Restock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDetail;
