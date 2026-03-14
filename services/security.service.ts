import api from './api';

export const securityService = {
  getStatus: async () => {
    const response = await api.get('/security/status');
    return response.data;
  },

  setPin: async (pin: string) => {
    const response = await api.post('/security/set-pin', { pin });
    return response.data;
  },

  verifyPin: async (pin: string) => {
    const response = await api.post('/security/verify-pin', { pin });
    return response.data;
  },

  toggleBiometrics: async (enabled: boolean) => {
    const response = await api.post('/security/toggle-biometrics', { enabled });
    return response.data;
  }
};
