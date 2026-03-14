import { LoginFormValues, RegisterFormValues } from '../utils/validation';
import api from './api';

export const authService = {
  login: async (data: LoginFormValues) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterFormValues) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  verifyNIN: async (nin: string) => {
    const response = await api.post('/auth/verify-nin', { ninNumber: nin });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resendVerificationOtp: async (email: string) => {
    const response = await api.post('/auth/resend-verification-otp', { email });
    return response.data;
  },

  verifyOtp: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-otp', { email, code });
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/profile');
    return response.data;
  },
};
