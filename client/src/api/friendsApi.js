import { http } from './http';

export const usersApi = {
  search: (query) => http.get(`/users/search?query=${encodeURIComponent(query)}`)
};

export const friendsApi = {
  sendRequest: (payload) => http.post('/friends/request', payload),
  accept: (requestId) => http.post('/friends/accept', { requestId }),
  reject: (requestId) => http.post('/friends/reject', { requestId }),
  list: () => http.get('/friends/list')
};
