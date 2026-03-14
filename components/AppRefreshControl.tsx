import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';

export const AppRefreshControl = (props: RefreshControlProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <RefreshControl
      tintColor={colors.primary}
      colors={[colors.primary]} // Android
      progressBackgroundColor={colors.background} // Android
      {...props}
    />
  );
};
