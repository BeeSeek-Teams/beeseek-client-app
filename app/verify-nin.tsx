import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { IdentificationCard } from 'phosphor-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { NINFormValues, ninSchema } from '../utils/validation';

export default function VerifyNINScreen() {
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    onConfirm?: () => void;
  }>({ title: '', message: '', type: 'error' });

  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error', onConfirm?: () => void) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NINFormValues>({
    resolver: zodResolver(ninSchema),
    defaultValues: {
      nin: '',
    },
  });

  const onSubmit = async (data: NINFormValues) => {
    setLoading(true);
    try {
      await authService.verifyNIN(data.nin);

      // Update local state to reflect verification status
      updateUser({ ninStatus: 'PENDING' });

      showAlert(
        'Verification Submitted', 
        'Your NIN has been received and is now under review by our support team. You will be notified once verified.', 
        'success',
        () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }
      );
    } catch (error: any) {
      showAlert('Verification Failed', error.response?.data?.message || 'Could not verify NIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Verify Identity" showBackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { padding: Spacing.xl },
              { flexGrow: 1 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <IdentificationCard size={80} color={colors.primary} weight="duotone" />
              </View>

              <View style={styles.header}>
                <AppText variant="bold" size="3xl" style={styles.title} align="center">
                  Verify Your Identity
                </AppText>
                <AppText color={colors.textSecondary} align="center">
                  Provide your National Identification Number (NIN) to get a verified badge and unlock more features.
                </AppText>
              </View>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="nin"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="NIN (11 Digits)"
                      placeholder="12345678901"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.nin?.message}
                      keyboardType="number-pad"
                      maxLength={11}
                    />
                  )}
                />

                <AppButton
                  title="Verify NIN"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  style={styles.submitBtn}
                />

                {!router.canGoBack() && (
                  <AppButton
                    title="Skip for now"
                    variant="outline"
                    onPress={() => router.replace('/(tabs)')}
                    style={{ marginTop: Spacing.md }}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <AppAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
        type={alertConfig.type}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    // justifyContent: 'center', // Align to top because of header
  },
  content: {
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.md,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginBottom: Spacing.md,
  },
});
