import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RocketLaunch, WarningCircle } from 'phosphor-react-native';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

interface AppUpdateModalProps {
  visible: boolean;
  type: 'optional' | 'forced' | 'maintenance';
  latestVersion?: string;
  message?: string;
  updateUrl?: string;
  onClose: () => void;
}

export const AppUpdateModal = ({
  visible,
  type,
  latestVersion,
  message,
  updateUrl,
  onClose,
}: AppUpdateModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const handleUpdate = () => {
    if (updateUrl) {
      Linking.openURL(updateUrl);
    }
  };

  const isMaintenance = type === 'maintenance';
  const isForced = type === 'forced';

  return (
    <AppModal 
      visible={visible} 
      onClose={isForced || isMaintenance ? () => {} : onClose}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: isMaintenance ? colors.error + '15' : colors.primary + '15' }]}>
           {isMaintenance ? (
             <WarningCircle size={48} color={colors.error} weight="fill" />
           ) : (
             <RocketLaunch size={48} color={colors.primary} weight="fill" />
           )}
        </View>

        <AppText variant="bold" size="xl" align="center" style={styles.title}>
          {isMaintenance ? 'System Maintenance' : isForced ? 'Update Required' : 'New Version Available'}
        </AppText>

        <AppText align="center" color={colors.textSecondary} style={styles.message}>
          {message || (isMaintenance 
            ? "We're currently performing scheduled maintenance to improve our service. Please check back shortly." 
            : `Version ${latestVersion} is out! Update now to enjoy the latest features and security improvements.`)}
        </AppText>

        <View style={styles.actions}>
           {!isMaintenance && (
             <AppButton 
                title="Update Now" 
                onPress={handleUpdate} 
                style={styles.button}
             />
           )}
           
           {!isForced && !isMaintenance && (
             <AppButton 
                title="Later" 
                variant="outline" 
                onPress={onClose} 
                style={styles.button}
             />
           )}

           {isMaintenance && (
             <AppButton 
                title="Understood" 
                onPress={onClose} 
                style={styles.button}
             />
           )}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  message: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  }
});
