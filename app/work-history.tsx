import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppModal } from '@/components/AppModal';
import { AppRefreshControl } from '@/components/AppRefreshControl';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { HireCard } from '@/components/HireCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contractService } from '@/services/contract.service';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Funnel, MagnifyingGlass } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

const FILTERS = ['All Time', 'This Month', 'Last Month', 'Custom'];


// ... (existing imports)

export default function WorkHistoryScreen() {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All Time');
    const [customFilterVisible, setCustomFilterVisible] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeDateRange, setActiveDateRange] = useState({ start: '', end: '' });
    const [data, setData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const mapContracts = (contracts: any[]) => {
        if (!Array.isArray(contracts)) return [];
        return contracts
            .filter((c: any) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(c.status))
            .map((c: any) => {
                const firstName = c.agent?.firstName || c.agentName || '';
                const lastName = c.agent?.lastName || '';
                const otherPartyName = (firstName && lastName) 
                    ? `${firstName} ${lastName}` 
                    : firstName || 'Unknown Agent';
                
                // Format startTime from database (HH:MM:SS format) to 12-hour format
                let startTime = '--:--';
                if (c.startTime) {
                    try {
                        startTime = dayjs(`2000-01-01 ${c.startTime}`).format('hh:mm A');
                    } catch (e) {
                        startTime = c.startTime; // Fallback to raw value if formatting fails
                    }
                }
                
                return {
                    id: c.id,
                    title: c.bee?.displayName || c.bee?.title || 'Service',
                    otherPartyName,
                    date: dayjs(c.workDate).format('MMM D, YYYY'),
                    startTime,
                    endTime: c.endTime,
                    type: (c.type?.toLowerCase() || 'task') as any,
                    status: (c.status === 'COMPLETED' ? 'completed' : 'cancelled') as any,
                    original: c
                };
            });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await contractService.getMyContracts(1, 20);
            const contracts = result.items ?? result;
            setData(mapContracts(contracts));
            setCurrentPage(2);
            setHasMore(result.meta ? result.meta.page < result.meta.totalPages : false);
        } catch (error) {
            // Failed to load history
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFilterSelect = (filter: string) => {
        if (filter === 'Custom') {
            setCustomFilterVisible(true);
        } else {
            setSelectedFilter(filter);
            setActiveDateRange({ start: '', end: '' });
        }
    };

    const applyCustomFilter = () => {
        setSelectedFilter('Custom');
        setActiveDateRange(dateRange);
        setCustomFilterVisible(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const loadMore = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        contractService.getMyContracts(currentPage, 20)
            .then(result => {
                const contracts = result.items ?? result;
                setData(prev => [...prev, ...mapContracts(contracts)]);
                setCurrentPage(prev => prev + 1);
                setHasMore(result.meta ? result.meta.page < result.meta.totalPages : false);
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false));
    };

    // Filter Logic
    const filteredItems = data.filter(item => {
        // Search Filter
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        // Date Filter
        const itemDate = dayjs(item.date);
        const now = dayjs();

        if (selectedFilter === 'This Month') {
            return itemDate.isSame(now, 'month');
        }
        if (selectedFilter === 'Last Month') {
            return itemDate.isSame(now.subtract(1, 'month'), 'month');
        }
        if (selectedFilter === 'Custom' && activeDateRange.start && activeDateRange.end) {
             const start = dayjs(activeDateRange.start);
             const end = dayjs(activeDateRange.end);
             return itemDate.isAfter(start.subtract(1, 'day')) && itemDate.isBefore(end.add(1, 'day'));
        }

        return true;
    });

    const renderHeader = () => (
        <View style={{ paddingBottom: Spacing.md }}>
            <View style={{ marginBottom: Spacing.md }}>
                <AppInput 
                    placeholder="Search history..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={<MagnifyingGlass size={20} color={colors.textSecondary} />}
                />
            </View>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
            >
                {FILTERS.map(filter => (
                    <Ripple 
                        key={filter}
                        onPress={() => handleFilterSelect(filter)}
                        style={[
                            styles.filterChip, 
                            { 
                                backgroundColor: selectedFilter === filter ? colors.primary : colors.surface,
                                borderColor: selectedFilter === filter ? colors.primary : colors.border
                            }
                        ]}
                    >
                        <AppText 
                            size="xs" 
                            color={selectedFilter === filter ? '#fff' : colors.text}
                            variant={selectedFilter === filter ? 'bold' : 'medium'}
                        >
                            {filter}
                        </AppText>
                        {selectedFilter === filter && filter === 'Custom' && (
                             <Funnel size={12} color="#fff" weight="fill" style={{ marginLeft: 4 }} />
                        )}
                    </Ripple>
                ))}
            </ScrollView>
        </View>
    );

    const renderSkeleton = () => (
        <View style={{ padding: Spacing.lg }}>
            <AppSkeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.xl }}>
                 <AppSkeleton width={80} height={32} borderRadius={20} />
                 <AppSkeleton width={80} height={32} borderRadius={20} />
                 <AppSkeleton width={80} height={32} borderRadius={20} />
            </View>
            {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ marginBottom: Spacing.md }}>
                    <AppSkeleton width="100%" height={120} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
                <AppText size="xs" color={colors.textSecondary}>Loading more history...</AppText>
            </View>
        );
    };

    return (
        <AppScreen disablePadding>
            <ScreenHeader title="Work History" />

            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={{ marginBottom: Spacing.md, paddingHorizontal: Spacing.lg }}>
                             <HireCard 
                                {...item} 
                                onPress={() => router.push(`/job/${item.original?.job?.id || item.id}`)}
                             />
                        </View>
                    )}
                    ListHeaderComponent={() => <View style={{ paddingHorizontal: Spacing.lg }}>{renderHeader()}</View>}
                    contentContainerStyle={{ paddingBottom: Spacing.xl }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={{ padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.xl }}>
                            <AppText color={colors.textSecondary}>No history found matching your filters.</AppText>
                        </View>
                    }
                />
            )}

            <AppModal
                visible={customFilterVisible}
                onClose={() => setCustomFilterVisible(false)}
                title="Filter by Date"
            >
                <View>
                    <AppText size="sm" color={colors.textSecondary} style={{ marginBottom: Spacing.md }}>
                        Enter a date range to filter your history.
                    </AppText>
                    
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <AppInput 
                                label="Start Date" 
                                placeholder="YYYY-MM-DD"
                                value={dateRange.start}
                                onChangeText={(t) => setDateRange(prev => ({ ...prev, start: t }))}
                            />
                        </View>
                         <View style={{ flex: 1 }}>
                            <AppInput 
                                label="End Date" 
                                placeholder="YYYY-MM-DD"
                                value={dateRange.end}
                                onChangeText={(t) => setDateRange(prev => ({ ...prev, end: t }))}
                            />
                        </View>
                    </View>

                    <AppButton 
                        title="Apply Filter"
                        onPress={applyCustomFilter}
                        style={{ marginTop: Spacing.lg }}
                    />
                </View>
            </AppModal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
});
