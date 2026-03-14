import { AppButton } from '@/components/AppButton';
import { AppModal } from '@/components/AppModal';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { NotificationItem } from '@/components/NotificationItem';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Notification, notificationsService } from '@/services/notifications.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Stack, useRouter } from 'expo-router';
import { Checks, SmileySad } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { decrementUnreadCount, clearUnreadCount } = useNotificationStore();

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) {
        setLoading(true);
        setPage(1);
    }
    
    try {
        const response = await notificationsService.getMyNotifications(currentPage, 20);
        setData(prev => reset ? response.data : [...prev, ...response.data]);
        setHasMore(currentPage < response.lastPage);
        setPage(currentPage + 1);
    } catch (error) {
        console.error('Failed to load notifications:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    loadData();
  };

  const handleMarkAllRead = async () => {
    try {
        await notificationsService.markAllAsRead();
        setData(prev => (prev || []).map(n => ({ ...n, isRead: true })));
        clearUnreadCount();
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationPress = async (item: Notification) => {
      // Mark as read locally and on server
      if (!item.isRead) {
          try {
              setData(prev => (prev || []).map(n => n.id === item.id ? { ...n, isRead: true } : n));
              await notificationsService.markAsRead(item.id);
              decrementUnreadCount();
          } catch (error) {
              console.error('Failed to mark notification as read:', error);
          }
      }
      
      // Open detailed modal
      setSelectedNotification(item);
  };

  const timeAgo = (dateStr: string) => {
    try {
        return dayjs(dateStr).fromNow();
    } catch (e) {
        return 'Recently';
    }
  };

  const renderSkeleton = () => (
    <View style={{ padding: Spacing.md }}>
        {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: Spacing.lg }}>
                <AppSkeleton width={40} height={40} style={{ borderRadius: 20, marginRight: Spacing.md }} />
                <View style={{ flex: 1 }}>
                    <AppSkeleton width="80%" height={20} style={{ marginBottom: 8 }} />
                    <AppSkeleton width="100%" height={14} style={{ marginBottom: 4 }} />
                    <AppSkeleton width="40%" height={12} />
                </View>
            </View>
        ))}
    </View>
  );

  return (
    <AppScreen disablePadding>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader 
        title="Notifications" 
        rightAction={
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerAction}>
                <Checks size={22} color={colors.primary} weight="bold" />
            </TouchableOpacity>
        }
      />
      
      {loading && data.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
               {...item} 
               time={timeAgo(item.createdAt)}
               onPress={() => handleNotificationPress(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <SmileySad size={48} color={colors.textSecondary} />
                <AppText variant="bold" style={{ marginTop: 16 }}>No notifications yet</AppText>
                <AppText color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                    Important updates and activity will appear here.
                </AppText>
            </View>
          }
        />
      )}

      {/* Notification Detail Pop-up */}
      <AppModal
        visible={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.type === 'job' ? 'Job Alert' : (selectedNotification?.type === 'message' ? 'Message' : 'Notification')}
      >
        <View>
            <AppText variant="bold" size="xl" style={{ marginBottom: Spacing.sm }}>
                {selectedNotification?.title}
            </AppText>
            <AppText size="xs" color={colors.textSecondary} style={{ marginBottom: Spacing.lg }}>
                {selectedNotification && timeAgo(selectedNotification.createdAt)}
            </AppText>
            
            <View style={[styles.messageBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText style={{ lineHeight: 24, color: colors.text }}>
                    {selectedNotification?.message}
                </AppText>
            </View>

            <View style={{ marginTop: Spacing.xl }}>
                <AppButton title="Okay, Got it" onPress={() => setSelectedNotification(null)} />
            </View>
        </View>
      </AppModal>

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAction: {
    padding: 8,
  },
  messageBox: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  }
});
