import { Colors, Spacing, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface AppLoaderProps {
  visible: boolean;
  message?: string;
  overlay?: boolean;
}

export const AppLoader = ({ visible, message, overlay = true }: AppLoaderProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  if (!visible) return null;

  const content = (
    <View style={overlay ? styles.overlay : styles.inline}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <AppText style={styles.message} variant="medium">
            {message}
          </AppText>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: Spacing.md,
  },
});
