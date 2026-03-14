import { Config } from '@/config';
import { useAuthStore } from '@/store/useAuthStore';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from './api';

export interface ServiceRequest {
  id: string;
  clientId: string;
  agentId: string;
  beeId: string;
  details: string;
  workDate: string;
  startTime: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: string;
  workmanshipCost: number;
  transportFare: number;
  materials?: { item: string; cost: number }[];
  totalCost: number;
  bee?: any;
}

export const contractService = {
  createRequest: async (data: {
    beeId: string;
    details: string;
    workDate: string;
    startTime: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    roomId: string;
  }) => {
    const response = await api.post('/contracts/request', data);
    return response.data;
  },

  acceptRequest: async (id: string, data: {
    workmanshipCost: number;
    transportFare: number;
    materials?: { item: string; cost: number }[];
    roomId: string;
  }) => {
    const response = await api.post(`/contracts/${id}/accept`, data);
    return response.data;
  },

  rejectRequest: async (id: string, roomId: string) => {
    const response = await api.post(`/contracts/${id}/reject`, { roomId });
    return response.data;
  },

  getBusySlots: async (agentId: string, date: string): Promise<string[]> => {
    const response = await api.get(`/contracts/agent/${agentId}/busy-slots`, {
      params: { date },
    });
    return response.data;
  },

  getContract: async (id: string) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data as ServiceRequest;
  },

  getMyContracts: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/contracts', { params: { page, limit } });
    return response.data;
  },

  getMyJobs: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/contracts/mine/jobs?page=${page}&limit=${limit}`);
    return response.data;
  },

  pay: async (id: string, roomId: string, pin: string) => {
    const response = await api.post(`/contracts/${id}/pay`, { roomId, pin });
    return response.data;
  },

  complete: async (id: string, pin: string) => {
    const response = await api.post(`/contracts/${id}/complete`, { pin });
    return response.data;
  },

  getJob: async (id: string) => {
    const response = await api.get(`/contracts/jobs/${id}`);
    return response.data;
  },

  updateJobStep: async (jobId: string, step: string, arrivalCode?: string) => {
    const response = await api.post(`/contracts/jobs/${jobId}/step`, { step, arrivalCode });
    return response.data;
  },

  updateJobStatus: async (jobId: string, status: string) => {
    const response = await api.post(`/contracts/jobs/${jobId}/status`, { status });
    return response.data;
  },

  cancelJob: async (jobId: string, reason: string, category?: string) => {
    const response = await api.post(`/contracts/jobs/${jobId}/cancel`, { reason, category });
    return response.data;
  },

  downloadPdf: async (contractId: string, contractNumber: string) => {
    const fileUri = `${cacheDirectory}contract-${contractNumber}.pdf`;
    
    // Get auth token directly from store (axios interceptor doesn't apply to expo-file-system)
    const token = useAuthStore.getState().accessToken;
    
    const downloadResult = await downloadAsync(
      `${Config.API_URL}/contracts/${contractId}/pdf`,
      fileUri,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download PDF (status: ${downloadResult.status})`);
    }

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Service Agreement ${contractNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }

    return downloadResult.uri;
  }
};
