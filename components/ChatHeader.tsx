import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getOptimizedImageUrl } from '@/utils/cloudinary';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CaretLeft, User } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface ChatHeaderProps {
    name: string;
    avatarUrl?: string;
    isOnline?: boolean;
    statusText?: string;
    rightAction?: React.ReactNode;
}

export function ChatHeader({ name, avatarUrl, isOnline, statusText, rightAction }: ChatHeaderProps) {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg }]}>
            <View style={styles.leftContainer}>
                <Ripple 
                    onPress={() => router.back()} 
                    style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    rippleCentered={true}
                    rippleContainerBorderRadius={20}
                >
                    <CaretLeft size={20} color={colors.text} weight="bold" />
                </Ripple>
                {avatarUrl ? (
                    <Image 
                        source={{ uri: getOptimizedImageUrl(avatarUrl, 80, 80) }} 
                        style={[styles.avatar, { borderColor: colors.border }]} 
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                        <User size={20} weight="bold" color={colors.textSecondary} />
                    </View>
                )}
                <View style={styles.infoContainer}>
                    <AppText variant="bold" size="lg" numberOfLines={1}>
                        {name || 'Chat'}
                    </AppText>
                    {statusText ? (
                        <AppText size="xs" color={statusText === 'Online' ? colors.success : colors.textSecondary}>
                            {statusText}
                        </AppText>
                    ) : (
                        isOnline !== undefined && (
                            <AppText size="xs" color={isOnline ? colors.success : colors.textSecondary}>
                                {isOnline ? 'Online' : 'Offline'}
                            </AppText>
                        )
                    )}
                </View>
            </View>
            {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    infoContainer: {
        justifyContent: 'center',
        flex: 1,
    },
    rightContainer: {
        marginLeft: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    }
});
