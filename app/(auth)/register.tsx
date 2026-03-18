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
import { RegisterFormValues, registerSchema } from '../../utils/validation';

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'info' | 'warning',
    onConfirm: () => {},
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      age: '' as any,
      password: '',
      role: 'CLIENT',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const deviceInfo = await getDeviceInfo();
      const payload = {
        ...data,
        ...deviceInfo,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      };

      const result = await authService.register(payload);

      setAuth(result.user, result.access_token, result.refresh_token);
      
      setAlertConfig({
        visible: true,
        title: 'Success!',
        message: 'Account created successfully. Please verify your email to continue.',
        type: 'success',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          router.push({
            pathname: '/(auth)/verify-otp',
            params: { email: data.email, type: 'register' }
          });
        }
      });
    } catch (error: any) {

      let message = 'Something went wrong. Please try again.';
      let title = 'Registration Failed';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        title = 'Request Timeout';
        message = 'The server is taking too long to respond. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        title = 'Invalid Data';
        message = 'The registration details provided are invalid.';
      } else if (error.response?.status === 429) {
        title = 'Too Many Attempts';
        message = "You've tried to register too many times. Please wait a few minutes before trying again.";
      } else if (error.response?.data?.message) {
        message = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
      }

      setAlertConfig({
        visible: true,
        title,
        message,
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <AppAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false })))}
      />
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
                Create Account
              </AppText>
              <AppText color={colors.textSecondary}>
                Register as a client to start finding bees
              </AppText>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="First Name"
                      placeholder="John"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.firstName?.message}
                      containerStyle={{ flex: 1, marginRight: Spacing.sm }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="Last Name"
                      placeholder="Doe"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.lastName?.message}
                      containerStyle={{ flex: 1 }}
                    />
                  )}
                />
              </View>

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
                name="age"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Age"
                    placeholder="25"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString()}
                    error={errors.age?.message}
                    keyboardType="number-pad"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Password"
                    placeholder="SecurePass123!"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    isPassword
                  />
                )}
              />

              <AppText size="xs" color={colors.textSecondary} style={{ marginTop: Spacing.sm, lineHeight: 18 }}>
                By creating an account, you agree to our{' '}
                <AppText size="xs" color={colors.primary} onPress={() => router.push('/legal/terms')}>
                  Terms of Service
                </AppText>{' '}and{' '}
                <AppText size="xs" color={colors.primary} onPress={() => router.push('/legal/privacy')}>
                  Privacy Policy
                </AppText>.
              </AppText>

              <AppButton
                title="Create Account"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.footer}>
              <AppText color={colors.textSecondary}>
                Already have an account?{' '}
              </AppText>
              <Ripple
                onPress={() => router.push('/(auth)/login')}
                rippleColor={colors.primary}
                rippleCentered
                style={{ padding: 4 }}
              >
                <AppText color={colors.primary} variant="bold">
                  Sign In
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
    paddingBottom: Spacing['2xl'],
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
    paddingHorizontal: Spacing.md,
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
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
});
