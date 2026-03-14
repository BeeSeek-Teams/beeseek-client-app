import api from './api';

export interface CreateReviewDto {
  jobId: string;
  rating: number;
  comment?: string;
}

class ReviewService {
  async submitReview(data: CreateReviewDto) {
    const response = await api.post('/reviews', data);
    return response.data;
  }

  async getMyReviews(page: number = 1, limit: number = 10) {
    const response = await api.get('/reviews/me', { params: { page, limit } });
    return response.data;
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const response = await api.get(`/reviews/user/${userId}`, { params: { page, limit } });
    return response.data;
  }
}

export const reviewService = new ReviewService();
