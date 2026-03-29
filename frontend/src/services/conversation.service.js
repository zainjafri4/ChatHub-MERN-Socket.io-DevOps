import api from './api';

export const conversationService = {
  getAll: () => api.get('/conversations'),
  getOrCreate: (recipientId) => api.post('/conversations', { recipientId }),
  delete: (id) => api.delete(`/conversations/${id}`),
};
