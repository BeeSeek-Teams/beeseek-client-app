import { AppRefreshControl } from '@/components/AppRefreshControl';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { BeeDetailsModal } from '@/components/BeeDetailsModal';
import { BeeSearchResult, BeeSearchResultCard } from '@/components/BeeSearchResultCard';
import { SearchFilterModal, SearchFilters } from '@/components/SearchFilterModal';
import { SearchHeader } from '@/components/SearchHeader';
import { SERVICE_CATEGORIES } from '@/constants/ServiceCategories';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresence } from '@/hooks/use-presence';
import { beesService } from '@/services/bees.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { SmileySad } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View
} from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const lastLocation = useAuthStore(state => state.lastLocation);
  const { fetchBatchStatus } = usePresence();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialSearch, setIsInitialSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'categories' | 'results'>('categories');
  const [filteredResults, setFilteredResults] = useState<BeeSearchResult[]>([]);
  const [selectedBee, setSelectedBee] = useState<BeeSearchResult | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchResults = async (resetPage = false) => {
    if (!lastLocation) return;
    
    const currentPage = resetPage ? 1 : page;
    if (resetPage) {
        setLoading(true);
        setPage(1);
    }
    
    try {
        const response = await beesService.searchNearby({
            lat: lastLocation.latitude,
            lng: lastLocation.longitude,
            query: searchQuery,
            category: selectedCategoryId || undefined,
            page: currentPage,
            limit: 10,
            radius: activeFilters?.maxDistance || 15,
            minRating: activeFilters?.minRating || undefined,
            verifiedOnly: activeFilters?.showVerifiedOnly || undefined,
            onlineOnly: activeFilters?.showOnlineOnly || undefined,
            hasInspection: activeFilters?.showInspectionsOnly || undefined,
            sortBy: activeFilters?.sortBy || undefined,
        });

        const mappedResults: BeeSearchResult[] = response.data.map((bee: any) => ({
            id: bee.id,
            title: bee.title,
            category: bee.category,
            description: bee.description,
            price: Number(bee.price),
            rating: bee.rating,
            jobsCompleted: bee.jobsCompleted,
            distance: Number(bee.distance),
            travelTime: `${Math.round(bee.distance * 8)} min`,
            coverImage: bee.images?.[0],
            offersInspection: !!bee.offersInspection,
            inspectionPrice: bee.inspectionPrice,
            agent: {
                id: bee.agent.id,
                name: `${bee.agent.firstName} ${bee.agent.lastName}`,
                isVerified: !!bee.agent.ninVerifiedAt,
                isOnline: bee.agent.isAvailable,
                avatar: bee.agent.profileImage,
                status: bee.agent.isBooked ? 'booked' : (bee.agent.isAvailable ? 'available' : 'offline'),
                isAvailable: bee.agent.isAvailable,
                isBooked: bee.agent.isBooked,
                bookedDate: bee.agent.bookedDate,
                bookedTime: bee.agent.bookedTime,
                joinedAt: bee.agent.createdAt,
                achievements: {
                    earlyAccess: !!bee.agent.earlyAccessAchievement,
                    topRated: !!bee.agent.topRatedAchievement,
                    goldenBadge: !!bee.agent.goldenBadgeAchievement,
                }
            },
            location: bee.locationAddress,
            workHours: bee.workHours,
            clientRequirements: bee.clientRequirements,
            images: bee.images
        }));

        setFilteredResults(prev => resetPage ? mappedResults : [...prev, ...mappedResults]);
        
        // Fetch presence for new results
        const newAgentIds = mappedResults.map(r => r.agent.id);
        if (newAgentIds.length > 0) {
            fetchBatchStatus(newAgentIds);
        }

        setTotal(response.total);
        setLastPage(response.lastPage);
        setPage(currentPage + 1);
    } catch (error) {
        // Search failed silently
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 0 || activeFilters) {
        setViewMode('results');
        setIsInitialSearch(true);
        
        // Clear category ID if search query doesn't match the selected category label
        const currentCategory = SERVICE_CATEGORIES.find(c => c.id === selectedCategoryId);
        if (currentCategory && searchQuery !== currentCategory.label) {
            setSelectedCategoryId(null);
        }

        const timer = setTimeout(() => {
            fetchResults(true).finally(() => {
                setIsInitialSearch(false);
            });
        }, 300);
        return () => clearTimeout(timer);
    } else {
        setViewMode('categories');
        setFilteredResults([]);
        setIsInitialSearch(false);
    }
  }, [searchQuery, activeFilters, lastLocation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResults(true);
  }, [searchQuery, lastLocation]);

  const handleLoadMore = () => {
    if (!loading && page <= lastPage) {
        fetchResults();
    }
  };

  const handleCategoryPress = (category: typeof SERVICE_CATEGORIES[0]) => {
      setLoading(true);
      setSearchQuery(category.label);
      setSelectedCategoryId(category.id);
  };

  const renderCategoryItem = ({ item }: { item: typeof SERVICE_CATEGORIES[0] }) => (
      <Ripple 
        style={[
            styles.categoryCard, 
            { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
            }
        ]} 
        rippleColor={colors.primary}
        rippleOpacity={0.1}
        rippleContainerBorderRadius={16}
        onPress={() => handleCategoryPress(item)}
      >
          <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <item.icon size={32} color={item.color} weight="fill" />
          </View>
          <View style={styles.textContainer}>
              <AppText variant="bold" size="md" numberOfLines={1} style={{ marginBottom: 4 }}>
                  {item.label}
              </AppText>
              <AppText size="xs" color={colors.textSecondary} numberOfLines={2} style={styles.description}>
                  {item.description}
              </AppText>
          </View>
      </Ripple>
  );

  const renderResultItem = ({ item }: { item: BeeSearchResult }) => (
      <BeeSearchResultCard 
        item={item} 
        onPress={() => setSelectedBee(item)}
      />
  );

  return (
    <AppScreen disablePadding>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SearchHeader 
            query={searchQuery} 
            onQueryChange={setSearchQuery} 
            onFilterPress={() => setFilterModalVisible(true)}
        />

        <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
            {viewMode === 'categories' ? (
                /* CATEGORIES GRID */
                <FlatList
                    key="categories"
                    data={SERVICE_CATEGORIES}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: Spacing.xl * 4 }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={{ marginBottom: Spacing.md }}>
                            <AppText variant="bold" size="xl">Browse Categories</AppText>
                            <AppText color={colors.textSecondary}>Find what you need close to you</AppText>
                        </View>
                    }
                />
            ) : (
                /* SEARCH RESULTS LIST */
                <FlatList
                    key="results"
                    data={filteredResults}
                    renderItem={renderResultItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: Spacing.xl * 4 }}
                    refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={
                        <View style={{ marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <AppText variant="bold" size="md">
                                {loading && filteredResults.length === 0 ? 'Searching...' : `${total} Bees found within ${activeFilters?.maxDistance || 15}km`}
                            </AppText>
                        </View>
                    }
                    ListFooterComponent={
                        loading && filteredResults.length > 0 ? (
                            <View style={{ paddingVertical: Spacing.md }}>
                                <AppSkeleton height={100} borderRadius={12} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        loading || isInitialSearch ? (
                            <View style={{ gap: Spacing.md }}>
                                {[1,2,3].map(i => <AppSkeleton key={i} height={200} borderRadius={12} />) || <AppText color={colors.textSecondary}>Searching...</AppText>}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <SmileySad size={48} color={colors.textSecondary} />
                                <AppText variant="bold" size="lg" style={{ marginTop: 16 }}>No bees found</AppText>
                                <AppText color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                                    We couldn't find any bees matching your search within {activeFilters?.maxDistance || 15}km. Try expanding your search or different keywords.
                                </AppText>
                            </View>
                        )
                    }
                />
            )}
        </View>
      </KeyboardAvoidingView>

      <BeeDetailsModal 
        visible={!!selectedBee} 
        onClose={() => setSelectedBee(null)} 
        bee={selectedBee}
      />

      <SearchFilterModal 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
            setActiveFilters(filters);
            // Optionally trigger a refresh manually or let the effect handle it
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  // Category Styles
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  categoryCard: {
      width: '48%',
      padding: Spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      minHeight: 140,
      justifyContent: 'space-between'
  },
  iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
  },
  textContainer: {
      flex: 1,
  },
  description: {
      marginTop: 2,
      opacity: 0.8,
  },
  // Results Styles
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
      marginTop: Spacing['2xl'],
  }
});
