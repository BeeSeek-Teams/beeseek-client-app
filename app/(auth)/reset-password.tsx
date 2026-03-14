import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ResetPasswordFormValues, resetPasswordSchema } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

export default function ResetPasswordScreen() {
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
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const { pendingResetCode, pendingResetEmail, clearPendingReset } = useAuthStore();
  const resetCode = pendingResetCode || code;
  const resetEmail = pendingResetEmail || email;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      if (!resetEmail || !resetCode) throw new Error('Session expired. Please try again.');

      await authService.resetPassword({
        email: resetEmail,
        code: resetCode,
        password: data.password
      });

      clearPendingReset();
      
      showAlert(
        'Success', 
        'Your password has been reset successfully.',
        'success',
        () => {
          router.dismissAll();
          router.replace('/(auth)/login');
        }
      );
    } catch (error: any) {
      let message = 'Could not reset password. Please try again.';
      if (error.code === 'ECONNABORTED') {
        message = 'Connection timed out. Please try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      showAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="New Password" showBackButton />
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
                Set New Password
              </AppText>
              <AppText color={colors.textSecondary} style={{ lineHeight: 22 }}>
                Create a new, secure password for your account.
              </AppText>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="New Password"
                    placeholder="Enter new password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    isPassword
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    isPassword
                  />
                )}
              />

              <AppButton
                title="Reset Password"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />
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
