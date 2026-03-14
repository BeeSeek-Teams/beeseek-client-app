import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CheckCircle, Info, Warning, WarningOctagon } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AppAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  cancelText?: string;
}

export const AppAlert = ({
  visible,
  type = 'info',
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  showCancel = false,
  onCancel,
  cancelText = 'Cancel',
}: AppAlertProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} color={colors.success} weight="fill" />;
      case 'warning':
        return <Warning size={48} color={colors.warning} weight="fill" />;
      case 'error':
        return <WarningOctagon size={48} color={colors.error} weight="fill" />;
      default:
        return <Info size={48} color={colors.primary} weight="fill" />;
    }
  };

  return (
    <AppModal visible={visible} onClose={showCancel ? (onCancel || onConfirm) : onConfirm}>
      <View style={[styles.container, { paddingBottom: Spacing.xl }]}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        
        <AppText variant="bold" size="xl" align="center" style={styles.title}>
          {title}
        </AppText>
        
        <AppText align="center" color={colors.textSecondary} style={styles.message}>
          {message}
        </AppText>

        <View style={styles.actions}>
          {showCancel && (
            <AppButton
              title={cancelText}
              variant="outline"
              onPress={onCancel || onConfirm}
              style={styles.button}
            />
          )}
          <AppButton
            title={confirmText}
            onPress={onConfirm}
            style={[styles.button, showCancel && styles.confirmButton]}
          />
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
  },
  confirmButton: {
    marginLeft: Spacing.md,
  },
});
