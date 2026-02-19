import { http } from './http';

export const chatsApi = {
  privateConversation: (friendUserId) => http.post('/chats/private', { friendUserId }),
  privateMessages: (conversationId, params = {}) =>
    http.get(`/chats/private/${conversationId}/messages`, { params })
};
