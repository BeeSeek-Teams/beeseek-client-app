import { Colors, Spacing, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { X } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import {
    DimensionValue,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  height?: DimensionValue;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AppModal = ({
  visible,
  onClose,
  title,
  children,
  footer,
  height,
}: AppModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }} 
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}
        >
          <View 
            style={[
              styles.content,
              {
                backgroundColor: colors.background,
                maxHeight: SCREEN_HEIGHT * 0.9,
                height: height,
                minHeight: height ? undefined : 150,
              },
            ]}
          >
            {title || onClose ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {title && (
                    <AppText variant="semiBold" size="xl">
                      {title}
                    </AppText>
                  )}
                </View>
                <Ripple 
                  onPress={onClose} 
                  style={styles.closeBtn}
                  rippleCentered={true}
                  rippleContainerBorderRadius={20}
                >
                  <X size={24} color={colors.text} />
                </Ripple>
              </View>
            ) : null}

            <View style={[styles.body, height ? { flex: 1 } : { flex: 0 }]}>{children}</View>

            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingBottom: Spacing.xl,
    width: '100%',
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerText: {
    flex: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    padding: Spacing.lg,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});
