import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeshBackground } from './MeshBackground';

interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  disablePadding?: boolean;
  withMesh?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  backgroundColor,
  statusBarStyle = 'auto',
  edges = ['top', 'bottom'],
  disablePadding = false,
  withMesh = false,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  
  const finalBackgroundColor = backgroundColor || Colors[colorScheme].background;
  
  const content = (
    <>
      <StatusBar
        barStyle={
          statusBarStyle === 'auto'
            ? colorScheme === 'dark'
              ? 'light-content'
              : 'dark-content'
            : statusBarStyle === 'light'
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor="transparent"
        translucent
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: edges.includes('top') ? insets.top : 0,
            paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
            paddingLeft: edges.includes('left') ? insets.left : 0,
            paddingRight: edges.includes('right') ? insets.right : 0,
          },
          !disablePadding && { paddingHorizontal: Spacing.lg },
          style,
        ]}
      >
        {children}
      </View>
    </>
  );

  if (withMesh) {
    return (
      <MeshBackground isDark={colorScheme === 'dark'} style={styles.container}>
        {content}
      </MeshBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: finalBackgroundColor }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
