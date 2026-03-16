import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  slug?: string;
  role: 'CLIENT' | 'AGENT';
  isVerified: boolean;
  isAvailable?: boolean;
  isBooked?: boolean;
  bookedDate?: string | null;
  bookedTime?: string | null;
  isNinVerified?: boolean;
  ninStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  age: number;
  phone?: string;
  bio?: string;
  profileImage?: string;
  walletBalance?: number;
  lockedBalance?: number;
  monnifyNUBAN?: string;
  monnifyBankName?: string;
  monnifyAccountName?: string;
  deviceType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  earlyAccessAchievement?: boolean;
  topRatedAchievement?: boolean;
  goldenBadgeAchievement?: boolean;
  useBiometrics?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastLocation: { latitude: number; longitude: number } | null;
  actualDeviceLocation: { latitude: number; longitude: number } | null;
  lastAddress: string | null;
  _hasHydrated: boolean;
  pendingResetCode: string | null;
  pendingResetEmail: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setLocation: (location: { latitude: number; longitude: number }, address: string) => void;
  setActualLocation: (location: { latitude: number; longitude: number } | null) => void;
  setHasHydrated: (state: boolean) => void;
  setPendingReset: (email: string, code: string) => void;
  clearPendingReset: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Custom storage object to use Expo SecureStore
// SecureStore has a 2048-byte limit per item on Android.
// Chunk large values across multiple keys to avoid the limit.
const CHUNK_SIZE = 1800;

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const countStr = await SecureStore.getItemAsync(`${name}_count`);
    if (!countStr) {
      // Legacy single-key read (migration path)
      return await SecureStore.getItemAsync(name);
    }
    const count = parseInt(countStr, 10);
    let result = '';
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${name}_${i}`);
      if (chunk === null) return null;
      result += chunk;
    }
    return result;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${name}_count`, String(chunks.length));
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${name}_${i}`, chunks[i]);
    }
    // Clean up legacy single key
    try { await SecureStore.deleteItemAsync(name); } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    const countStr = await SecureStore.getItemAsync(`${name}_count`);
    if (countStr) {
      const count = parseInt(countStr, 10);
      for (let i = 0; i < count; i++) {
        try { await SecureStore.deleteItemAsync(`${name}_${i}`); } catch {}
      }
      await SecureStore.deleteItemAsync(`${name}_count`);
    }
    try { await SecureStore.deleteItemAsync(name); } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      lastLocation: null,
      actualDeviceLocation: null,
      lastAddress: null,
      _hasHydrated: false,
      pendingResetCode: null,
      pendingResetEmail: null,
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setPendingReset: (email, code) => set({ pendingResetEmail: email, pendingResetCode: code }),
      clearPendingReset: () => set({ pendingResetEmail: null, pendingResetCode: null }),
      setLocation: (lastLocation, lastAddress) => set({ lastLocation, lastAddress }),
      setActualLocation: (actualDeviceLocation) => set({ actualDeviceLocation }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      logout: () => 
        set({ user: null, accessToken: null, refreshToken: null }),
      updateUser: (updatedUser) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, ...updatedUser } : null 
        })),
    }),
    {
      name: 'beeseek-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastLocation: state.lastLocation,
        lastAddress: state.lastAddress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
