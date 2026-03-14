import api from './api';

export const userService = {
  getUserProfile: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  updateFcmToken: async (token: string) => {
    const response = await api.put('/users/fcm-token', { token });
    return response.data;
  }
};
