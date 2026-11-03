import api from './api';

export const bookingService = {
  getBookings: async (params = {}) => {
    const res = await api.get('/bookings', { params });
    return res.data;
  },

  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
    return res.data;
  },

  updateStatus: async (id, statusData) => {
    const res = await api.put(`/bookings/${id}/status`, statusData);
    return res.data;
  },

  cancelBooking: async (id) => {
    const res = await api.put(`/bookings/${id}/cancel`);
    return res.data;
  }
};
