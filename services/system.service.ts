import Constants from 'expo-constants';
import api from './api';

export interface VersionInfo {
  latest: string;
  min: string;
  iosUrl: string;
  androidUrl: string;
}

export interface SystemStatus {
  client: VersionInfo;
  agent: VersionInfo;
  message: string;
  maintenance: boolean;
}

export const systemService = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    const response = await api.get('/system-config/versions');
    return response.data;
  },

  getCurrentVersion: (): string => {
    return Constants.expoConfig?.version || '1.0.0';
  },

  compareVersions: (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
};
