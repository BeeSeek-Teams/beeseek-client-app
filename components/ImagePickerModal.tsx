import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Camera, Image as ImageIcon, X } from 'phosphor-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: 'camera' | 'library') => void;
  title?: string;
}

export const ImagePickerModal = ({ visible, onClose, onSelect, title = 'Select Image Source' }: ImagePickerModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
      >
        <Pressable 
          style={[styles.container, { backgroundColor: colors.surface }]}
          onPress={(e) => {
            // Inner pressable handles touches to container
          }}
        >
          <View style={styles.header}>
            <AppText variant="bold" size="lg">{title}</AppText>
            <Ripple 
              onPress={onClose} 
              rippleContainerBorderRadius={20}
              style={{ padding: Spacing.xs }}
            >
              <X size={24} color={colors.text} />
            </Ripple>
          </View>

          <View style={styles.options}>
            <Ripple 
              style={[styles.option, { borderBottomColor: colors.border }]} 
              onPress={() => {
                console.log('[ImagePickerModal] Camera selected');
                onSelect('camera');
              }}
              rippleColor={colors.primary}
              rippleOpacity={0.1}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <Camera size={24} color={colors.primary} weight="bold" />
              </View>
              <AppText variant="medium" style={{ flex: 1 }}>Take Photo</AppText>
            </Ripple>

            <Ripple 
               style={styles.option} 
               onPress={() => {
                 console.log('[ImagePickerModal] Library selected');
                 onSelect('library');
               }}
               rippleColor={colors.secondary}
               rippleOpacity={0.1}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
                <ImageIcon size={24} color={colors.secondary} weight="bold" />
              </View>
              <AppText variant="medium" style={{ flex: 1 }}>Choose from Gallery</AppText>
            </Ripple>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  options: {
    padding: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
});
