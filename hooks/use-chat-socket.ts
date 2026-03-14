import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export const useChatSocket = () => {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    socketService.connect(accessToken);
  }, [accessToken]);

  const joinRoom = (roomId: string) => {
    socketService.emit('joinRoom', roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketService.emit('leaveRoom', roomId);
  };

  const onConnect = (callback: () => void) => {
    return socketService.on('connect', callback);
  };

  const onMessageReceived = (callback: (message: any) => void) => {
    return socketService.on('newMessage', callback);
  };

  const onMessagesRead = (callback: (payload: { roomId: string; userId: string }) => void) => {
    return socketService.on('messagesRead', callback);
  };

  const sendTyping = (roomId: string, isTyping: boolean) => {
    socketService.emit('typing', { roomId, isTyping });
  };

  const onTypingStatus = (callback: (payload: { roomId: string; userId: string; isTyping: boolean }) => void) => {
    return socketService.on('typingStatus', callback);
  };

  return {
    socket: socketService.getSocket(),
    joinRoom,
    leaveRoom,
    onConnect,
    onMessageReceived,
    onMessagesRead,
    sendTyping,
    onTypingStatus,
  };
};
