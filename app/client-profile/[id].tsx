import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { borderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { userService } from '@/services/users.service';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarBlank, ChatCircleText, ShieldCheck, Star, User, UserGear } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, View } from 'react-native';

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile(id as string);
      setClient(data);
    } catch (err) {
      console.error('[ClientProfile] Error fetching client:', err);
      setError('Could not load client profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!client) return;
      const clientName = `${client.firstName} ${client.lastName}`;
      const shareUrl = `https://www.beeseek.site/client/${id}`;
      await Share.share({
        message: `Check out ${clientName}'s profile on BeeSeek: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleContact = () => {
    if (!client) return;
    router.push(`/chat/${client.id}`);
  };

  const renderSkeleton = () => (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.profileInfoContainer}>
          <AppSkeleton width={80} height={80} borderRadius={40} />
          <View style={styles.nameSection}>
            <AppSkeleton width={150} height={24} style={{ marginBottom: 8 }} />
            <AppSkeleton width={120} height={16} />
          </View>
        </View>
        <AppSkeleton width="100%" height={60} style={{ marginTop: Spacing.md }} />
        <AppSkeleton width="100%" height={80} borderRadius={borderRadius.lg} style={{ marginTop: Spacing.md }} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="" />
        {renderSkeleton()}
      </AppScreen>
    );
  }

  if (error || !client) {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AppText variant="bold" size="lg" style={{ color: colors.error }}>Error</AppText>
          <AppText style={{ textAlign: 'center', marginTop: 10 }}>{error || 'Client not found'}</AppText>
          <AppButton 
            title="Go Back" 
            onPress={() => router.back()} 
            style={{ marginTop: 20 }}
          />
        </View>
      </AppScreen>
    );
  }

  const clientName = `${client.firstName} ${client.lastName}`;
  const joinedDateStr = client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScreenHeader 
         title="" 
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.profileInfoContainer}>
            {client.profileImage ? (
              <Image 
                source={{ uri: client.profileImage }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }]}>
                <User size={40} color={colors.textSecondary} weight="fill" />
              </View>
            )}
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <AppText variant="bold" size="2xl" style={styles.nameText}>{clientName}</AppText>
                {client.ninVerifiedAt && (
                  <ShieldCheck size={20} color={colors.primary} weight="fill" style={styles.verifiedIcon} />
                )}
              </View>
            </View>
          </View>

          <AppText style={[styles.bioText, { color: colors.text }]} numberOfLines={4}>
            {client.bio || 'This client has not added a bio yet.'}
          </AppText>

          {/* Stats Grid */}
          <View style={[styles.statsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Star size={16} color={Colors.light.warning} weight="fill" />
                <AppText variant="bold" size="lg" style={styles.statValue}>{parseFloat(client.rating).toFixed(1)}</AppText>
              </View>
              <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Client Rating</AppText>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <UserGear size={16} color={colors.primary} weight="fill" />
                <AppText variant="bold" size="lg" style={styles.statValue}>{client.totalHires || 0}</AppText>
              </View>
              <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Hires Made</AppText>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <CalendarBlank size={16} color={colors.success} weight="fill" />
                <AppText variant="bold" size="lg" style={styles.statValue}>{joinedDateStr}</AppText>
              </View>
              <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Member Since</AppText>
            </View>
          </View>
        </View>

        {/* You could add a review section here later if needed */}
      </ScrollView>

      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.background,
          borderTopColor: colors.border 
        }
      ]}>
        <AppButton 
          title="Contact Client" 
          onPress={handleContact}
          icon={<ChatCircleText size={20} color="white" weight="bold" />}
          style={styles.contactButton}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  headerContainer: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  nameSection: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    maxWidth: '85%',
  },
  verifiedIcon: {
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    marginTop: 2,
  },
  bioText: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {},
  statDivider: {
    width: 1,
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: Spacing.xl, // Safe area
  },
  contactButton: {
    width: '100%',
  }
});
