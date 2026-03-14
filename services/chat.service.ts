import api from './api';

export interface Conversation {
  id: string;
  participant1: any;
  participant1Id: string;
  participant2: any;
  participant2Id: string;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCountP1: number;
  unreadCountP2: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'service_request' | 'service_quote';
  mediaUrl?: string;
  contractId?: string;
  contract?: any;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  createdAt: string;
  sender: any;
}

class ChatService {
  async getRooms(page: number = 1, limit: number = 50): Promise<Conversation[]> {
    const { data } = await api.get('/chat/rooms', { params: { page, limit } });
    return data.items ?? data;
  }

  async getConversation(roomId: string): Promise<Conversation> {
    const { data } = await api.get(`/chat/rooms/${roomId}`);
    return data;
  }

  async getOrCreateRoom(targetId: string): Promise<Conversation> {
    const { data } = await api.post('/chat/rooms', { targetId });
    return data;
  }

  async getMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const { data } = await api.get(`/chat/rooms/${roomId}/messages`, {
      params: { limit, offset }
    });
    return data;
  }

  async sendMessage(roomId: string, content: string, type: string = 'text', mediaUrl?: string): Promise<Message> {
    const { data } = await api.post(`/chat/rooms/${roomId}/messages`, { content, type, mediaUrl });
    return data;
  }

  async markAsRead(roomId: string): Promise<void> {
    await api.post(`/chat/rooms/${roomId}/read`);
  }

  async getTotalUnreadCount(): Promise<number> {
    const { data } = await api.get('/chat/unread-count');
    return data;
  }
}

export const chatService = new ChatService();
