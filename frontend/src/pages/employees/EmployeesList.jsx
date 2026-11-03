import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { employeeService } from '../../services/employeeService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Boxes,
  Loader2,
  Filter
} from 'lucide-react';

const DEPARTMENTS = [
  'All',
  'Engineering',
  'Product & Design',
  'Marketing & Sales',
  'Operations & IT',
  'Finance & Legal',
  'Customer Success',
  'Human Resources'
];

export const EmployeesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');

  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees({
        search,
        department,
        status,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setEmployees(res.employees);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  }, [search, department, status, currentPage, showError]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAddModal = () => {
    setSelectedEmployeeForEdit(null);
    setFormData({
      name: '',
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: '',
      phone: '',
      department: 'Engineering',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployeeForEdit(emp);
    setFormData({
      name: emp.name || '',
      employeeId: emp.employeeId || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      status: emp.status || 'Active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.email.trim()) errors.email = 'Work Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.designation.trim()) errors.designation = 'Designation is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      if (selectedEmployeeForEdit) {
        await employeeService.updateEmployee(selectedEmployeeForEdit._id, formData);
        success(`Employee '${formData.name}' updated successfully.`);
      } else {
        await employeeService.createEmployee(formData);
        success(`Employee '${formData.name}' registered successfully.`);
      }
      setIsFormModalOpen(false);
      fetchEmployees();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save employee profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployeeForDelete) return;
    try {
      setDeleteLoading(true);
      await employeeService.deleteEmployee(selectedEmployeeForDelete._id);
      success(`Employee '${selectedEmployeeForDelete.name}' deleted successfully.`);
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Employee Name & ID',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{row.name}</span>
              <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                {row.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{row.designation}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Information',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.phone}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
          {row.department}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Allocated Assets',
      accessor: 'assignedAssetsCount',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Boxes className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-slate-900 text-xs">
            {row.assignedAssetsCount || 0}
          </span>
          <span className="text-[11px] text-slate-400">active items</span>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/employees/${row._id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Employee Profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              disabled={row.assignedAssetsCount > 0}
              onClick={() => {
                setSelectedEmployeeForDelete(row);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={row.assignedAssetsCount > 0 ? 'Cannot delete employee with active assets' : 'Delete Employee'}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of organization personnel, hardware custody records, and department allocations.
          </p>
        </div>

        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          onClear={() => setSearch('')}
          placeholder="Search employees by name, ID, or job title..."
          className="w-full md:flex-1"
        />

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            <span>Department:</span>
          </div>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found"
        emptySubtext="Try adjusting your department filter or search term."
        onRowClick={(row) => navigate(`/employees/${row._id}`)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pages}
        totalItems={total}
        pageSize={10}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedEmployeeForEdit ? `Edit Employee: ${selectedEmployeeForEdit.name}` : 'Register New Employee'}
        subtitle="Manage personnel profiles and hardware accountability"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. John Doe"
              required
              error={formErrors.name}
            />
            <FormInput
              label="Employee ID"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleFormChange}
              placeholder="e.g. EMP-1001"
              required
              error={formErrors.employeeId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Work Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="john@company.com"
              required
              error={formErrors.email}
            />
            <FormInput
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="+1 (555) 000-0000"
              required
              error={formErrors.phone}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Department"
              name="department"
              type="select"
              value={formData.department}
              onChange={handleFormChange}
              options={DEPARTMENTS.filter((d) => d !== 'All')}
            />
            <FormInput
              label="Designation / Role"
              name="designation"
              value={formData.designation}
              onChange={handleFormChange}
              placeholder="e.g. Senior Software Engineer"
              required
              error={formErrors.designation}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Joining Date"
              name="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={handleFormChange}
            />
            <FormInput
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleFormChange}
              options={['Active', 'Inactive', 'On Leave']}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={formLoading}
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
            >
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedEmployeeForEdit ? 'Update Profile' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Employee: ${selectedEmployeeForDelete?.name}`}
        message={`Are you sure you want to remove ${selectedEmployeeForDelete?.name} (${selectedEmployeeForDelete?.employeeId})? This action cannot be reversed.`}
        confirmText="Confirm Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default EmployeesList;
