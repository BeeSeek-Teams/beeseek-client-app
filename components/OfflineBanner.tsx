import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { Warning, WifiSlash } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

type BannerState = 'hidden' | 'offline' | 'slow';

export function OfflineBanner() {
    const [bannerState, setBannerState] = useState<BannerState>('hidden');
    const [isVisible, setIsVisible] = useState(false);
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            let newState: BannerState = 'hidden';

            if (state.isConnected === false) {
                newState = 'offline';
            } else if (state.isInternetReachable === false) {
                newState = 'offline';
            } else if (
                state.type === NetInfoStateType.cellular &&
                state.details?.cellularGeneration &&
                ['2g', '3g'].includes(state.details.cellularGeneration)
            ) {
                newState = 'slow';
            }

            setBannerState(newState);
            const shouldShow = newState !== 'hidden';
            
            if (shouldShow) {
                setIsVisible(true);
            }

            Animated.timing(animatedValue, {
                toValue: shouldShow ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished && !shouldShow) {
                    setIsVisible(false);
                }
            });
        });

        return () => unsubscribe();
    }, []);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
    });

    if (!isVisible) return null;

    const isOffline = bannerState === 'offline';
    const bgColor = isOffline ? colors.error : '#F59E0B'; // amber for slow

    return (
        <Animated.View style={[
            styles.container, 
            { 
                backgroundColor: bgColor, 
                transform: [{ translateY }],
                paddingTop: insets.top > 0 ? insets.top : 10
            }
        ]}>
            <View style={styles.content}>
                {isOffline ? (
                    <WifiSlash size={20} color="#fff" weight="bold" />
                ) : (
                    <Warning size={20} color="#fff" weight="bold" />
                )}
                <AppText color="#fff" variant="bold" size="sm" style={{ marginLeft: 8 }}>
                    {isOffline ? 'No Internet Connection' : 'Slow Connection — requests may take longer'}
                </AppText>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    }
});
