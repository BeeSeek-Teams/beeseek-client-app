import { AppAlert } from '@/components/AppAlert';
import { AppInput } from '@/components/AppInput';
import { AppLoader } from '@/components/AppLoader';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contractService } from '@/services/contract.service';
import { useRouter } from 'expo-router';
import { CalendarBlank, DownloadSimple, Eye, MagnifyingGlass, User as UserIcon } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED';

interface ContractData {
  id: string;
  status: ContractStatus;
  contract: {
    id: string;
    details: string;
    bee: {
      title: string;
    };
    agent?: {
      firstName: string;
      lastName: string;
    };
    client?: {
      firstName: string;
      lastName: string;
    };
    workmanshipCost?: number;
    transportFare?: number;
    materials?: Array<{ item: string; cost: number }>;
    commissionAmount?: number;
    serviceFee?: number;
    workDateFormatted: string;
    type: string;
  };
}

export default function ContractsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContractStatus | 'all'>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchContracts();
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const fetchContracts = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (pageNum === 1 && !shouldRefresh) setLoading(true);
      
      const response = await contractService.getMyJobs(pageNum, 10);
      const newJobs = response.jobs;
      
      if (shouldRefresh || pageNum === 1) {
        setContracts(newJobs);
      } else {
        setContracts(prev => [...prev, ...newJobs]);
      }
      
      setHasMore(newJobs.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      showAlert('Error', 'Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContracts(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchContracts(page + 1);
    }
  };

  const handleDownload = async (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    setIsDownloading(true);
    try {
      await contractService.downloadPdf(contract.contract.id, contract.contract.id);
    } catch (e) {
      showAlert('Error', 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStatusBadge = (status: ContractStatus) => {
    let color = colors.text;
    let bg = colors.surface;
    let label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    switch (status) {
      case 'ACTIVE':
        color = colors.primary;
        bg = colors.primary + '15';
        break;
      case 'COMPLETED':
        color = colors.success;
        bg = colors.success + '15';
        break;
      case 'CANCELLED':
      case 'ESCALATED':
        color = colors.error;
        bg = colors.error + '15';
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <AppText size="xs" variant="bold" style={{ color: color }}>
          {label}
        </AppText>
      </View>
    );
  };

  const filteredContracts = contracts.filter(c => {
    const title = c.contract.bee?.title || '';
    const agentName = c.contract.agent ? `${c.contract.agent.firstName} ${c.contract.agent.lastName}` : '';
    const clientName = c.contract.client ? `${c.contract.client.firstName} ${c.contract.client.lastName}` : '';
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || c.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }: { item: ContractData }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
             <AppText variant="bold" size="md" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                {item.contract.bee?.title || 'Service Contract'}
             </AppText>
             {renderStatusBadge(item.status)}
          </View>
          <AppText color={colors.textSecondary} size="xs" variant="medium">
            Job ID: {item.id.substring(0, 8).toUpperCase()} • {item.contract.type}
          </AppText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
           <View style={styles.iconContainer}>
              <UserIcon size={14} color={colors.textSecondary} />
           </View>
           <View>
              <AppText size="xs" color={colors.textSecondary}>Agent</AppText>
              <AppText variant="semiBold" size="sm" numberOfLines={1}>
                {item.contract.agent?.firstName} {item.contract.agent?.lastName}
              </AppText>
           </View>
        </View>

        <View style={styles.detailItem}>
           <View style={styles.iconContainer}>
              <UserIcon size={14} color={colors.textSecondary} />
           </View>
           <View>
              <AppText size="xs" color={colors.textSecondary}>Client</AppText>
              <AppText variant="semiBold" size="sm" numberOfLines={1}>
                {item.contract.client?.firstName} {item.contract.client?.lastName}
              </AppText>
           </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
           <View style={styles.iconContainer}>
              <CalendarBlank size={14} color={colors.textSecondary} />
           </View>
           <View>
              <AppText size="xs" color={colors.textSecondary}>Job Date</AppText>
              <AppText variant="semiBold" size="sm">{item.contract.workDateFormatted}</AppText>
           </View>
        </View>
      </View>

       <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.actions}>
         <Ripple 
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => router.push(`/job/${item.id}`)}
            rippleContainerBorderRadius={8}
         >
            <Eye size={18} color={colors.text} />
            <AppText size="sm" variant="medium" style={{ marginLeft: 6 }}>View Job</AppText>
         </Ripple>

         <View style={{ width: Spacing.sm }} />

         <Ripple 
            style={[styles.actionBtn, { backgroundColor: colors.primary + '10', borderColor: 'transparent' }]}
            onPress={() => handleDownload(item.id)}
            rippleContainerBorderRadius={8}
         >
            <DownloadSimple size={18} color={colors.primary} />
            <AppText size="sm" variant="medium" color={colors.primary} style={{ marginLeft: 6 }}>Download</AppText>
         </Ripple>
      </View>
    </View>
  );

  const FilterChip = ({ label, value }: { label: string, value: ContractStatus | 'all' }) => (
      <Ripple
        style={[
            styles.filterChip, 
            { 
                backgroundColor: filterType === value ? colors.primary : 'transparent',
                borderColor: filterType === value ? colors.primary : colors.border
            }
        ]}
        onPress={() => setFilterType(value)}
      >
          <AppText 
            size="xs" 
            variant="semiBold" 
            color={filterType === value ? '#fff' : colors.textSecondary}
          >
              {label}
          </AppText>
      </Ripple>
  );

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="My Contracts" />
      
      <View style={styles.headerContainer}>
        <AppInput
            placeholder="Search by Bee, ID or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<MagnifyingGlass size={20} color={colors.textSecondary} />}
            containerStyle={{ marginBottom: Spacing.md }}
        />
        
        <View style={styles.filterRow}>
            <FilterChip label="All History" value="all" />
            <FilterChip label="Active" value="ACTIVE" />
            <FilterChip label="Completed" value="COMPLETED" />
            <FilterChip label="Terminated" value="CANCELLED" />
        </View>
      </View>

      <FlatList
        data={filteredContracts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : <View style={{ height: 40 }} />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Spacing.lg }}>
                <AppSkeleton height={180} style={{ marginBottom: Spacing.md }} />
                <AppSkeleton height={180} style={{ marginBottom: Spacing.md }} />
                <AppSkeleton height={180} style={{ marginBottom: Spacing.md }} />
            </View>
          ) : (
            <View style={styles.emptyState}>
                <CalendarBlank size={48} color={colors.textSecondary} weight="duotone" />
                <AppText color={colors.textSecondary} style={{ marginTop: Spacing.md }}>
                    {searchQuery ? "No results match your search query." : "You haven't had any job contracts yet."}
                </AppText>
            </View>
          )
        }
      />

      <AppAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertVisible(false)}
      />

      <AppLoader visible={isDownloading} message="Generating Document..." />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },
  card: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00000005',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['2xl'] * 2,
  }
});
