import { create } from 'zustand';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

interface PresenceData {
  status: UserStatus;
  lastSeenAt: number;
  isBooked?: boolean;
  bookedDate?: string | null;
  bookedTime?: string | null;
  isAvailable?: boolean;
}

interface PresenceState {
  presences: Record<string, PresenceData>;
  setPresence: (userId: string, data: Partial<PresenceData>) => void;
  updatePresences: (presences: Record<string, PresenceData>) => void;
  getPresence: (userId: string) => PresenceData;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: {},
  setPresence: (userId, data) => 
    set((state) => ({
      presences: { 
        ...state.presences, 
        [userId]: { ...(state.presences[userId] || { status: UserStatus.OFFLINE, lastSeenAt: 0 }), ...data } 
      }
    })),
  updatePresences: (newPresences) => 
    set((state) => {
        const updated = { ...state.presences };
        Object.keys(newPresences).forEach(id => {
            updated[id] = { ...(updated[id] || {}), ...newPresences[id] };
        });
        return { presences: updated };
    }),
  getPresence: (userId) => {
    return get().presences[userId] || { status: UserStatus.OFFLINE, lastSeenAt: 0 };
  }
}));
