import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { BeeDetailsModal } from '@/components/BeeDetailsModal';
import { BeeSearchResult, BeeSearchResultCard } from '@/components/BeeSearchResultCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { borderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { userService } from '@/services/users.service';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, ChatCircleText, Clock, ShareNetwork, ShieldCheck, Star, User } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Share, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function AgentProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBee, setSelectedBee] = useState<BeeSearchResult | null>(null);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile(id as string);
      setAgent(data);
    } catch (err) {
      console.error('[AgentProfile] Error fetching agent:', err);
      setError('Could not load agent profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!agent) return;
      const agentName = `${agent.firstName} ${agent.lastName}`;
      const shareUrl = `https://www.beeseek.site/agent/${id}`;
      await Share.share({
        message: `Check out ${agentName}'s profile on BeeSeek: ${shareUrl}`,
        url: shareUrl, // iOS only
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleContact = () => {
    if (!agent) return;
    router.push(`/chat/${agent.id}`);
  };

  const renderSkeleton = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileInfoContainer}>
        <AppSkeleton width={80} height={80} borderRadius={40} />
        <View style={styles.nameSection}>
          <AppSkeleton width={180} height={28} style={{ marginBottom: 8 }} />
          <AppSkeleton width={140} height={16} />
        </View>
      </View>
      <AppSkeleton width="100%" height={60} style={{ marginTop: Spacing.md }} />
      <AppSkeleton width="100%" height={90} borderRadius={borderRadius.lg} style={{ marginTop: Spacing.md }} />
      <View style={{ marginTop: Spacing.xl }}>
        <AppSkeleton width={150} height={24} style={{ marginBottom: Spacing.md }} />
        <AppSkeleton width="100%" height={120} borderRadius={borderRadius.md} style={{ marginBottom: Spacing.md }} />
        <AppSkeleton width="100%" height={120} borderRadius={borderRadius.md} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="" />
        <View style={{ flex: 1, padding: 0 }}>
          {renderSkeleton()}
        </View>
      </AppScreen>
    );
  }

  if (error || !agent) {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AppText variant="bold" size="lg" style={{ color: colors.error }}>Error</AppText>
          <AppText style={{ textAlign: 'center', marginTop: 10 }}>{error || 'Agent not found'}</AppText>
          <AppButton 
            title="Go Back" 
            onPress={() => router.back()} 
            style={{ marginTop: 20 }}
          />
        </View>
      </AppScreen>
    );
  }

  const agentName = `${agent.firstName} ${agent.lastName}`;
  const joinedDateStr = agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

  const renderProfileHeader = () => (
    <View>
      {/* Cover/Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.profileInfoContainer}>
          {agent.profileImage ? (
            <Image 
              source={{ uri: agent.profileImage }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }]}>
              <User size={40} color={colors.textSecondary} weight="fill" />
            </View>
          )}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <AppText variant="bold" size="2xl" style={styles.nameText}>{agentName}</AppText>
              {agent.ninVerifiedAt && (
                <ShieldCheck size={20} color={colors.primary} weight="fill" style={styles.verifiedIcon} />
              )}
            </View>
            <View style={styles.locationRow}>
              <AppText variant="regular" size="sm" style={[styles.locationText, { color: colors.textSecondary }]}>
                Joined {joinedDateStr}
              </AppText>
            </View>
          </View>
        </View>

        <AppText style={[styles.bioText, { color: colors.text }]} numberOfLines={4}>
          {agent.bio || 'No bio available for this agent.'}
        </AppText>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Star size={16} color={Colors.light.warning} weight="fill" />
              <AppText variant="bold" size="lg" style={styles.statValue}>{parseFloat(agent.rating).toFixed(1)}</AppText>
            </View>
            <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Rating</AppText>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Briefcase size={16} color={colors.primary} weight="fill" />
              <AppText variant="bold" size="lg" style={styles.statValue}>
                {agent.bees?.reduce((acc: number, bee: any) => acc + (Number(bee.jobsCompleted) || 0), 0) || 0}
              </AppText>
            </View>
            <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Jobs Done</AppText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Clock size={16} color={colors.success} weight="fill" />
              <AppText variant="bold" size="lg" style={styles.statValue}>100%</AppText>
            </View>
            <AppText variant="regular" size="sm" style={{ color: colors.textSecondary }}>Completion</AppText>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="bold" size="lg" style={styles.sectionTitle}>Services Offered ({agent.bees?.length || 0})</AppText>
      </View>
    </View>
  );

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScreenHeader 
         title="" 
         rightAction={
             <Ripple 
                 onPress={handleShare}
                 style={{
                     width: 40,
                     height: 40,
                     borderRadius: 20,
                     alignItems: 'center',
                     justifyContent: 'center',
                     borderWidth: 1,
                     backgroundColor: colors.surface, 
                     borderColor: colors.border
                 }}
                 rippleContainerBorderRadius={20}
             >
                <ShareNetwork size={20} color={colors.text} />
             </Ripple>
         }
      />

      <FlatList
        data={agent.bees || []}
        renderItem={({ item }) => {
          // Map backend Bee to BeeSearchResultCard expected format
          const formattedItem: BeeSearchResult = {
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description,
            price: Number(item.price),
            rating: Number(item.rating) || 0,
            jobsCompleted: Number(item.jobsCompleted) || 0,
            coverImage: item.images?.[0],
            distance: 0, // Distance not applicable on profile view
            travelTime: '...',
            images: item.images,
            workHours: item.workHours,
            offersInspection: !!item.offersInspection,
            inspectionPrice: item.inspectionPrice,
            location: item.locationAddress,
            clientRequirements: item.clientRequirements,
            agent: {
              id: agent.id,
              name: agentName,
              isVerified: !!agent.isVerified,
              isOnline: !!agent.isAvailable,
              avatar: agent.profileImage,
              status: agent.isAvailable ? 'available' : 'offline',
              isAvailable: !!agent.isAvailable,
              isBooked: !!agent.isBooked,
              bookedDate: agent.bookedDate,
              bookedTime: agent.bookedTime,
              joinedAt: agent.createdAt,
              achievements: {
                earlyAccess: !!agent.earlyAccessAchievement,
                topRated: !!agent.topRatedAchievement,
                goldenBadge: !!agent.goldenBadgeAchievement,
              }
            }
          };
          
          return (
            <View style={styles.beeCardWrapper}>
              <BeeSearchResultCard 
                item={formattedItem} 
                onPress={() => setSelectedBee(formattedItem)} 
              />
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderProfileHeader}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]} // Space for footer
        showsVerticalScrollIndicator={false}
      />

      <BeeDetailsModal 
        visible={!!selectedBee}
        bee={selectedBee}
        onClose={() => setSelectedBee(null)}
      />

      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.background,
          borderTopColor: colors.border 
        }
      ]}>
        <AppButton 
          title="Contact Agent" 
          onPress={handleContact}
          icon={<ChatCircleText size={20} color="white" weight="bold" />}
          style={styles.contactButton}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.md,
  },
  navButton: {
    padding: Spacing.xs,
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
  nameText: {},
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
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {},
  beeCardWrapper: {
    marginBottom: Spacing.md,
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
