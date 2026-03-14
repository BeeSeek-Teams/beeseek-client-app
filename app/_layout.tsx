import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { AppAlert } from '@/components/AppAlert';
import { AppUpdateModal } from '@/components/AppUpdateModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Config } from '@/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications } from '@/hooks/use-notifications';
import { usePresence } from '@/hooks/use-presence';
import { useSyncChat } from '@/hooks/use-sync-chat';
import { socketService } from '@/services/socket.service';
import { systemService } from '@/services/system.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useErrorStore } from '@/store/useErrorStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

if (Config.SENTRY_DSN) {
  Sentry.init({
    dsn: Config.SENTRY_DSN,
    debug: process.env.NODE_ENV === 'development',
    tracesSampleRate: 1.0,
  });
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { accessToken, user, _hasHydrated } = useAuthStore();
  const { visible, type, title, message, hideError } = useErrorStore();

  const [updateStatus, setUpdateStatus] = useState<{
    type: 'none' | 'optional' | 'forced' | 'maintenance';
    url?: string;
  }>({ type: 'none' });

  // Check for app updates and maintenance
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await systemService.getSystemStatus();
        const currentVersion = systemService.getCurrentVersion();
        
        if (status.maintenance) {
          setUpdateStatus({ type: 'maintenance' });
          return;
        }

        const isMinimumMet = systemService.compareVersions(currentVersion, status.client.min) >= 0;
        const isLatestMet = systemService.compareVersions(currentVersion, status.client.latest) >= 0;
        const updateUrl = Platform.OS === 'ios' ? status.client.iosUrl : status.client.androidUrl;

        if (!isMinimumMet) {
          setUpdateStatus({ type: 'forced', url: updateUrl });
        } else if (!isLatestMet) {
          setUpdateStatus({ type: 'optional', url: updateUrl });
        }
      } catch (error) {
        console.error('Failed to check system status:', error);
      }
    };
    checkStatus();
  }, []);

  // Initialize notifications
  useNotifications();

  // Initialize heartbeat presence
  usePresence();

  // Initialize chat unread sync
  useSyncChat();

  useEffect(() => {
    if (!accessToken) {
      socketService.disconnect();
    }
  }, [accessToken]);

  useEffect(() => {
    if (!_hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isVerifying = segments[1] === 'verify-otp';
    const isNin = segments[1] === 'nin';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup && !isVerifying && !isNin) {
      // Allow proceed if NIN is verified OR pending review
      const isNinCleared = user?.isNinVerified || user?.ninStatus === 'PENDING';
      
      if (user?.isVerified && isNinCleared) {
        router.replace('/(tabs)');
      } else if (user?.isVerified && !isNinCleared) {
        // If email verified but NIN not submitted, send to NIN
        router.replace('/verify-nin');
      }
    } else if (accessToken && !inAuthGroup && !user?.isVerified) {
      // If they somehow got to tabs but aren't verified, send back to OTP
      router.replace('/(auth)/verify-otp');
    }
  }, [accessToken, user?.isVerified, user?.isNinVerified, segments, _hasHydrated]);

  if (!_hasHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="dark" />
      <AppAlert 
        visible={visible}
        type={type === 'auth' ? 'warning' : 'error'}
        title={title}
        message={message}
        onConfirm={hideError}
      />
      <AppUpdateModal
        visible={updateStatus.type !== 'none'}
        type={updateStatus.type === 'none' ? 'optional' : updateStatus.type}
        updateUrl={updateStatus.url}
        onClose={() => setUpdateStatus({ type: 'none' })}
      />
    </ThemeProvider>
  );
}

function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

export default Sentry.wrap(RootLayout);
