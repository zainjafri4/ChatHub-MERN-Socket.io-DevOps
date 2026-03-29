import api from './api';

export const userService = {
  search: (q, limit = 10) => api.get('/users/search', { params: { q, limit } }),
  getById: (id) => api.get(`/users/${id}`),
  getStatus: (id) => api.get(`/users/${id}/status`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSettings: (data) => api.put('/users/settings', data),
};
