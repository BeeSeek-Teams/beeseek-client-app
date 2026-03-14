import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { OtpInput } from '@/components/ui/otp-input';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { VerifyOtpFormValues, verifyOtpSchema } from '../../utils/validation';

export default function VerifyOtpScreen() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };
  const { user, updateUser, logout, setPendingReset } = useAuthStore();
  const { email: paramEmail, type } = useLocalSearchParams<{ email: string; type: string }>();
  const email = paramEmail || user?.email;

  // Countdown timer logic
  useEffect(() => {
    let timer: any
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      if (email) {
        if (type === 'register') {
          await authService.resendVerificationOtp(email);
        } else {
          await authService.forgotPassword(email);
        }
        setCountdown(60); // Reset timer
      }
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not resend code');
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: VerifyOtpFormValues) => {
    setLoading(true);
    try {
      if (!email) throw new Error('Email is missing');
      await authService.verifyOtp(email, data.code);
      
      // Update local store state
      updateUser({ isVerified: true, isNinVerified: user?.isNinVerified || false });

      if (type === 'register') {
        router.replace('/(auth)/nin');
      } else {
        setPendingReset(email, data.code);
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email }
        });
      }
    } catch (error: any) {
      let message = 'Invalid or expired code';
      if (error.code === 'ECONNABORTED') {
        message = 'Connection timeout. Please try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      showAlert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Verification" showBackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[styles.container, { padding: Spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <AppText variant="bold" size="2xl" style={styles.title}>
                Enter OTP
              </AppText>
              <AppText color={colors.textSecondary} style={{ lineHeight: 22 }}>
                We sent a 6-digit code to <AppText variant="bold" color={colors.text}>{email}</AppText>.
                Enter it below to continue.
              </AppText>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, value } }) => (
                  <OtpInput
                    length={6}
                    value={value}
                    onChange={onChange}
                    error={errors.code?.message}
                  />
                )}
              />

              <AppButton
                title="Verify Code"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />
              
              <AppButton
                title={countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code"}
                variant="ghost"
                onPress={handleResend}
                disabled={countdown > 0}
                style={{ marginTop: Spacing.sm }}
                textColor={countdown > 0 ? colors.textSecondary : colors.primary}
              />

              <AppButton
                title="Back to Login"
                variant="outline"
                onPress={() => {
                  logout();
                  router.replace('/(auth)/forgot-password');
                }}
                style={{ marginTop: Spacing.xl, borderColor: colors.error }}
                textColor={colors.error}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <AppAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertVisible(false)}
        type="error"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
