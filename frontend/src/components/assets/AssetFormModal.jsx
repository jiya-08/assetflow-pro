import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Laptop',
  'Desktop',
  'Monitor',
  'Mobile',
  'Printer',
  'Networking Equipment',
  'Furniture',
  'Other'
];

const STATUSES = ['Available', 'Assigned', 'Under Maintenance', 'Retired'];

export const AssetFormModal = ({ isOpen, onClose, onSubmit, asset = null, loading = false }) => {
  const isEdit = !!asset;

  const initialForm = {
    name: '',
    assetId: '',
    category: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    location: '',
    department: '',
    warrantyExpiryDate: '',
    description: '',
    status: 'Available'
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        assetId: asset.assetId || '',
        category: asset.category || 'Laptop',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        purchasePrice: asset.purchasePrice !== undefined ? asset.purchasePrice : '',
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
        location: asset.location || '',
        department: asset.department || '',
        warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toISOString().split('T')[0] : '',
        description: asset.description || '',
        status: asset.status || 'Available'
      });
    } else {
      setFormData({
        ...initialForm,
        assetId: `AST-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }
    setErrors({});
  }, [asset, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Asset Name is required';
    if (!formData.assetId.trim()) newErrors.assetId = 'Asset ID is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial Number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (formData.purchasePrice === '' || isNaN(formData.purchasePrice) || Number(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = 'Valid purchase price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      purchasePrice: Number(formData.purchasePrice)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Asset: ${asset.assetId}` : 'Register New Asset'}
      subtitle={isEdit ? 'Update physical asset metadata & specifications' : 'Record a new physical asset into the organization inventory'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Asset Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. MacBook Pro 16 M3 Max"
            required
            error={errors.name}
          />
          <FormInput
            label="Asset ID"
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="e.g. AST-1001"
            required
            error={errors.assetId}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleChange}
            options={CATEGORIES}
            required
          />
          <FormInput
            label="Brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Apple, Dell"
            required
            error={errors.brand}
          />
          <FormInput
            label="Model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g. XPS 15 9530"
            required
            error={errors.model}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Serial Number"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder="Hardware serial tag"
            required
            error={errors.serialNumber}
          />
          <FormInput
            label="Purchase Price ($)"
            name="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={handleChange}
            placeholder="0.00"
            required
            error={errors.purchasePrice}
          />
          <FormInput
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. HQ Floor 3 Lab"
            required
            error={errors.location}
          />
          <FormInput
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Engineering"
            required
            error={errors.department}
          />
          <FormInput
            label="Warranty Expiry"
            name="warrantyExpiryDate"
            type="date"
            value={formData.warrantyExpiryDate}
            onChange={handleChange}
          />
        </div>

        {isEdit && (
          <FormInput
            label="Current Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={handleChange}
            options={STATUSES}
            helperText="Note: Changing status to Assigned should normally be handled via the Assignments workflow."
          />
        )}

        <FormInput
          label="Description & Specifications"
          name="description"
          type="textarea"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Hardware specs, condition, accessories included..."
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Asset' : 'Create Asset'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssetFormModal;
