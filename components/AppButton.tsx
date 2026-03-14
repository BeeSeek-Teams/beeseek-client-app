import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  textColor?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
  textColor,
}) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.secondary },
          text: colors.background,
        };
      case 'outline':
        return {
          container: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary },
          text: colors.primary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: '#fff' },
          text: colors.primary,
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: colors.background,
        };
    }
  };

  const currentStyle = getStyles();

  return (
    <Ripple
      onPress={handlePress}
      disabled={disabled || loading}
      rippleColor={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.background}
      rippleDuration={400}
      rippleOpacity={0.1}
      style={[
        styles.button,
        currentStyle.container,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={currentStyle.text} />
      ) : (
        <>
          {icon && <View style={{ marginRight: Spacing.sm }}>{icon}</View>}
          <AppText
            variant="semiBold"
            size="md"
            style={{ color: textColor || currentStyle.text }}
          >
            {title}
          </AppText>
        </>
      )}
    </Ripple>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});
