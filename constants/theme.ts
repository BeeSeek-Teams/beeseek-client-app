const palette = {
  navy: {
    primary: '#031745',
    light: '#98B5F4',
    dark: '#050A17',
  },
  blue: {
    primary: '#0050B4',
    light: '#B2D1FF',
    dark: '#002454',
  },
  grey: {
    primary: '#6B7280',
    dark: '#2E2E2E',
    neutral: '#F8F9FA',
  },
  green: {
    primary: '#00C164',
    light: '#A6FFD3',
    dark: '#00331B',
  },
  orange: {
    primary: '#DE852C',
    light: '#FFD8B5',
    dark: '#552400',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = {
  light: {
    text: palette.navy.primary,
    textSecondary: palette.grey.primary,
    background: palette.white,
    surface: palette.grey.neutral,
    primary: palette.navy.primary,
    secondary: palette.blue.primary,
    success: palette.green.primary,
    warning: palette.orange.primary,
    error: '#FF3B30',
    border: '#E5E5E5',
    tint: palette.navy.primary,
    icon: palette.grey.primary,
    tabIconDefault: palette.grey.primary,
    tabIconSelected: palette.navy.primary,
  },
  dark: {
    text: palette.grey.neutral,
    textSecondary: palette.grey.primary,
    background: palette.navy.dark,
    surface: palette.grey.dark,
    primary: palette.navy.light,
    secondary: palette.blue.light,
    success: palette.green.primary,
    warning: palette.orange.primary,
    error: '#FF453A',
    border: palette.grey.dark,
    tint: palette.white,
    icon: palette.grey.neutral,
    tabIconDefault: palette.grey.neutral,
    tabIconSelected: palette.white,
  },
};

export const Typography = {
  fontFamily: 'PlusJakartaSans',
  weights: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};
