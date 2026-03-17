import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { securityService } from '@/services/security.service';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Backspace, CheckCircle, Fingerprint, ShieldPlus, X } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

interface SecurityPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin?: string) => void;
  title?: string;
  useBiometrics?: boolean;
  /** When provided, enables "no PIN" detection. If user has no PIN, shows a CTA instead of the numpad. */
  onSetPin?: () => void;
}

export const SecurityPinModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  title = 'Enter Transaction PIN',
  useBiometrics = false,
  onSetPin,
}: SecurityPinModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [noPinSet, setNoPinSet] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setPin('');
      setBiometricSuccess(false);
      setNoPinSet(false);

      // If onSetPin is provided, check if user has a PIN before showing numpad
      if (onSetPin) {
        setCheckingPin(true);
        securityService.getStatus()
          .then((data) => {
            if (!data.hasPin) {
              setNoPinSet(true);
            } else if (useBiometrics) {
              handleBiometrics();
            }
          })
          .catch(() => {
            // On error, proceed normally — let the backend reject if no PIN
            if (useBiometrics) handleBiometrics();
          })
          .finally(() => setCheckingPin(false));
      } else {
        if (useBiometrics) {
          handleBiometrics();
        }
      }
    }
  }, [visible]);

  const handleBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to proceed',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: false,
        });

        if (result.success) {
          const savedPin = await SecureStore.getItemAsync('user_transaction_pin');
          if (savedPin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setBiometricSuccess(true); // Hide PIN UI immediately
            onSuccess(savedPin);
          } else {
            // PIN not saved locally - user needs to enter it manually
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const onPressNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          onSuccess(newPin);
          setPin('');
        }, 100);
      }
    }
  };

  const onPressBackspace = () => {
    setPin(pin.slice(0, -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderDot = (index: number) => {
    const isFilled = pin.length > index;
    return (
      <View 
        key={index} 
        style={[
          styles.dot, 
          { 
            backgroundColor: isFilled ? colors.primary : colors.border,
            transform: [{ scale: isFilled ? 1.2 : 1 }]
          }
        ]} 
      />
    );
  };

  const NumberButton = ({ val }: { val: string }) => (
    <Ripple
      onPress={() => onPressNumber(val)}
      style={[styles.numBtn, { backgroundColor: colors.surface }]}
      rippleColor={colors.primary}
      rippleContainerBorderRadius={40}
    >
      <AppText variant="bold" size="xl">{val}</AppText>
    </Ripple>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[
          styles.content, 
          { 
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
            paddingTop: insets.top > 0 ? insets.top : Spacing.md
          }
        ]}>
          <View style={styles.header}>
            <Ripple 
              onPress={onClose} 
              style={styles.closeBtn}
              rippleCentered
              rippleContainerBorderRadius={20}
            >
              <X size={24} color={colors.text} />
            </Ripple>
            <AppText variant="bold" size="lg" style={{ textAlign: 'center' }}>{title}</AppText>
            <View style={{ width: 40 }} />
          </View>

          {checkingPin ? (
            <View style={styles.successContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText size="sm" color={colors.textSecondary} style={{ marginTop: Spacing.md }}>Checking PIN status...</AppText>
            </View>
          ) : noPinSet ? (
            <View style={styles.successContainer}>
              <View style={[styles.noPinIcon, { backgroundColor: colors.primary + '15' }]}>
                <ShieldPlus size={56} color={colors.primary} weight="duotone" />
              </View>
              <AppText variant="bold" size="lg" style={{ marginTop: Spacing.lg, textAlign: 'center' }}>
                No Transaction PIN Set
              </AppText>
              <AppText size="sm" color={colors.textSecondary} style={{ marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
                You need a 4-digit transaction PIN to make payments. It only takes a moment to set up.
              </AppText>
              <Ripple
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSetPin?.();
                }}
                style={[styles.setPinBtn, { backgroundColor: colors.primary }]}
                rippleColor="#fff"
              >
                <ShieldPlus size={20} color="#fff" weight="bold" style={{ marginRight: 8 }} />
                <AppText variant="bold" size="md" color="#fff">Set Transaction PIN</AppText>
              </Ripple>
            </View>
          ) : biometricSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircle size={64} color={colors.success || colors.primary} weight="fill" />
              <AppText variant="bold" size="lg" style={{ marginTop: Spacing.md }}>Authenticated</AppText>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.md }} />
            </View>
          ) : (
            <>
              <View style={styles.pinContainer}>
                <View style={styles.dotsRow}>
                  {[0, 1, 2, 3].map(renderDot)}
                </View>
              </View>

              <View style={styles.numpad}>
            <View style={styles.numRow}>
              <NumberButton val="1" />
              <NumberButton val="2" />
              <NumberButton val="3" />
            </View>
            <View style={styles.numRow}>
              <NumberButton val="4" />
              <NumberButton val="5" />
              <NumberButton val="6" />
            </View>
            <View style={styles.numRow}>
              <NumberButton val="7" />
              <NumberButton val="8" />
              <NumberButton val="9" />
            </View>
            <View style={styles.numRow}>
              <Ripple 
                style={styles.numBtn} 
                onPress={handleBiometrics}
                disabled={!useBiometrics}
                rippleCentered
                rippleContainerBorderRadius={40}
              >
                {useBiometrics && <Fingerprint size={32} color={colors.primary} />}
              </Ripple>
              <NumberButton val="0" />
              <Ripple 
                style={styles.numBtn} 
                onPress={onPressBackspace}
                rippleCentered
                rippleContainerBorderRadius={40}
              >
                <Backspace size={32} color={colors.text} />
              </Ripple>
            </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '65%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  closeBtn: {
    padding: 8,
  },
  pinContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  numpad: {
    paddingHorizontal: 30,
    gap: 15,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPinIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: Spacing.xl,
  },
});
