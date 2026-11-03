import api from './api';

export const maintenanceService = {
  getRecords: async (params = {}) => {
    const res = await api.get('/maintenance', { params });
    return res.data;
  },

  createRecord: async (data) => {
    const res = await api.post('/maintenance', data);
    return res.data;
  },

  updateRecord: async (id, data) => {
    const res = await api.put(`/maintenance/${id}`, data);
    return res.data;
  }
};
