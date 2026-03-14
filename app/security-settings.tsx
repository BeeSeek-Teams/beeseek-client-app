import { AppAlert } from '@/components/AppAlert';
import { AppLoader } from '@/components/AppLoader';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecurityPinModal } from '@/components/SecurityPinModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { securityService } from '@/services/security.service';
import { useAuthStore } from '@/store/useAuthStore';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Fingerprint, Key } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function SecuritySettingsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [status, setStatus] = useState({ hasPin: false, biometricsEnabled: false });
  const { user, updateUser } = useAuthStore();
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as any });

  const showAlert = (title: string, message: string, type: string = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await securityService.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          showAlert('Not Available', 'Biometric authentication is not set up on this device.', 'warning');
          return;
        }

        // We need to verify the PIN once to save it locally for biometrics to work
        setPinMode('verify');
        setIsPinModalVisible(true);
      } else {
        setIsActionLoading(true);
        await securityService.toggleBiometrics(false);
        setStatus(prev => ({ ...prev, biometricsEnabled: false }));
        if (user) {
          updateUser({ ...user, useBiometrics: false });
        }
        await SecureStore.deleteItemAsync('user_transaction_pin');
      }
    } catch (error: any) {
      console.error('Failed to toggle biometrics:', error);
      showAlert('Error', error?.response?.data?.message || 'Failed to update biometric settings.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const onPinSuccess = async (pin?: string) => {
    setIsPinModalVisible(false);
    if (!pin) return;

    try {
      if (pinMode === 'set') {
        if (!tempPin) {
          // Confirm PIN flow
          setTempPin(pin);
          setTimeout(() => {
            setPinMode('set');
            setIsPinModalVisible(true);
          }, 500);
        } else {
          if (pin === tempPin) {
            setIsActionLoading(true);
            await securityService.setPin(pin);
            await SecureStore.setItemAsync('user_transaction_pin', pin);
            showAlert('Success', 'Transaction PIN set successfully.', 'success');
            setTempPin(null);
            await fetchStatus();
          } else {
            showAlert('Mismatch', 'PINs do not match. Please try again.', 'error');
            setTempPin(null);
          }
        }
      } else if (pinMode === 'verify') {
        // Verify with backend
        setIsActionLoading(true);
        await securityService.verifyPin(pin);
        // If successful (didn't throw), save locally and toggle
        await SecureStore.setItemAsync('user_transaction_pin', pin);
        await securityService.toggleBiometrics(true);
        setStatus(prev => ({ ...prev, biometricsEnabled: true }));
        if (user) {
          updateUser({ ...user, useBiometrics: true });
        }
        showAlert('Success', 'Biometrics enabled successfully.', 'success');
      }
    } catch (error: any) {
      console.error('PIN action failed:', error);
      showAlert('Failed', error?.response?.data?.message || 'Action failed. Please check your network connection.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const SettingItem = ({ icon: Icon, title, subtitle, value, onValueChange, type = 'switch', onPress, disabled }: any) => (
    <Ripple 
      onPress={type === 'switch' ? () => onValueChange(!value) : onPress}
      disabled={disabled}
      style={[styles.item, { borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
        <Icon size={22} color={colors.primary} weight="fill" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <AppText variant="bold" size="md" color={disabled ? colors.textSecondary : colors.text}>{title}</AppText>
        <AppText size="xs" color={colors.textSecondary}>{subtitle}</AppText>
      </View>
      {type === 'switch' ? (
        <View pointerEvents="none">
          <Switch 
            value={value} 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            disabled={disabled}
          />
        </View>
      ) : (
        <AppText variant="bold" color={disabled ? colors.textSecondary : colors.primary} size="xs">{value}</AppText>
      )}
    </Ripple>
  );

  if (loading) {
    return (
      <AppScreen>
        <ScreenHeader title="Security" />
        <View style={{ padding: Spacing.lg }}>
          <AppSkeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 16 }} />
          <AppSkeleton width="100%" height={80} borderRadius={12} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Security" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem 
            icon={Key} 
            title="Transaction PIN" 
            subtitle={status.hasPin ? "Digit PIN is set" : "Protect your wallet with a 4-digit PIN"}
            type="button"
            value={status.hasPin ? "Change" : "Set up"}
            onPress={() => {
              setPinMode('set');
              setTempPin(null);
              setIsPinModalVisible(true);
            }}
          />
          <SettingItem 
            icon={Fingerprint} 
            title="Biometric Login" 
            subtitle={status.hasPin ? "Use FaceID/Fingerprint for payments" : "Set a PIN first to enable biometrics"}
            value={status.biometricsEnabled}
            onValueChange={handleToggleBiometrics}
            disabled={!status.hasPin}
          />
        </View>
      </ScrollView>

      <SecurityPinModal 
        visible={isPinModalVisible}
        onClose={() => {
            setIsPinModalVisible(false);
            setTempPin(null);
        }}
        onSuccess={onPinSuccess}
        title={tempPin ? 'Confirm your PIN' : (status.hasPin ? 'Enter new PIN' : 'Set your 4-digit PIN')}
      />

      <AppLoader visible={isActionLoading} message="Please wait..." />

      <AppAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
