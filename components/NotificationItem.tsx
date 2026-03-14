import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Bell, ChatCircle, CreditCard, Info, Tag } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export type NotificationType = 'system' | 'message' | 'promo' | 'job' | 'payment';

export interface NotificationItemProps {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    onPress?: () => void;
}

export function NotificationItem({ type, title, message, time, isRead, onPress }: NotificationItemProps) {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    const getIcon = () => {
        switch(type) {
            case 'message': return <ChatCircle size={20} color={colors.primary} weight="fill" />;
            case 'job': return <Bell size={20} color={colors.secondary} weight="fill" />;
            case 'promo': return <Tag size={20} color={colors.warning} weight="fill" />;
            case 'payment': return <CreditCard size={20} color={colors.success} weight="fill" />;
            default: return <Info size={20} color={colors.textSecondary} weight="fill" />;
        }
    };

    const getIconBg = () => {
        switch(type) {
            case 'message': return colors.primary + '15';
            case 'job': return colors.secondary + '15';
            case 'promo': return colors.warning + '15';
            case 'payment': return colors.success + '15';
            default: return colors.surface;
        }
    };

    return (
        <Ripple 
            style={[
                styles.container, 
                { 
                    backgroundColor: isRead ? 'transparent' : colors.surface,
                    borderColor: colors.border,
                    borderBottomWidth: 1, // List style
                    // borderBottomColor: colors.border // handled in style prop 
                }
            ]} 
            onPress={onPress}
            rippleColor={colors.primary}
            rippleOpacity={0.1}
        >
            <View style={[styles.iconBox, { backgroundColor: getIconBg() }]}>
                {getIcon()}
            </View>
            
            <View style={styles.content}>
                <View style={styles.header}>
                    <AppText variant="bold" size="md" style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {title}
                    </AppText>
                    {!isRead && <View style={[styles.dot, { backgroundColor: colors.error }]} />}
                </View>
                <AppText size="sm" color={colors.textSecondary} numberOfLines={2} style={{ marginBottom: 4 }}>
                    {message}
                </AppText>
                <AppText size="xs" color={colors.textSecondary} variant="medium">
                    {time}
                </AppText>
            </View>
        </Ripple>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
