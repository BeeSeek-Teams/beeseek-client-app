import api from './api';

export const walletService = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/wallet/transactions');
    return response.data;
  },

  withdraw: async (amountKobo: number, bankId: string, pin: string) => {
    const response = await api.post('/wallet/withdraw', { amountKobo, bankId, pin });
    return response.data;
  }
};
