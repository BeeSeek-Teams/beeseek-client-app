import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Terms of Service" />
      
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: 'https://www.beseek.site/terms' }}
          style={{ flex: 1, backgroundColor: colors.background }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <View style={{ padding: 16, width: '100%' }}>
               <AppSkeleton width="60%" height={32} borderRadius={8} style={{marginBottom: 24}} />
               
               <AppSkeleton width="100%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="100%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="90%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="95%" height={16} borderRadius={4} style={{marginBottom: 24}} />
               
               <AppSkeleton width="40%" height={24} borderRadius={8} style={{marginBottom: 16}} />
               <AppSkeleton width="100%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="98%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="85%" height={16} borderRadius={4} style={{marginBottom: 24}} />

               <AppSkeleton width="50%" height={24} borderRadius={8} style={{marginBottom: 16}} />
               <AppSkeleton width="100%" height={16} borderRadius={4} style={{marginBottom: 8}} />
               <AppSkeleton width="92%" height={16} borderRadius={4} />
            </View>
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
});
