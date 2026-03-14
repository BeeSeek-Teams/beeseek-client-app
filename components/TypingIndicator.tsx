import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface TypingIndicatorProps {
  style?: ViewStyle;
}

export const TypingIndicator = ({ style }: TypingIndicatorProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    pulse(opacity1, 0);
    pulse(opacity2, 200);
    pulse(opacity3, 400);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: opacity1 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: opacity2 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: opacity3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
    width: 54,
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
