import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useChatSocket } from './use-chat-socket';

export const useSyncChat = () => {
  const { accessToken, user } = useAuthStore();
  const { setTotalUnreadCount, incrementUnreadCount } = useChatStore();
  const { onMessageReceived, onMessagesRead, onConnect } = useChatSocket();
  const segments = useSegments();

  useEffect(() => {
    if (!accessToken) return;

    // 1. Initial Fetch
    chatService.getTotalUnreadCount()
      .then(setTotalUnreadCount)
      .catch(console.error);

    // 2. Real-time updates
    const unsubscribeNewMessage = onMessageReceived((msg) => {
      // Only increment if we are NOT in the chat detail for this message
      const pathSegments = segments as string[];
      const isCurrentChat = pathSegments.includes('chat') && pathSegments.includes(msg.conversationId);
      
      if (!isCurrentChat && msg.senderId !== user?.id) {
        incrementUnreadCount();
      }
    });

    const unsubscribeMessagesRead = onMessagesRead((payload) => {
      // If someone else read messages, it doesn't affect OUR unread count
      // If WE read messages (marked as read), the counts are handled in the ChatDetailScreen
      // But just to be sure, we can re-sync if the current user is the one who read
      if (payload.userId === user?.id) {
         chatService.getTotalUnreadCount().then(setTotalUnreadCount);
      }
    });

    const unsubscribeConnect = onConnect(() => {
      console.log('Socket reconnected, syncing global unread count...');
      chatService.getTotalUnreadCount().then(setTotalUnreadCount).catch(console.error);
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessagesRead();
      unsubscribeConnect();
    };
  }, [accessToken, segments, user?.id]);
};
