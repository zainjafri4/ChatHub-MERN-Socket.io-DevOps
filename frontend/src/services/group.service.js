import api from './api';

export const groupService = {
  getAll: () => api.get('/groups'),
  discover: (params) => api.get('/groups/discover', { params }),
  getById: (id) => api.get(`/groups/${id}`),
  create: (formData) => api.post('/groups', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/groups/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addMembers: (id, memberIds) => api.post(`/groups/${id}/members`, { memberIds }),
  removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  join: (id) => api.post(`/groups/${id}/join`),
  joinByInvite: (inviteCode) => api.post(`/groups/join/${inviteCode}`),
  generateInvite: (id) => api.post(`/groups/${id}/invite`),
  updateSettings: (id, settings) => api.put(`/groups/${id}/settings`, settings),
};
