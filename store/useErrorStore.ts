import { create } from 'zustand';

export type ErrorType = 'auth' | 'rate-limit' | 'timeout' | 'generic';

interface ErrorState {
  visible: boolean;
  type: ErrorType;
  title: string;
  message: string;
  showError: (type: ErrorType, message?: string) => void;
  hideError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  visible: false,
  type: 'generic',
  title: '',
  message: '',
  showError: (type, message) => {
    let title = 'Error';
    let defaultMessage = message || 'Something went wrong. Please try again.';

    switch (type) {
      case 'auth':
        title = 'Session Expired';
        defaultMessage = message || 'Your session has expired. Please log in again.';
        break;
      case 'rate-limit':
        title = 'Too Many Requests';
        defaultMessage = message || 'You are making too many requests. Please wait a moment and try again.';
        break;
      case 'timeout':
        title = 'Connection Timeout';
        defaultMessage = message || 'Please check your internet connection.';
        break;
    }

    set({
      visible: true,
      type,
      title,
      message: defaultMessage,
    });
  },
  hideError: () => set({ visible: false }),
}));
