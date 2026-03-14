import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { OtpInput } from '@/components/ui/otp-input';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { authService } from '../../services/auth.service';
import { VerifyOtpFormValues, verifyOtpSchema } from '../../utils/validation';

export default function VerifyChangePasswordOtpScreen() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, setPendingReset } = useAuthStore();

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  // Countdown timer logic
  useEffect(() => {
    let timer: any;
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
      if (user?.email) {
        await authService.forgotPassword(user.email);
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
      if (!user?.email) throw new Error('User email not found');
      
      await authService.verifyOtp(user.email, data.code);
      
      setPendingReset(user.email, data.code);
      router.push({
        pathname: '/change-password/new-password',
      });
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
                We sent a 6-digit code to <AppText variant="bold" color={colors.text}>{user?.email}</AppText>.
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  form: {
    gap: Spacing.xl,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
