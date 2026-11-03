import api from './api';

export const assignmentService = {
  getAssignments: async (params = {}) => {
    const res = await api.get('/assignments', { params });
    return res.data;
  },

  createAssignment: async (data) => {
    const res = await api.post('/assignments', data);
    return res.data;
  },

  returnAssignment: async (id, data) => {
    const res = await api.post(`/assignments/${id}/return`, data);
    return res.data;
  }
};
