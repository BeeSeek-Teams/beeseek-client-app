import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, showBackButton = true, rightAction }: ScreenHeaderProps) {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: Spacing.lg }]}>
            <View style={[styles.leftContainer, { flex: 1 }]}>
                {showBackButton && (
                    <Ripple 
                        onPress={() => router.back()} 
                        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        rippleCentered={true}
                        rippleColor={colors.text}
                        rippleContainerBorderRadius={20}
                    >
                        <CaretLeft size={20} color={colors.text} weight="bold" />
                    </Ripple>
                )}
                <AppText 
                    variant="bold" 
                    size="xl" 
                    numberOfLines={1}
                    style={{ marginLeft: showBackButton ? 12 : 0, flex: 1 }}
                >
                    {title}
                </AppText>
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
        paddingVertical: Spacing.md,
        zIndex: 10,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    rightContainer: {
        marginLeft: Spacing.md,
    }
});
