import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { LoginFormValues, loginSchema } from '../../utils/validation';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
  });

  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { coords, getDeviceInfo } = useLocation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const deviceInfo = await getDeviceInfo();
      const payload = {
        ...data,
        ...deviceInfo,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      };
      const response = await authService.login(payload);
      setAuth(response.user, response.access_token, response.refresh_token);
      router.replace('/(tabs)');
    } catch (error: any) {
      
      let message = 'Something went wrong. Please try again.';
      let title = 'Login Failed';
      let type: 'error' | 'warning' = 'error';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        title = 'Request Timeout';
        message = 'The server is taking too long to respond. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        title = 'Invalid Credentials';
        message = 'This account does not exist or the password is incorrect. Please check your email and password.';
        type = 'warning';
      } else if (error.response?.status === 429) {
        title = 'Too Many Attempts';
        message = "You've tried to log in too many times. Please wait a few minutes before trying again.";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setAlertConfig({
        visible: true,
        title,
        message,
        type,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding withMesh>
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
              <AppText variant="bold" size="3xl" style={styles.title}>
                Welcome Back
              </AppText>
              <AppText color={colors.textSecondary}>
                Sign in to your client account
              </AppText>
            </View>

            <AppAlert
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

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

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Password"
                    placeholder="Enter your password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    isPassword
                  />
                )}
              />

              <Ripple 
                style={styles.forgotPassword} 
                onPress={() => router.push('/(auth)/forgot-password')}
                rippleColor={colors.primary}
              >
                <AppText size="sm" color={colors.primary} variant="medium">
                  Forgot Password?
                </AppText>
              </Ripple>

              <AppButton
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.footer}>
              <AppText color={colors.textSecondary}>
                Don't have an account?{' '}
              </AppText>
              <Ripple 
                onPress={() => router.push('/(auth)/register')}
                rippleColor={colors.primary}
                rippleCentered
                style={{ padding: 4 }}
              >
                <AppText color={colors.primary} variant="bold">
                  Sign Up
                </AppText>
              </Ripple>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    marginBottom: Spacing.xs,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  submitBtn: {
    marginBottom: Spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
});
