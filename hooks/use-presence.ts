import api from '@/services/api';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/useAuthStore';
import { usePresenceStore, UserStatus } from '@/store/usePresenceStore';
import { useEffect, useRef } from 'react';

export { UserStatus };

const HEARTBEAT_INTERVAL = 45000; // 45 seconds (Redis TTL is 60s)

export const usePresence = () => {
    const { accessToken, user } = useAuthStore();
    const { presences, setPresence, updatePresences } = usePresenceStore();
    const intervalRef = useRef<any>(null);

    const sendHeartbeat = () => {
        // Use WebSocket instead of HTTP to reduce overhead
        if (socketService.isConnected()) {
            socketService.emit('heartbeat', {});
        }
    };

    const fetchBatchStatus = async (userIds: string[]) => {
        if (!userIds.length) return;
        try {
            const response = await api.get(`/presence/batch?ids=${userIds.join(',')}`);
            updatePresences(response.data);
        } catch (error) {
            console.error('[Presence] Batch fetch failed', error);
        }
    };

    useEffect(() => {
        if (!accessToken) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // 1. Initial Heartbeat
        sendHeartbeat();
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // 2. Listen for socket updates
        const unsubscribePresence = socketService.on('presenceUpdate', (data: { userId: string, status: UserStatus, lastSeenAt: number }) => {
            setPresence(data.userId, {
                status: data.status,
                lastSeenAt: data.lastSeenAt
            });
        });

        const unsubscribeStatus = socketService.on('agentStatusUpdate', (data: { 
            agentId: string, 
            isBooked: boolean, 
            bookedDate: string | null, 
            bookedTime: string | null,
            isAvailable: boolean
        }) => {
            setPresence(data.agentId, {
                isBooked: data.isBooked,
                bookedDate: data.bookedDate,
                bookedTime: data.bookedTime,
                isAvailable: data.isAvailable
            });
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            unsubscribePresence();
            unsubscribeStatus();
        };
    }, [accessToken]);

    return { presences, fetchBatchStatus };
};
