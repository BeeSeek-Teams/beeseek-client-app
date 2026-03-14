import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatStore } from '@/store/useChatStore';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../AppText';

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { totalUnreadCount } = useChatStore();
  const [width, setWidth] = React.useState(0);
  
  const translateX = useSharedValue(0);
  const tabWidth = width / state.routes.length;

  useEffect(() => {
    if (width > 0) {
      translateX.value = withSpring(state.index * tabWidth, {
        stiffness: 150,
        damping: 20,
        mass: 1,
      });
    }
  }, [state.index, width, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background, 
      borderTopColor: colors.border,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom : Spacing.md,
      height: (Platform.OS === 'ios' ? 50 : 70) + (Platform.OS === 'ios' ? insets.bottom : 0)
    }]} onLayout={onLayout}>
      
      {/* Sliding Dot Indicator */}
      {width > 0 && (
        <Animated.View style={[
          styles.indicatorContainer, 
          { width: tabWidth }, 
          animatedStyle
        ]}>
          <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        </Animated.View>
      )}

      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              // testID={options.tabBarTestID} // REMOVED: Property does not exist on type
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem]}
            >
              <View>
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? colors.tabIconSelected : colors.tabIconDefault,
                  size: 24,
                })}
                {route.name === 'chat' && totalUnreadCount > 0 && (
                  <View style={styles.badge} />
                )}
              </View>
               {/* Optional: Add Label if you want labels, looking at layout they had labels */}
               <AppText
                style={{
                   fontSize: 10,
                   fontFamily: Typography.weights.medium,
                   color: isFocused ? colors.tabIconSelected : colors.tabIconDefault,
                   marginTop: 4
                }}
              >
                {label as string}
              </AppText> 
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  indicatorContainer: {
    position: 'absolute',
    top: -1, 
    left: 0,
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  indicator: {
    width: 20, 
    height: 3,
    borderRadius: 1.5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
