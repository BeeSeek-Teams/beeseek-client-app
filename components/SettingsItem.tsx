import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CaretRight } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface SettingsItemProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  showChevron?: boolean;
  color?: string;
  isDestructive?: boolean;
}

export function SettingsItem({
  label,
  icon,
  onPress,
  showChevron = true,
  color,
  isDestructive = false,
}: SettingsItemProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const textColor = color || (isDestructive ? colors.error : colors.text);

  return (
    <Ripple
      onPress={onPress}
      rippleColor={isDestructive ? colors.error : colors.primary}
      rippleOpacity={0.1}
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <AppText variant="medium" size="md" color={textColor}>
          {label}
        </AppText>
      </View>
      
      {showChevron && !isDestructive && (
        <CaretRight size={20} color={colors.textSecondary} weight="bold" />
      )}
    </Ripple>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Spacing.md,
    width: 28,
    alignItems: 'center',
  },
});
