import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { User } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface ChatListItemProps {
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  avatarUrl?: string; // We'll just use a placeholder if not provided
  onPress: () => void;
}

export function ChatListItem({
  name,
  lastMessage,
  time,
  unreadCount = 0,
  isOnline = false,
  avatarUrl,
  onPress,
}: ChatListItemProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <Ripple
      onPress={onPress}
      rippleColor={colors.primary}
      rippleOpacity={0.1}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderShadow, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
            <User size={28} weight="bold" color={colors.textSecondary} />
          </View>
        )}
        <View style={[styles.onlineBadge, { borderColor: colors.background }]}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: isOnline ? colors.success : '#D1D5DB' }} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <AppText variant="bold" size="lg" numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          <AppText variant="medium" size="xs" color={colors.textSecondary}>
            {time}
          </AppText>
        </View>

        <View style={styles.messageRow}>
          <AppText
            variant={unreadCount > 0 ? 'medium' : 'regular'}
            color={unreadCount > 0 ? colors.text : colors.textSecondary}
            numberOfLines={1}
            style={styles.message}
            size="sm"
          >
            {lastMessage}
          </AppText>
          
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <AppText variant="bold" size="xs" color="#FFF" style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Ripple>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    paddingRight: Spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderShadow: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: Spacing.md - 2,
    borderRadius: 12,
    borderWidth: 4,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
