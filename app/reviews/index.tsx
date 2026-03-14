import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reviewService } from '@/services/review.service';
import { useAuthStore } from '@/store/useAuthStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Star, User as UserIcon } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';

dayjs.extend(relativeTime);

export default function ReviewsScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const { user } = useAuthStore();
    
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = async (pageNum: number, isRefresh: boolean = false) => {
        try {
            const response = await reviewService.getMyReviews(pageNum, 10);
            const newReviews = response.items;
            
            if (isRefresh) {
                setReviews(newReviews);
            } else {
                setReviews(prev => [...prev, ...newReviews]);
            }
            
            setHasMore(pageNum < response.meta.lastPage);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReviews(1, true);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchReviews(1, true);
    };

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReviews(nextPage);
    };

    const renderHeader = () => {
        const rating = user?.rating || 0;
        return (
            <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ alignItems: 'center', width: 100 }}>
                    <AppText variant="bold" size="3xl">{rating.toFixed(1)}</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star} 
                                weight="fill" 
                                size={14} 
                                color={star <= Math.round(rating) ? colors.primary : colors.border} 
                                style={{ marginRight: 1 }}
                            />
                        ))}
                    </View>
                    <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 4 }}>Personal Rating</AppText>
                </View>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <View style={{ flex: 1, paddingLeft: Spacing.sm }}>
                    <AppText size="xs" color={colors.textSecondary} style={{ marginBottom: 4, fontStyle: 'italic' }}>
                        Your rating is built from feedback given by agents you've worked with.
                    </AppText>
                    <AppText size="xs" color={colors.primary} variant="bold">
                        Keep it up!
                    </AppText>
                </View>
            </View>
        );
    };

    const renderReview = ({ item }: { item: any }) => (
        <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.reviewer?.profileImage ? (
                        <Image source={{ uri: item.reviewer.profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }]}>
                            <UserIcon size={20} color={colors.textSecondary} />
                        </View>
                    )}
                    <View style={{ marginLeft: Spacing.sm }}>
                        <AppText variant="bold" size="sm">{item.reviewer?.firstName} {item.reviewer?.lastName}</AppText>
                        <AppText size="xs" color={colors.textSecondary}>{item.reviewerRole === 'AGENT' ? 'Professional Service' : 'Client Review'}</AppText>
                    </View>
                </View>
                <AppText size="xs" color={colors.textSecondary}>{dayjs(item.createdAt).fromNow()}</AppText>
            </View>
            
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        weight="fill" 
                        size={14} 
                        color={star <= item.rating ? colors.primary : colors.border} 
                        style={{ marginRight: 1 }}
                    />
                ))}
            </View>

            <AppText size="sm" style={{ lineHeight: 20 }}>{item.comment || 'No comment provided.'}</AppText>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: Spacing.md }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <AppText color={colors.textSecondary}>No reviews yet.</AppText>
        </View>
    );

    const renderSkeleton = () => (
        <View style={{ padding: Spacing.lg }}>
            <AppSkeleton width="100%" height={100} borderRadius={12} style={{ marginBottom: Spacing.lg }} />
            <AppSkeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: Spacing.md }} />
        </View>
    );

    return (
        <AppScreen disablePadding>
            <ScreenHeader title="My Reviews" />
            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={item => item.id}
                    renderItem={renderReview}
                    ListHeaderComponent={() => <View style={{ padding: Spacing.lg }}>{renderHeader()}</View>}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingBottom: Spacing.xl }}
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        alignItems: 'center',
    },
    separator: {
        width: 1,
        height: '80%',
        marginHorizontal: Spacing.md,
    },
    reviewCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
});

