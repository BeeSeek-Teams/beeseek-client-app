import { Config } from '@/config';
import { useAuthStore } from '@/store/useAuthStore';
import { useErrorStore } from '@/store/useErrorStore';
import axios from 'axios';

const api = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Retry configuration for network failures
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1s

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error: any, retryCount: number): boolean => {
  if (retryCount >= MAX_RETRIES) return false;
  
  // Retry on timeout or network errors (including ERR_NETWORK from React Native)
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
    return true;
  }
  
  // Retry on 5xx server errors
  if (error.response?.status >= 500) {
    return true;
  }
  
  // Don't retry on 4xx client errors (except 429)
  if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
    return false;
  }
  
  // Retry on rate limit (429)
  if (error.response?.status === 429) {
    return true;
  }
  
  return false;
};

api.interceptors.request.use(
  (config) => {
    
    // Longer timeout for heavy endpoints on slow networks
    const isAuthEndpoint = config.url?.includes('/auth/');
    const isPaymentEndpoint = config.url?.includes('/pay') || config.url?.includes('/complete');
    
    if (isAuthEndpoint || isPaymentEndpoint) {
      config.timeout = 30000; // 30s for auth and payments
    }
    
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as any;
    
    // Initialize retry count
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    
    // Handle Token Refresh logic for 401
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${Config.API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        }, { timeout: 30000 });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        useAuthStore.getState().setAccessToken(access_token);
        if (newRefreshToken) {
          useAuthStore.getState().setRefreshToken(newRefreshToken);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Only show error modal if we had a session (token exists), not if we're signing in
        const hasExistingToken = useAuthStore.getState().accessToken;
        if (hasExistingToken) {
          useErrorStore.getState().showError('auth', 'Your session expired. Please log in again.');
        }
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      useErrorStore.getState().showError('rate-limit');
    }

    // Help handle Timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      useErrorStore.getState().showError('timeout');
    }
    
    // Retry logic for network failures on auth endpoints
    const isNetworkError = error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout') || error.message === 'Network Error';
    if (isNetworkError || error.response?.status >= 500) {
      if (shouldRetry(error, originalRequest._retryCount)) {
        originalRequest._retryCount++;
        const delayMs = RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1); // Exponential backoff
        await sleep(delayMs);
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
