import { http } from './http';

export const groupsApi = {
  create: (payload) => http.post('/groups/create', payload),
  list: () => http.get('/groups/list'),
  addMember: (groupId, userId) => http.post(`/groups/${groupId}/add`, { userId }),
  removeMember: (groupId, userId) => http.post(`/groups/${groupId}/remove`, { userId }),
  rename: (groupId, name) => http.post(`/groups/${groupId}/rename`, { name }),
  updateIcon: (groupId, groupIcon) => http.post(`/groups/${groupId}/icon`, { groupIcon }),
  messages: (groupId, params = {}) => http.get(`/groups/${groupId}/messages`, { params })
};
