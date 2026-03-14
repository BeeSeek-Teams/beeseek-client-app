import api from './api';

export enum NotificationType {
  JOB = 'job',
  MESSAGE = 'message',
  SYSTEM = 'system',
  PROMO = 'promo',
  PAYMENT = 'payment',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export interface NotificationResponse {
  data: Notification[];
  total: number;
  page: number;
  lastPage: number;
}

class NotificationsService {
  async getMyNotifications(page: number = 1, limit: number = 20): Promise<NotificationResponse> {
    const { data } = await api.get('/notifications', {
      params: { page, limit },
    });
    return data;
  }

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/notifications/unread-count');
    return data.count;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }
}

export const notificationsService = new NotificationsService();
