import api from './api';

export interface SearchBeesParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  query?: string;
  sortBy?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  onlineOnly?: boolean;
  hasInspection?: boolean;
  page?: number;
  limit?: number;
}

export interface BeeSearchResponse {
  data: any[];
  total: number;
  page: number;
  lastPage: number;
}

class BeesService {
  async searchNearby(params: SearchBeesParams): Promise<BeeSearchResponse> {
    const { data } = await api.get('/bees/search', { params });
    return data;
  }

  async getAgentBees(agentId: string) {
    const { data } = await api.get(`/bees/agent/${agentId}`);
    return data;
  }
}

export const beesService = new BeesService();
