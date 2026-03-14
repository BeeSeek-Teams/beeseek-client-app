import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

interface AppTextProps extends TextProps {
  variant?: 'regular' | 'medium' | 'semiBold' | 'bold';
  size?: keyof typeof Typography.sizes;
  color?: string;
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'regular',
  size = 'md',
  color,
  align = 'left',
  style,
  ...props
}) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  
  const textStyle: TextStyle = {
    fontFamily: Typography.weights[variant],
    fontSize: Typography.sizes[size],
    color: color || Colors[colorScheme].text,
    textAlign: align,
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};
