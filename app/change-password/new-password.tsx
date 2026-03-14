import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { authService } from '../../services/auth.service';
import { ResetPasswordFormValues, resetPasswordSchema } from '../../utils/validation';

export default function NewPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, pendingResetCode, pendingResetEmail, clearPendingReset } = useAuthStore();


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
      const email = pendingResetEmail || user?.email;
      const code = pendingResetCode;
      if (!email || !code) throw new Error('Session expired. Please try again.');

      await authService.resetPassword({ email, code, password: data.password });
      clearPendingReset();
      
      // Navigate back to profile or home
      router.dismissAll();
      router.replace('/manage-profile');
      
    } catch (error: any) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Change Password" showBackButton />
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
                New Password
              </AppText>
              <AppText color={colors.textSecondary} style={{ lineHeight: 22 }}>
                Your identity has been verified. Please create a new strong password.
              </AppText>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="New Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 lowercase"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    secureTextEntry
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Confirm New Password"
                    placeholder="Re-enter your new password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    secureTextEntry
                  />
                )}
              />

              <AppButton
                title="Update Password"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    gap: Spacing.md,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
