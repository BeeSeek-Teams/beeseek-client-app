import { AppText } from '@/components/AppText';
import { borderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresenceStore, UserStatus } from '@/store/usePresenceStore';
import { Image } from 'expo-image';
import { Clock, Crown, Image as ImageIcon, MapPin, Rocket, ShieldCheck, Star, User } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export interface BeeSearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  jobsCompleted: number;
  coverImage?: string;
  distance: number; // in km
  travelTime: string; // e.g. "15 min"
  images?: string[];
  workHours?: string;
  offersInspection?: boolean;
  inspectionPrice?: number | string;
  location?: string;
  locationAddress?: string;
  clientRequirements?: string;
  agent: {
    id: string;
    name: string;
    isVerified: boolean;
    isOnline: boolean;
    avatar?: string;
    status: 'available' | 'booked' | 'offline';
    isAvailable: boolean;
    isBooked?: boolean;
    bookedDate?: string | null;
    bookedTime?: string | null;
    joinedAt?: string;
    achievements?: {
      earlyAccess: boolean;
      topRated: boolean;
      goldenBadge: boolean;
    };
  };
}

interface BeeSearchResultCardProps {
  item: BeeSearchResult;
  onPress: () => void;
}

export function BeeSearchResultCard({ item, onPress }: BeeSearchResultCardProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const presence = usePresenceStore(state => state.presences[item.agent.id]);
  const isOnline = presence?.status === UserStatus.ONLINE;
  
  // Real-time booking data from presence store
  const isBooked = presence?.isBooked ?? item.agent.isBooked;
  const bookedDate = presence?.bookedDate ?? item.agent.bookedDate;
  const bookedTime = presence?.bookedTime ?? item.agent.bookedTime;
  const isAvailable = presence?.isAvailable ?? item.agent.isAvailable;

  const getStatusInfo = () => {
    if (!isAvailable) return { label: 'OFFLINE', color: colors.textSecondary };
    
    if (isBooked) {
      // Check for "WORKING NOW" (within 30 mins of start time)
      try {
        if (bookedDate && bookedTime) {
          const now = new Date();
          const [year, month, day] = bookedDate.split('-').map(Number);
          const [hours, minutes] = bookedTime.split(':').map(Number);
          
          const bookingStart = new Date(year, month - 1, day, hours, minutes);
          const diffMs = Math.abs(now.getTime() - bookingStart.getTime());
          const diffMins = diffMs / (1000 * 60);
          
          if (diffMins <= 30) {
            return { label: 'WORKING NOW', color: colors.error };
          }
        }
      } catch (e) {
        // Fallback to BOOKED
      }
      
      const timeStr = bookedTime ? ` @ ${bookedTime.slice(0, 5)}` : '';
      return { label: `BOOKED${timeStr}`, color: colors.warning };
    }
    
    return { label: 'OPEN', color: colors.success };
  };

  const { label: statusLabel, color: badgeColor } = getStatusInfo();

  return (
    <Ripple
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
      rippleColor={colors.primary}
      rippleOpacity={0.1}
      onPress={onPress}
    >
      {/* Cover Image or Placeholder */}
      <View style={styles.imageContainer}>
        {item.coverImage ? (
          <Image 
            source={{ uri: item.coverImage }} 
            style={styles.coverImage} 
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.surface }]}>
            <ImageIcon size={48} color={colors.textSecondary} weight="light" />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge, 
          { backgroundColor: badgeColor }
        ]}>
            <AppText size="xs" variant="bold" color="#FFF">
                {statusLabel}
            </AppText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Header: Title & Rating */}
        <View style={styles.rowBetween}>
          <AppText variant="bold" size="md" style={styles.title} numberOfLines={1}>
            {item.title}
          </AppText>
          <View style={styles.ratingContainer}>
            <Star size={14} color={colors.warning} weight="fill" />
            <AppText variant="bold" size="sm" style={{ marginLeft: 4 }}>
              {item.rating}
            </AppText>
            <AppText size="xs" color={colors.textSecondary} style={{ marginLeft: 2 }}>
              ({item.jobsCompleted})
            </AppText>
          </View>
        </View>

        {/* Category & Travel Time */}
        <View style={[styles.row, { marginBottom: Spacing.sm }]}>
            <AppText size="xs" color={colors.primary} variant="medium" style={{ textTransform: 'uppercase' }}>
                {item.category}
            </AppText>
            <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
            
            <MapPin size={12} color={colors.textSecondary} weight="fill" />
            <AppText size="xs" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                {item.distance.toFixed(1)}km
            </AppText>

            <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />

            <Clock size={12} color={colors.textSecondary} />
            <AppText size="xs" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                ~ {item.travelTime} away
            </AppText>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Agent Info */}
        <View style={styles.agentRow}>
            <View style={styles.agentInfo}>
                 <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                    {item.agent.avatar ? (
                        <Image 
                            source={{ uri: item.agent.avatar }} 
                            style={styles.avatar} 
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <User size={18} color={colors.textSecondary} weight="bold" />
                    )}
                 </View>
                 <View style={{ marginLeft: 8 }}>
                    <View style={styles.row}>
                        <AppText variant="medium" size="sm">{item.agent.name}</AppText>
                        {item.agent.isVerified && (
                             <ShieldCheck size={14} color={colors.primary} weight="fill" style={{ marginLeft: 4 }} />
                        )}
                        {item.agent.achievements?.earlyAccess && (
                            <View style={[styles.achievementBadge, { backgroundColor: '#3B82F6' }]}>
                                <Rocket size={8} color="#FFF" weight="fill" />
                            </View>
                        )}
                        {item.agent.achievements?.topRated && (
                            <View style={[styles.achievementBadge, { backgroundColor: '#EAB308' }]}>
                                <Star size={8} color="#FFF" weight="fill" />
                            </View>
                        )}
                        {item.agent.achievements?.goldenBadge && (
                            <View style={[styles.achievementBadge, { backgroundColor: '#F59E0B' }]}>
                                <Crown size={8} color="#FFF" weight="fill" />
                            </View>
                        )}
                    </View>
                    <View style={styles.row}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? colors.success : '#D1D5DB' }} />
                        <AppText size="xs" color={isOnline ? colors.success : colors.textSecondary} style={{ marginLeft: 4 }}>
                            {isOnline ? 'Online' : 'Offline'}
                        </AppText>
                    </View>
                 </View>
            </View>
        </View>
      </View>
    </Ripple>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    padding: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
      flex: 1,
      marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      marginHorizontal: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  achievementBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  }
});
