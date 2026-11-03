import api from './api';

export const employeeService = {
  getEmployees: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },

  getEmployeeById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (employeeData) => {
    const res = await api.post('/employees', employeeData);
    return res.data;
  },

  updateEmployee: async (id, employeeData) => {
    const res = await api.put(`/employees/${id}`, employeeData);
    return res.data;
  },

  deleteEmployee: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  }
};
