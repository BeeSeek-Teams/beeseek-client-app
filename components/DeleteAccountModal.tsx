import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WarningOctagon } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const DeleteAccountModal = ({ visible, onClose, onDelete }: DeleteAccountModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <WarningOctagon size={48} color={colors.error} weight="duotone" />
        </View>

        <AppText variant="bold" size="xl" style={styles.title}>
          Delete Account
        </AppText>

        <AppText color={colors.textSecondary} style={styles.message}>
          Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be lost.
        </AppText>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.button}
          />
          <AppButton
            title="Delete"
            variant="primary"
            onPress={() => {
              onClose();
              onDelete();
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
