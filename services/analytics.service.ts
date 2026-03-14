import api from './api';

export enum BeeAnalyticsEventType {
  VIEW = 'VIEW',
  HIRE = 'HIRE',
  COMPLETION = 'COMPLETION',
  CANCELLATION = 'CANCELLATION',
}

class AnalyticsService {
  async trackEvent(beeId: string, type: BeeAnalyticsEventType, metadata?: any) {
    try {
      await api.post('/analytics/track', { beeId, type, metadata });
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  async trackView(beeId: string) {
    return this.trackEvent(beeId, BeeAnalyticsEventType.VIEW);
  }

  async getBeeStats(beeId: string, days: number = 7) {
    const { data } = await api.get(`/analytics/bee/${beeId}`, { params: { days } });
    return data;
  }

  async getOverview(period?: string) {
    const { data } = await api.get('/analytics/overview', { params: period ? { period } : {} });
    return data;
  }

  async getRecentHires() {
    const { data } = await api.get('/analytics/hires/recent');
    return data;
  }

  async getRecurringHires() {
    const { data } = await api.get('/analytics/hires/recurring');
    return data;
  }

  async getPendingReviews() {
    const { data } = await api.get('/analytics/pending-reviews');
    return data;
  }
}

export const analyticsService = new AnalyticsService();
