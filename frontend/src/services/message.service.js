import api from './api';

export const messageService = {
  getMessages: (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post('/messages', data),
  sendFile: (formData) => api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  edit: (id, content) => api.put(`/messages/${id}`, { content }),
  delete: (id, deleteForEveryone) => api.delete(`/messages/${id}`, { data: { deleteForEveryone } }),
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
  markRead: (data) => api.post('/messages/read', data),
  pin: (id) => api.post(`/messages/${id}/pin`),
  getPinned: (params) => api.get('/messages/pinned', { params }),
  search: (params) => api.get('/messages/search', { params }),
};
