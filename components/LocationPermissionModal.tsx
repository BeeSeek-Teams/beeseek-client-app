import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MapPin, ShieldCheck } from 'phosphor-react-native';
import React from 'react';
import { Linking, Modal, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface LocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationPermissionModal({ visible, onClose }: LocationPermissionModalProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const handleOpenSettings = () => {
    Linking.openSettings();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.glow, { backgroundColor: colors.primary + '20' }]} />
            <MapPin size={48} color={colors.primary} weight="duotone" />
          </View>
          
          <AppText variant="bold" size="xl" style={styles.title} align="center">
            Enable Location Services
          </AppText>
          
          <AppText color={colors.textSecondary} align="center" style={styles.description}>
            BeeSeek uses your location to find the nearest service providers (Bees) and track active hires in real-time. This ensures faster response times and reliable service.
          </AppText>

          <View style={styles.featureList}>
             <View style={styles.featureItem}>
                <ShieldCheck size={18} color={colors.success} weight="fill" />
                <AppText size="sm" style={{ marginLeft: 8 }}>Used only while the app is active</AppText>
             </View>
          </View>

          <AppButton 
            title="Open Settings" 
            onPress={handleOpenSettings}
            style={styles.button}
          />
          
          <Ripple 
            onPress={onClose} 
            style={styles.skipButton}
            rippleColor={colors.primary}
            rippleContainerBorderRadius={8}
          >
            <AppText color={colors.textSecondary} variant="medium">Not Now</AppText>
          </Ripple>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  container: {
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    marginBottom: Spacing.md,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  skipButton: {
    padding: Spacing.sm,
  },
});
