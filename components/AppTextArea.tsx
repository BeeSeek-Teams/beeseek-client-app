import { Colors, Spacing, Typography, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

interface AppTextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minHeight?: number;
  leftIcon?: React.ReactNode;
}

export const AppTextArea: React.FC<AppTextAreaProps> = ({
  label,
  error,
  containerStyle,
  minHeight = 120,
  leftIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const focusAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        error ? colors.error : isFocused ? colors.primary : colors.border
      ),
      borderWidth: withTiming(isFocused || error ? 1.5 : 1),
      transform: [{ scale: withTiming(isFocused ? 1.01 : 1) }],
    };
  }, [isFocused, error, colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <AppText 
          variant="semiBold" 
          size="sm" 
          style={styles.label} 
          color={error ? colors.error : isFocused ? colors.primary : colors.text}
        >
          {label}
        </AppText>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused ? colors.background : colors.surface,
            minHeight: minHeight,
            paddingVertical: 12,
            alignItems: 'flex-start',
          },
          focusAnimatedStyle,
          isFocused && !error && styles.focusedShadow,
          error && styles.errorShadow,
        ]}
      >
        {leftIcon && (
          <View style={{ marginRight: Spacing.sm, marginTop: 4 }}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            props.style,
            {
              color: colors.text,
              fontFamily: Typography.weights.regular,
              textAlignVertical: 'top', // Android support
              height: '100%',
              width: '100%',
            },
          ]}
          multiline={true}
          placeholderTextColor={colors.textSecondary + '80'}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          selectionColor={colors.primary}
          {...props}
        />
      </Animated.View>
      {error && (
        <AppText size="xs" color={colors.error} style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    paddingTop: 0, // Match the paddingVertical: 12 of container
    minHeight: 100,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  focusedShadow: {
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorShadow: {
    shadowColor: Colors.light.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
