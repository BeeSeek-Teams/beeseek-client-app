import { AppRefreshControl } from '@/components/AppRefreshControl';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { HireCard } from '@/components/HireCard';
import { LocationMockModal } from '@/components/LocationMockModal';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import { SOSModal } from '@/components/SOSModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDistance, useLocation } from '@/hooks/use-location';
import { analyticsService } from '@/services/analytics.service';
import api from '@/services/api';
import { chatService } from '@/services/chat.service';
import { contractService } from '@/services/contract.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, Bell, CalendarBlank, CaretDown, CaretRight, CheckCircle, Clock, Eye, EyeSlash, Headset, MapPin, Receipt, ShieldWarning, Star, Wallet } from 'phosphor-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user, updateUser, setLocation, actualDeviceLocation, lastLocation } = useAuthStore();
  const { address, showPermissionModal, setShowPermissionModal, refreshLocation, getDeviceInfo } = useLocation();

  // Drift Detection Logic
  const hasLocationDrift = actualDeviceLocation && lastLocation && 
    getDistance(
      actualDeviceLocation.latitude, 
      actualDeviceLocation.longitude, 
      lastLocation.latitude, 
      lastLocation.longitude
    ) > 500; // 500 meters threshold

  const EmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
            <CalendarBlank size={32} color={colors.primary} weight="thin" />
        </View>
        <AppText variant="bold" size="lg" style={{ marginBottom: 4 }}>No active hires</AppText>
        <AppText color={colors.textSecondary} style={{ textAlign: 'center' }}>
            Need something fixed? Find an agent to get started.
        </AppText>
        <Ripple 
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/search')}
        >
            <AppText color="#FFF" variant="bold">Find an Agent</AppText>
        </Ripple>
    </View>
  );
  
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentHires, setRecentHires] = useState<any[]>([]);
  const [recurringHires, setRecurringHires] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [activeHire, setActiveHire] = useState<any>(null);
  const [upcomingHires, setUpcomingHires] = useState<any[]>([]);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [showSpent, setShowSpent] = useState(false);

  const fetchProfile = async () => {
    const { accessToken, _hasHydrated } = useAuthStore.getState();
    if (!_hasHydrated || !accessToken) return;

    try {
      const response = await api.get('/users/profile');
      updateUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchHomeData = async () => {
    const { accessToken, _hasHydrated } = useAuthStore.getState();
    if (!_hasHydrated || !accessToken) return;

    try {
      const [overview, recents, recurring, jobsRes, pending] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRecentHires(),
        analyticsService.getRecurringHires(),
        contractService.getMyJobs(),
        analyticsService.getPendingReviews()
      ]);

      fetchUnreadCount();

      setStats(overview);
      const jobs = jobsRes?.jobs || [];
      setPendingReviews(pending);
      const now = dayjs();

      setRecentHires(recents.map((h: any) => {
        // Fallback to contract.agentId if agent object isn't populated
        const agentId = h.agent?.id || h.contract?.agentId;
        return {
          id: h.id,
          beeName: h.otherPartyName,
          service: h.title,
          rating: h.agent?.rating || 5.0,
          agentId: agentId,
          avatarUrl: h.agent?.profileImage
        };
      }));

      setRecurringHires(recurring.map((h: any) => {
        // Fallback to contract.agentId if agent object isn't populated
        const agentId = h.agent?.id || h.contract?.agentId;
        return {
          id: h.id,
          beeName: h.otherPartyName,
          service: h.title,
          jobCount: h.jobCount,
          rating: h.agent?.rating || 5.0,
          agentId: agentId,
          avatarUrl: h.agent?.profileImage
        };
      }));

      // Logic for active/upcoming - strictly from Job table
      const active = jobs.find((j: any) => 
        j.status === 'ACTIVE' && 
        (j.currentStep !== 'ALL_SET' || dayjs(j.contract.workDate).isSame(now, 'day'))
      );
      
      if (active) {
        const isActuallyStarted = active.currentStep !== 'ALL_SET';
        const isToday = dayjs(active.contract.workDate).isSame(now, 'day');
        setActiveHire({
            id: active.id,
            jobId: active.id,
            contractId: active.contractId,
            title: active.contract?.details || 'Service Details',
            otherPartyName: active.otherPartyName,
            date: dayjs(active.contract.workDate).format('MMM D, YYYY'),
            startTime: active.startTime,
            type: (active.contract?.type?.toLowerCase() || 'task') as any,
            status: isActuallyStarted ? 'in_progress' : (isToday ? 'soon' : 'scheduled'),
        });
      } else {
        setActiveHire(null);
      }

      // Upcoming PAID Jobs strictly from Job table
      const upcoming = jobs
        .filter((j: any) => 
            j.status === 'ACTIVE' && 
            j.id !== active?.id &&
            dayjs(j.contract.workDate).isAfter(now, 'day')
        )
        .slice(0, 3);

      setUpcomingHires(upcoming.map((u: any) => ({
          id: u.id,
          jobId: u.id,
          title: u.contract?.details || 'Service Details',
          otherPartyName: u.otherPartyName,
          date: dayjs(u.contract.workDate).format('MMM D, YYYY'),
          startTime: u.startTime,
          type: (u.contract?.type?.toLowerCase() || 'task') as any,
          status: 'scheduled',
      })));

    } catch (error) {
      console.error('Failed to fetch home data:', error);
    }
  };

  const handleChatWithUser = async (otherUserId: string, otherUserName: string, avatarUrl?: string) => {
    try {
      const room = await chatService.getOrCreateRoom(otherUserId);
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: room.id,
          name: otherUserName,
          partnerId: otherUserId,
          avatarUrl: avatarUrl || ''
        }
      });
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  const _hasHydrated = useAuthStore(state => state._hasHydrated);
  const accessToken = useAuthStore(state => state.accessToken);
  const hasInitialLoaded = useRef(false);

  useEffect(() => {
    if (_hasHydrated && accessToken) {
        Promise.all([fetchProfile(), fetchHomeData()]).finally(() => {
            setLoading(false);
            hasInitialLoaded.current = true;
        });
    } else if (_hasHydrated && !accessToken) {
        // Not logged in, stop loading state
        setLoading(false);
    }
  }, [_hasHydrated, accessToken]);

  // Re-fetch home data when the tab regains focus (e.g., after releasing payment)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialLoaded.current && _hasHydrated && accessToken) {
        fetchHomeData();
      }
    }, [_hasHydrated, accessToken])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
        refreshLocation(true),
        fetchProfile(),
        fetchHomeData()
    ]);
    setRefreshing(false);
  }, [refreshLocation]);

  const QuickAction = ({ icon, label, color, onPress }: { icon: any, label: string, color: string, onPress?: () => void }) => (
    <Ripple 
        style={[styles.quickAction, { backgroundColor: colors.surface }]} 
        rippleColor={colors.primary} 
        rippleOpacity={0.1}
        onPress={onPress}
    >
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
            {icon ? icon : <AppSkeleton width={24} height={24} borderRadius={12} />}
        </View>
        <AppText size="xs" variant="medium" style={{ marginTop: 8 }} numberOfLines={1}>{label}</AppText>
    </Ripple>
  );

  const StatItem = ({ icon: Icon, value, label, onPress, isPrivate, isHidden }: { icon: any, value: string, label: string, onPress?: () => void, isPrivate?: boolean, isHidden?: boolean }) => (
      <Ripple 
        style={styles.statItem} 
        onPress={onPress} 
        disabled={!onPress}
        rippleColor={colors.primary}
        rippleOpacity={0.05}
      >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Icon size={20} color={colors.primary} weight="fill" />
            {isPrivate && (isHidden ? <EyeSlash size={12} color={colors.textSecondary} /> : <Eye size={12} color={colors.textSecondary} />)}
          </View>
          <AppText variant="bold" size="lg">{isPrivate && isHidden ? '••••••' : value}</AppText>
          <AppText size="xs" color={colors.textSecondary}>{label}</AppText>
      </Ripple>
  );

  const HomeSkeleton = () => (
      <View style={{ gap: Spacing.xl }}>
           {/* Welcome Skeleton */}
           <View>
              <AppSkeleton width={180} height={32} style={{ marginBottom: 8 }} />
              <AppSkeleton width={240} height={20} style={{ marginBottom: 24 }} />
              <AppSkeleton width="100%" height={50} borderRadius={12} />
           </View>
           
           {/* Stats Skeleton */}
           <AppSkeleton width="100%" height={80} borderRadius={12} />

           {/* Quick Actions Skeleton */}
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                {[1,2,3,4].map(i => <AppSkeleton key={i} style={{ flex: 1, height: 90 }} borderRadius={16} />)}
           </View>

           {/* Recent Hires Skeleton */}
           <View>
              <AppSkeleton width={120} height={24} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                 {[1,2,3].map(i => <AppSkeleton key={i} width={160} height={70} borderRadius={16} />)}
              </View>

              {/* Active Section Skeleton */}
              <AppSkeleton width="100%" height={150} borderRadius={24} style={{ marginBottom: 24 }} />

              <AppSkeleton width={120} height={24} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                 {[1,2,3].map(i => <AppSkeleton key={i} width={160} height={70} borderRadius={16} />)}
              </View>
           </View>
      </View>
  );

  return (
    <AppScreen disablePadding>
      <LocationPermissionModal 
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
      
      <LocationMockModal 
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        currentLocation={address || 'Unknown'}
        onSelect={async (newLoc, coords) => {
          if (coords) {
            setLocation(coords, newLoc);
            // Sync with backend so search nearby is accurate
            const { deviceId, deviceType } = await getDeviceInfo();
            api.put('/users/profile', {
                latitude: coords.latitude,
                longitude: coords.longitude,
                deviceId,
                deviceType
            }).catch(err => console.error('Failed to sync manual location:', err));
          }
        }}
      />

      <SOSModal 
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />

       {/* Fixed Header */}
       <View style={[styles.headerRow, { paddingHorizontal: Spacing.lg }]}>
            <Ripple 
                style={[
                  styles.locationButton,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  hasLocationDrift && { borderColor: Colors.light.warning, borderWidth: 1 }
                ]}
                onPress={() => setLocationModalVisible(true)}
                rippleContainerBorderRadius={8}
            >
                <MapPin size={16} color={hasLocationDrift ? Colors.light.warning : colors.primary} weight="fill" />
                <AppText size="sm" variant="bold" color={colors.text} style={{ marginHorizontal: 6, flexShrink: 1 }} numberOfLines={1}>
                    {address || 'Fetching...'}
                </AppText>
                {hasLocationDrift ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.warning, marginRight: 4 }} />
                ) : (
                  <CaretDown size={14} color={colors.textSecondary} />
                )}
            </Ripple>
            
            <Ripple 
                style={styles.iconButton} 
                rippleColor={colors.text} 
                rippleOpacity={0.1} 
                rippleContainerBorderRadius={20}
                onPress={() => router.push('/notifications')}
            >
                <Bell size={24} color={colors.text} />
                {unreadCount > 0 && <View style={styles.badge} />}
            </Ripple>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
            <HomeSkeleton />
        ) : (
            <>
                {/* Welcome & Search */}
                <View style={styles.section}>
                    <AppText variant="bold" size="2xl" style={{ marginBottom: 4 }}>
                        Hello, {user?.firstName || 'Guest'}
                    </AppText>
                    <AppText color={colors.textSecondary}>
                        Find help or manage your hires.
                    </AppText>
                </View>

                {/* Verification Banner */}
                {(!user?.isNinVerified) && (
                  <Ripple
                    style={{
                      backgroundColor: user?.ninStatus === 'PENDING' ? colors.info + '15' : colors.warning + '15',
                      padding: Spacing.md,
                      borderRadius: 12,
                      marginBottom: Spacing.lg,
                      borderWidth: 1,
                      borderColor: user?.ninStatus === 'PENDING' ? colors.info : colors.warning,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }} // @ts-ignore
                    onPress={() => user?.ninStatus !== 'PENDING' && router.push('/verify-nin')}
                  >
                    <ShieldWarning size={24} color={user?.ninStatus === 'PENDING' ? colors.info : colors.warning} weight="fill" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <AppText variant="bold" size="md" color={user?.ninStatus === 'PENDING' ? colors.info : colors.warning}>
                        {user?.ninStatus === 'PENDING' ? 'Verification Pending' : 'Verify Account'}
                      </AppText>
                      <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {user?.ninStatus === 'PENDING' 
                          ? 'Your NIN is under review. Support will confirm within 24 hours.' 
                          : 'Complete your NIN verification to unlock features.'}
                      </AppText>
                    </View>
                    {user?.ninStatus !== 'PENDING' && <CaretRight size={16} color={colors.warning} />}
                  </Ripple>
                )}

                {/* Quick Stats Row (Discreet updates) */}
                <View style={[styles.statsRow, { borderColor: colors.border }]}>
                    <StatItem icon={CheckCircle} value={stats?.hiresDoneCount?.toString() || '0'} label="Done" />
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <StatItem icon={Receipt} value={stats?.recurringAgentsCount?.toString() || '0'} label="Repeats" />
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <StatItem 
                        icon={Wallet} 
                        value={`₦${((stats?.totalSpent || 0) / 100).toLocaleString()}`} 
                        label="Spent" 
                        isPrivate
                        isHidden={!showSpent}
                        onPress={() => setShowSpent(!showSpent)}
                    />
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <AppText variant="bold" size="lg" style={styles.sectionTitle}>Quick Actions</AppText>
                    <View style={styles.quickActionsGrid}>
                        <QuickAction 
                            icon={<Wallet size={24} color={colors.primary} weight="fill" />} 
                            label="Wallet" 
                            color={colors.primary} 
                            onPress={() => router.push('/wallet')}
                        />
                        <QuickAction 
                            icon={<Clock size={24} color={colors.secondary} weight="fill" />} 
                            label="History" 
                            color={colors.secondary} 
                            onPress={() => router.push('/work-history')}
                        />
                        <QuickAction 
                            icon={<Headset size={24} color={colors.warning} weight="fill" />} 
                            label="Support" 
                            color={colors.warning} 
                            onPress={() => router.push('/support')}
                        />
                        <QuickAction 
                            icon={<ShieldWarning size={24} color={colors.error} weight="fill" />} 
                            label="SOS" 
                            color={colors.error} 
                            onPress={() => setSosModalVisible(true)}
                        />
                    </View>
                </View>

                {/* Recent Hires (Quick Rebook) */}
                {recentHires.length > 0 && (
                  <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                          <AppText variant="bold" size="lg">Recent Hires</AppText>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                          {recentHires.map((hire) => (
                              <Ripple 
                                  key={hire.id} 
                                  style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                  rippleColor={colors.primary}
                                  onPress={() => handleChatWithUser(hire.agentId, hire.beeName, hire.avatarUrl)}
                              >
                                  <View style={[styles.recentAvatar, { backgroundColor: colors.secondary + '20' }]}>
                                      <AppText variant="bold" color={colors.secondary}>{hire.beeName.charAt(0)}</AppText>
                                  </View>
                                  <View>
                                      <AppText variant="bold" size="md">{hire.beeName}</AppText>
                                      <AppText size="xs" color={colors.textSecondary}>{hire.service}</AppText>
                                  </View>
                                  <View style={[styles.rotateIcon, { backgroundColor: colors.background }]}>
                                      <ArrowRight size={12} color={colors.textSecondary} /> 
                                  </View>
                              </Ripple>
                          ))}
                      </ScrollView>
                  </View>
                )}

                {/* Recurring Hires */}
                {recurringHires.length > 0 && (
                  <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                          <AppText variant="bold" size="lg">Frequent Agents</AppText>
                          <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                            <AppText size="xs" color={colors.primary} variant="bold">REPEATS</AppText>
                          </View>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                          {recurringHires.map((hire) => (
                              <Ripple 
                                  key={hire.id} 
                                  style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}
                                  rippleColor={colors.primary}
                                  onPress={() => handleChatWithUser(hire.agentId, hire.beeName, hire.avatarUrl)}
                              >
                                  <View style={[styles.recentAvatar, { backgroundColor: colors.primary + '20' }]}>
                                      <AppText variant="bold" color={colors.primary}>{hire.beeName.charAt(0)}</AppText>
                                  </View>
                                  <View>
                                      <AppText variant="bold" size="md">{hire.beeName}</AppText>
                                      <AppText size="xs" color={colors.textSecondary}>{hire.jobCount} Hires</AppText>
                                  </View>
                                  <View style={[styles.rotateIcon, { backgroundColor: colors.primary + '10' }]}>
                                      <Star size={12} color={colors.primary} weight="fill" /> 
                                  </View>
                              </Ripple>
                          ))}
                      </ScrollView>
                  </View>
                )}

                {/* Pending Reviews */}
                {pendingReviews.length > 0 && (
                  <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                          <AppText variant="bold" size="lg">Pending Feedback</AppText>
                          <View style={{ backgroundColor: colors.warning + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                            <AppText size="xs" color={colors.warning} variant="bold">{pendingReviews.length} TO DO</AppText>
                          </View>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                          {pendingReviews.map((item) => (
                              <Ripple 
                                  key={item.id} 
                                  style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.warning + '30' }]}
                                  rippleColor={colors.warning}
                                  onPress={() => router.push(`/job/${item.id}`)} 
                              >
                                  <View style={[styles.recentAvatar, { backgroundColor: colors.warning + '20' }]}>
                                      <AppText variant="bold" color={colors.warning}>{item.otherPartyName?.charAt(0)}</AppText>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                      <AppText variant="bold" size="md" numberOfLines={1}>{item.otherPartyName}</AppText>
                                      <AppText size="xs" color={colors.textSecondary} numberOfLines={1}>{item.title}</AppText>
                                  </View>
                                  <View style={[styles.rotateIcon, { backgroundColor: colors.warning + '10' }]}>
                                      <Star size={12} color={colors.warning} weight="fill" /> 
                                  </View>
                              </Ripple>
                          ))}
                      </ScrollView>
                  </View>
                )}

                {/* Active Job Banner */}
                {activeHire && (
                    <View style={[styles.activeSection, { backgroundColor: colors.success + '05', borderColor: colors.success + '20' }]}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.sectionIndicator, { backgroundColor: colors.success }]} />
                                <AppText variant="bold" size="lg">Ongoing Job</AppText>
                            </View>
                        </View>
                        <HireCard 
                            {...activeHire}
                            onPress={() => router.push(`/job/${activeHire.jobId}`)}
                            style={{ marginBottom: 0 }}
                        />
                    </View>
                )}

                {/* Upcoming Jobs */}
                {upcomingHires.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.sectionIndicator, { backgroundColor: colors.secondary }]} />
                                <AppText variant="bold" size="lg">Upcoming Jobs</AppText>
                            </View>
                        </View>
                        {upcomingHires.map((hire) => (
                            <HireCard 
                                key={hire.id} 
                                {...hire} 
                                style={{ borderColor: colors.secondary + '20' }}
                                onPress={() => router.push(`/job/${hire.jobId}`)}
                            />
                        ))}
                    </View>
                )}

                {/* Empty State when no jobs */}
                {!activeHire && upcomingHires.length === 0 && (
                    <EmptyState />
                )}

                <View style={{ height: 100 }} />
            </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '85%', // Prevent pushing icons out
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  section: {
      marginBottom: Spacing.xl,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
  },
  activeSection: {
    padding: Spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    borderStyle: 'dashed',
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionTitle: {
      marginBottom: Spacing.md,
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
  },
  // Stats Row
  statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderRadius: 12,
      padding: Spacing.md,
  },
  statItem: {
      alignItems: 'center',
      flex: 1,
  },
  statDivider: {
      width: 1,
      height: 24,
  },
  // Quick Actions
  quickActionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
  },
  quickAction: {
      flex: 1,
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: 16,
  },
  actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  },
  // Recent Hires
  recentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      paddingRight: Spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
      minWidth: 160,
  },
  recentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  rotateIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
  },
  // Tip Card
  tipCard: {
      padding: Spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: Spacing.xl,
  },
  emptyState: {
    padding: Spacing['2xl'],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: Spacing.lg,
  }
});
