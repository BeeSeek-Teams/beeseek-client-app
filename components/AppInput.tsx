import { Colors, Spacing, Typography, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Eye, EyeSlash } from 'phosphor-react-native';
import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  isPassword = false,
  leftIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
          },
          props.multiline && { height: 'auto', minHeight: 58, paddingVertical: 12 },
          focusAnimatedStyle,
          isFocused && !error && styles.focusedShadow,
          error && styles.errorShadow,
        ]}
      >
        {leftIcon && (
          <View style={{ marginRight: Spacing.sm }}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={[
            // Default input style first
            styles.input,
            props.style,
            {
              color: colors.text,
              fontFamily: Typography.weights.regular,
              paddingRight: isPassword ? Spacing['2xl'] : 0,
            },
          ]}
          placeholderTextColor={colors.textSecondary + '80'}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        secureTextEntry={isPassword && !showPassword}
        selectionColor={colors.primary}
        {...props}
      />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconContainer}
          >
            {showPassword ? (
              <EyeSlash 
                size={22} 
                color={error ? colors.error : isFocused ? colors.primary : colors.textSecondary} 
                weight="bold" 
              />
            ) : (
              <Eye 
                size={22} 
                color={error ? colors.error : isFocused ? colors.primary : colors.textSecondary} 
                weight="bold" 
              />
            )}
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <AppText size="xs" color={colors.error} style={styles.error} variant="medium">
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  inputContainer: {
    height: 58,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  focusedShadow: {
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorShadow: {
    shadowColor: Colors.light.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  iconContainer: {
    padding: Spacing.xs,
    position: 'absolute',
    right: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
  },
  error: {
    marginTop: Spacing.xs,
    marginLeft: 8,
  },
});
