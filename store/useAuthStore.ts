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
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
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
