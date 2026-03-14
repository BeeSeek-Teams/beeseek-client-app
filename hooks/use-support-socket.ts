import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export const useSupportSocket = () => {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    socketService.connect(accessToken);
  }, [accessToken]);

  const joinTicket = (ticketId: string) => {
    socketService.emit('joinTicket', ticketId);
  };

  const leaveTicket = (ticketId: string) => {
    socketService.emit('leaveTicket', ticketId);
  };

  const onConnect = (callback: () => void) => {
    return socketService.on('connect', callback);
  };

  const onMessageReceived = (callback: (message: any) => void) => {
    return socketService.on('newSupportMessage', callback);
  };

  const onTicketStatusChanged = (callback: (data: any) => void) => {
    return socketService.on('ticketStatusChanged', callback);
  };

  return {
    socket: socketService.getSocket(),
    joinTicket,
    leaveTicket,
    onConnect,
    onMessageReceived,
    onTicketStatusChanged,
  };
};
