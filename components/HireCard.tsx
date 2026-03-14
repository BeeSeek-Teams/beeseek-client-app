import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Briefcase, CalendarBlank, Clock, MagnifyingGlass, User } from 'phosphor-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export type HireStatus = 'late' | 'soon' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled';
export type JobType = 'task' | 'inspection';

interface HireCardProps {
  title: string;
  otherPartyName: string; // The Name of the Client or Bee
  date: string;
  startTime: string;
  type: JobType;
  status: HireStatus;
  style?: any;
  onPress?: () => void;
}

export function HireCard({ 
    title, 
    otherPartyName, 
    date, 
    startTime, 
    type, 
    status,
    style,
    onPress 
}: HireCardProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (status === 'in_progress') {
      pulseValue.value = withRepeat(withTiming(0.5, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = 1;
    }
  }, [status]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
  }));

  const getStatusColor = (s: HireStatus) => {
      switch(s) {
          case 'in_progress': return colors.success;
          case 'soon': return colors.warning;
          case 'late': return colors.error;
          case 'completed': return colors.success;
          case 'cancelled': return colors.error;
          default: return colors.textSecondary;
      }
  };
  
  const getStatusLabel = (s: HireStatus) => {
      switch(s) {
          case 'in_progress': return 'LIVE';
          case 'soon': return 'Up Next';
          case 'late': return 'Delayed';
          case 'completed': return 'Completed';
          case 'cancelled': return 'Cancelled';
          default: return 'Scheduled';
      }
  };

  const statusColor = getStatusColor(status);
  const isInspection = type === 'inspection';
  const isOngoing = status === 'in_progress';

  return (
    <Ripple 
        style={[
            styles.card, 
            { 
                backgroundColor: isOngoing ? colors.success + '05' : colors.surface, 
                borderColor: isOngoing ? colors.success : colors.border,
                borderLeftWidth: isOngoing ? 6 : 1
            }, 
            style
        ]}
        onPress={onPress}
        rippleColor={colors.primary}
        rippleOpacity={0.1}
    >
        {/* Header: Tags */}
        <View style={styles.header}>
            <View style={[
                styles.tag, 
                { backgroundColor: isInspection ? colors.secondary + '10' : colors.primary + '10' }
            ]}>
                {isInspection ? 
                    <MagnifyingGlass size={14} color={colors.secondary} weight="bold"/> : 
                    <Briefcase size={14} color={colors.primary} weight="bold"/>
                }
                <AppText 
                    size="xs" 
                    variant="bold" 
                    color={isInspection ? colors.secondary : colors.primary} 
                    style={{ marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                    {type}
                </AppText>
            </View>

            {status !== 'scheduled' && (
                <View style={[
                    styles.statusTag, 
                    { 
                        backgroundColor: isOngoing ? colors.success : 'transparent',
                        borderColor: isOngoing ? colors.success : statusColor 
                    }
                ]}>
                    {isOngoing ? (
                        <Animated.View style={[styles.statusDot, { backgroundColor: '#FFF' }, pulseStyle]} />
                    ) : (
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    )}
                    <AppText 
                        size="xs" 
                        variant="bold" 
                        color={isOngoing ? '#FFF' : statusColor} 
                        style={{ marginLeft: 6 }}
                    >
                        {getStatusLabel(status)}
                    </AppText>
                </View>
            )}
        </View>

        {/* Content */}
        <View style={styles.content}>
            <AppText variant="bold" size="lg" style={{ marginBottom: 6 }} numberOfLines={2}>{title}</AppText>
             <View style={styles.row}>
                <View style={[styles.avatarMini, { backgroundColor: colors.textSecondary + '20' }]}>
                    <User size={12} color={colors.textSecondary} weight="bold" />
                </View>
                <AppText color={colors.textSecondary} variant="medium" size="sm" style={{ marginLeft: 8 }}>
                    {otherPartyName}
                </AppText>
             </View>
        </View>
        
        {/* Footer: Date & Time */}
        <View style={[
            styles.footer, 
            { 
                backgroundColor: isOngoing ? colors.success + '10' : colors.background,
                borderTopColor: colors.border,
                borderTopWidth: isOngoing ? 0 : 1
            }
        ]}>
            <View style={styles.row}>
                <CalendarBlank size={16} color={colors.textSecondary} weight="bold" />
                <AppText size="sm" variant="semiBold" style={{ marginLeft: 6 }}>{date}</AppText>
            </View>
            <View style={styles.row}>
                <Clock size={16} color={colors.textSecondary} weight="bold" />
                <AppText size="sm" variant="semiBold" style={{ marginLeft: 6 }}>
                    {startTime}
                </AppText>
            </View>
        </View>
    </Ripple>
  );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    avatarMini: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.md,
    }
});
