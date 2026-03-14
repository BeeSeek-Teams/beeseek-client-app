import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignOut } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export const SignOutModal = ({ visible, onClose, onSignOut }: SignOutModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <SignOut size={48} color={colors.error} weight="duotone" />
        </View>

        <AppText variant="bold" size="xl" style={styles.title}>
          Sign Out
        </AppText>

        <AppText color={colors.textSecondary} style={styles.message}>
          Are you sure you want to sign out of your account? You will need to sign in again to access your data.
        </AppText>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.button}
          />
          <AppButton
            title="Sign Out"
            variant="primary"
            onPress={() => {
              onClose();
              onSignOut();
            }}
            style={[styles.button, { backgroundColor: colors.error, borderColor: colors.error }]}
          />
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
