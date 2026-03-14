import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { userService } from '@/services/users.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useChatSocket } from './use-chat-socket';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const router = useRouter();
  const { fetchUnreadCount, setUnreadCount } = useNotificationStore();
  const { socket } = useChatSocket();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setPushToken(token);
      // Only send token to backend if user is authenticated
      if (token && accessToken) {
        userService.updateFcmToken(token).catch(err => {
          console.error('[NotificationHook] Failed to send token to backend:', err);
        });
      }
    });

    // 1. Socket Listener for Real-time metadata updates (Production grade, instant)
    if (socket) {
      socket.on('notificationUnreadUpdate', (payload: { count: number }) => {
        console.log('[NotificationHook] Real-time unread count update:', payload.count);
        setUnreadCount(payload.count);
      });
    }

    // 2. Push Notification Listener (Fallback/Overlay support)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      // Re-fetch unread count from server to ensure accuracy when a new notification arrives
      fetchUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { url?: string };
      if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (socket) {
        socket.off('notificationUnreadUpdate');
      }
    };
  }, [socket, accessToken]);

  return { pushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;

  // Check if running in Expo Go - Remote notifications (FCM) are not supported in Expo Go for Android in SDK 53+
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#031745',
    });
  }

  if (Device.isDevice) {
    // Skip remote token registration if in Expo Go on Android to prevent crash
    if (isExpoGo && Platform.OS === 'android') {
      console.warn('[Notification] Remote notifications are not supported in Expo Go for Android. Use a development build.');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    
    try {
      // Using getDevicePushTokenAsync to get FCM/APNs token for direct Firebase use
      token = (await Notifications.getDevicePushTokenAsync()).data;
    } catch (e) {
      console.warn('[Notification] Failed to get push token:', e);
    }
  }

  return token;
}
