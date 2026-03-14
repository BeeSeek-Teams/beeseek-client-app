import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { authService } from '../../services/auth.service';

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: data.email, type: 'forgot_password' }
      });
    } catch (error: any) {
      let message = 'Could not send reset code. Please check your email.';
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please try again.';
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
      <ScreenHeader title="Forgot Password" showBackButton />
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
                Reset Password
              </AppText>
              <AppText color={colors.textSecondary} style={{ lineHeight: 22 }}>
                Enter your email address and we'll send you a code to reset your password.
              </AppText>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Email Address"
                    placeholder="name@example.com"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <AppButton
                title="Send Reset Code"
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
