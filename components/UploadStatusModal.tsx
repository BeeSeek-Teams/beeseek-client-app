import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

interface UploadStatusModalProps {
  visible: boolean;
  status: 'optimizing' | 'uploading' | 'complete' | 'error';
  onCancel?: () => void;
  canCancel?: boolean;
}

export const UploadStatusModal = ({
  visible,
  status,
  onCancel,
  canCancel = true,
}: UploadStatusModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const getMessage = () => {
    switch (status) {
      case 'optimizing':
        return 'Optimizing image...';
      case 'uploading':
        return 'Uploading to secure server...';
      case 'complete':
        return 'Success!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      // Prevent closing via back button on Android
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          
          <AppText style={styles.message} variant="bold" size="lg">
            {getMessage()}
          </AppText>
          
          <AppText style={styles.subMessage} variant="regular">
            {status === 'optimizing' 
                ? 'We are preparing your image for high speed delivery.' 
                : 'This may take a moment depending on your connection.'}
          </AppText>

          {canCancel && onCancel && (
            <AppButton
              title="Cancel Process"
              variant="outline"
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={status === 'complete'}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  container: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  message: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  subMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    width: '100%',
  },
});
