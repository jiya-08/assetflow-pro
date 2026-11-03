import api from './api';

export const assetService = {
  getAssets: async (params = {}) => {
    const res = await api.get('/assets', { params });
    return res.data;
  },

  getAssetById: async (id) => {
    const res = await api.get(`/assets/${id}`);
    return res.data;
  },

  createAsset: async (assetData) => {
    const res = await api.post('/assets', assetData);
    return res.data;
  },

  updateAsset: async (id, assetData) => {
    const res = await api.put(`/assets/${id}`, assetData);
    return res.data;
  },

  deleteAsset: async (id) => {
    const res = await api.delete(`/assets/${id}`);
    return res.data;
  },

  getQRCode: async (id) => {
    const res = await api.get(`/assets/${id}/qrcode`);
    return res.data;
  }
};
