import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Image, Modal, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

interface MediaPreviewModalProps {
  visible: boolean;
  uri: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

export const MediaPreviewModal = ({
  visible,
  uri,
  onConfirm,
  onCancel,
  title = 'Preview Image',
}: MediaPreviewModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <AppText variant="bold" size="lg">
              {title}
            </AppText>
          </View>

          <View style={styles.previewContainer}>
            <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
          </View>

          <View style={styles.footer}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.button}
            />
            <View style={{ width: Spacing.md }} />
            <AppButton
              title="Upload"
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  previewContainer: {
    aspectRatio: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
  },
});
