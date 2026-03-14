import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { SettingsItem } from '@/components/SettingsItem';
import { SignOutModal } from '@/components/SignOutModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Briefcase, FileText, Headset, Lock, Receipt, ShieldCheck, SignOut, Star, User, Users } from 'phosphor-react-native';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function AccountScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuthStore();
  const [signOutVisible, setSignOutVisible] = useState(false);

  const handleSignOut = () => {
    logout();
  };

  return (
    <AppScreen disablePadding>
      <SignOutModal 
        visible={signOutVisible} 
        onClose={() => setSignOutVisible(false)} 
        onSignOut={handleSignOut} 
      />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppText variant="bold" size="2xl">
          Account
        </AppText>
        <AppText color={colors.textSecondary} size="sm">
          Manage your profile and settings
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }]}>
            {user?.profileImage ? (
                <Image 
                    source={{ uri: user.profileImage }} 
                    style={styles.avatar}
                />
            ) : (
                <User size={32} color={colors.primary} weight="fill" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="bold" size="lg">{user?.firstName} {user?.lastName}</AppText>
            <AppText color={colors.textSecondary} size="sm">{user?.email}</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle} color={colors.textSecondary} size="xs" variant="bold">
            GENERAL
          </AppText>
          <SettingsItem 
            label="Manage Profile" 
            icon={<User size={24} color={colors.text} />} 
            onPress={() => router.push('/manage-profile')} 
          />
          <SettingsItem 
            label="Emergency Contact" 
            icon={<Users size={24} color={colors.text} />} 
            onPress={() => router.push('/emergency-contact')} 
          />
          <SettingsItem 
            label="Work History" 
            icon={<Briefcase size={24} color={colors.text} />} 
            onPress={() => router.push('/work-history')} 
          />
          <SettingsItem 
            label="My Reviews" 
            icon={<Star size={24} color={colors.text} />} 
            onPress={() => router.push('/reviews')} 
          />
          <SettingsItem 
            label="Security" 
            icon={<Lock size={24} color={colors.text} />} 
            onPress={() => router.push('/security-settings')} 
          />
        </View>

        <View style={styles.section}>
           <AppText style={styles.sectionTitle} color={colors.textSecondary} size="xs" variant="bold">
            SUPPORT & LEGAL
          </AppText>
          <SettingsItem 
            label="Contact Support" 
            icon={<Headset size={24} color={colors.text} />} 
            onPress={() => router.push('/support')} 
          />
          <SettingsItem 
            label="Contracts" 
            icon={<FileText size={24} color={colors.text} />} 
            onPress={() => router.push('/contracts')} 
          />
          <SettingsItem 
             label="View Transactions" 
             icon={<Receipt size={24} color={colors.text} />} 
             onPress={() => router.push('/transactions')} 
          />
           <SettingsItem 
            label="Terms of Service" 
            icon={<FileText size={24} color={colors.text} />} 
            onPress={() => router.push('/legal/terms')} 
          />
          <SettingsItem 
            label="Privacy Policy" 
            icon={<ShieldCheck size={24} color={colors.text} />} 
            onPress={() => router.push('/legal/privacy')} 
          />
        </View>

        <View style={styles.section}>
          <SettingsItem 
            label="Sign Out" 
            icon={<SignOut size={24} color={colors.error} />} 
            onPress={() => setSignOutVisible(true)}
            isDestructive
            showChevron={false}
          />
        </View>
        
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
    backgroundColor: '#E1E1E1',
  },
  profileInfo: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
});
