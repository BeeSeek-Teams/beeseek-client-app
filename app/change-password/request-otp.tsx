import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function RequestChangePasswordOtpScreen() {
  const [loading, setLoading] = useState(false);
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuthStore();

  const handleSendCode = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push({
        pathname: '/change-password/verify-otp',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Change Password" showBackButton />
      
      <View style={[styles.container, { padding: Spacing.xl }]}>
        <View style={styles.header}>
          <AppText variant="bold" size="2xl" style={styles.title}>
            Verify Identity
          </AppText>
          <AppText color={colors.textSecondary} style={{ lineHeight: 22 }}>
            To secure your account, we need to verify it's you. We'll send a verification code to your email:
          </AppText>
        </View>

        <View style={[styles.emailContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="bold" size="sm" style={{ textAlign: 'center' }}>
            {user?.email || 'user@example.com'}
          </AppText>
        </View>

        <AppButton
          title="Send Verification Code"
          onPress={handleSendCode}
          loading={loading}
          style={styles.btn}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  emailContainer: {
    padding: Spacing.lg,
    borderRadius: Spacing.md,
    borderWidth: 1,
    marginVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    marginTop: 'auto', 
    marginBottom: Spacing.xl
  }
});
