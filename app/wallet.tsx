import { AppAlert } from '@/components/AppAlert';
import { AppRefreshControl } from '@/components/AppRefreshControl';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionItem, TransactionStatus, TransactionType } from '@/components/TransactionItem';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/useAuthStore';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CaretRight, Copy, Eye, EyeSlash, Info, ShieldCheck, Wallet } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface DashboardTransaction {
    id: string;
    type: TransactionType;
    title: string;
    date: string;
    amount: number;
    status: TransactionStatus;
}

const VIRTUAL_ACCOUNT = {
    bankName: 'BeeSeek Bank',
    accountNumber: '1234567890',
    accountName: 'BeeSeek User Wallet'
};

export default function WalletScreen() {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const { user, updateUser } = useAuthStore();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balanceVisible, setBalanceVisible] = useState(false);
    const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);

    const accessibleBalance = (user?.walletBalance || 0) / 100;
    const virtualAccount = {
        bankName: user?.monnifyBankName || 'Wema Bank',
        accountNumber: user?.monnifyNUBAN || 'Pending...',
        accountName: user?.monnifyAccountName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'BeeSeek User'
    };

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const loadData = useCallback(async () => {
        try {
            const profileRes = await api.get('/users/profile');
            updateUser(profileRes.data);
            
            const transactionsRes = await api.get('/wallet/transactions');
            // Format for display
            const formatted = transactionsRes.data.slice(0, 5).map((t: any) => ({
                id: t.id,
                type: t.type,
                title: t.description,
                date: new Date(t.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }),
                amount: t.amount,
                status: t.status
            }));
            setTransactions(formatted);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [updateUser]);

    useEffect(() => {
        // Initial load
        loadData();

        // High-Performance Real-Time Sync
        const unsubscribe = socketService.on('walletBalanceUpdate', (data) => {
            console.log('Real-time wallet update received:', data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData(); // Seamless background refresh
        });

        return () => unsubscribe();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const copyToClipboard = async () => {
        if (!user?.monnifyNUBAN) {
            setAlertMessage('Account number not yet available');
            setAlertVisible(true);
        } else {
            await Clipboard.setStringAsync(user.monnifyNUBAN);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAlertMessage('Account number copied to clipboard');
            setAlertVisible(true);
        }
    };

    const renderHeader = () => (
        <View style={{ marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg }}>
            {!user?.isNinVerified && user?.ninStatus !== 'PENDING' && (
                <View style={[styles.verificationBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '20' }]}>
                    <ShieldCheck size={24} color={colors.error} weight="fill" />
                    <View style={{ flex: 1 }}>
                        <AppText variant="bold" color={colors.error}>Verification Required</AppText>
                        <AppText size="xs" color={colors.error}>Verify your NIN to enable wallet funding and payments.</AppText>
                    </View>
                    <Ripple 
                        onPress={() => router.push('/verify-nin')}
                        style={{ padding: 4 }}
                    >
                        <AppText size="sm" color={colors.error} variant="bold" style={{ textDecorationLine: 'underline' }}>Verify</AppText>
                    </Ripple>
                </View>
            )}

            {!user?.isNinVerified && user?.ninStatus === 'PENDING' && (
                <View style={[styles.verificationBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
                    <ShieldCheck size={24} color={colors.primary} weight="fill" />
                    <View style={{ flex: 1 }}>
                        <AppText variant="bold" color={colors.primary}>Verification Pending</AppText>
                        <AppText size="xs" color={colors.primary}>Your NIN is under review. This usually takes a few minutes.</AppText>
                    </View>
                </View>
            )}

            {/* Balance Card */}
            <View style={[styles.card, { backgroundColor: colors.primary }]}>
                <View style={styles.balanceHeader}>
                    <AppText color="#fff" size="sm" variant="medium" style={{ opacity: 0.8 }}>Total Balance</AppText>
                    <Ripple 
                        onPress={() => setBalanceVisible(!balanceVisible)} 
                        style={{ padding: 4 }}
                        rippleCentered={true}
                        rippleContainerBorderRadius={20}
                    >
                        {balanceVisible ? <Eye size={20} color="#fff" /> : <EyeSlash size={20} color="#fff" />}
                    </Ripple>
                </View>
                
                <AppText color="#fff" variant="bold" style={{ fontSize: 32, marginVertical: Spacing.sm }}>
                    {balanceVisible ? `₦${accessibleBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
                </AppText>

                <View style={[styles.balanceFooter, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Wallet size={16} color="#fff" weight="fill" />
                    <AppText color="#fff" size="xs" variant="medium" style={{ marginLeft: 6 }}>
                        Secured by Monnify
                    </AppText>
                </View>
            </View>

            {/* Top Up Section */}
            <View style={{ marginTop: Spacing.xl }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <AppText variant="bold" size="lg">Fund Your Wallet</AppText>
                    <View style={{ marginLeft: 8, backgroundColor: colors.primary + '15', padding: 4, borderRadius: 4 }}>
                        <AppText size="xs" color={colors.primary} variant="bold">LIVE SYNC</AppText>
                    </View>
                </View>

                <View style={[styles.topUpCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }]}>
                    {!user?.isNinVerified && user?.ninStatus !== 'PENDING' ? (
                        <View style={{ padding: Spacing.xl, alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={48} color={colors.textSecondary} weight="thin" />
                            <AppText color={colors.textSecondary} style={{ textAlign: 'center' }}>
                                Wallet funding is disabled until your identity is verified.
                            </AppText>
                            <Ripple 
                                onPress={() => router.push('/verify-nin')}
                                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
                            >
                                <AppText color="#fff" variant="bold">Complete Verification</AppText>
                            </Ripple>
                        </View>
                    ) : !user?.isNinVerified && user?.ninStatus === 'PENDING' ? (
                        <View style={{ padding: Spacing.xl, alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={48} color={colors.primary} weight="thin" />
                            <AppText variant="bold" color={colors.primary}>Verification In Progress</AppText>
                            <AppText color={colors.textSecondary} style={{ textAlign: 'center' }}>
                                Your NIN verification is being reviewed. Wallet funding will be enabled once approved.
                            </AppText>
                        </View>
                    ) : (
                        <View style={{ padding: Spacing.md }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                                <View>
                                    <AppText size="xs" color={colors.textSecondary} style={{ marginBottom: 2 }}>Bank Name</AppText>
                                    <AppText variant="bold" color={colors.text}>{virtualAccount.bankName}</AppText>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <AppText size="xs" color={colors.textSecondary} style={{ marginBottom: 2 }}>Account Name</AppText>
                                    <AppText variant="semiBold" color={colors.text} size="sm">{virtualAccount.accountName}</AppText>
                                </View>
                            </View>

                            <View style={{ backgroundColor: colors.background, padding: Spacing.md, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <AppText size="xs" color={colors.textSecondary} style={{ marginBottom: 4 }}>Account Number</AppText>
                                    <AppText variant="bold" size="xl" color={colors.text} style={{ letterSpacing: 1 }}>
                                        {virtualAccount.accountNumber}
                                    </AppText>
                                </View>
                                <Ripple 
                                    onPress={copyToClipboard}
                                    style={[styles.copyIconBtn, { backgroundColor: colors.primary + '10' }]}
                                    rippleColor={colors.primary}
                                >
                                    <Copy size={22} color={colors.primary} />
                                </Ripple>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md }}>
                                <Info size={14} color={colors.textSecondary} />
                                <AppText size="xs" color={colors.textSecondary} style={{ marginLeft: 6, fontStyle: 'italic' }}>
                                    Funds arrive in 1-2 minutes.
                                </AppText>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl }}>
                <AppText variant="bold" size="lg">
                    Recent Transactions
                </AppText>
                <Ripple 
                    onPress={() => router.push('/transactions')}
                    style={{ padding: 4 }}
                    rippleCentered={true}
                    rippleContainerBorderRadius={20}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AppText variant="semiBold" size="sm" color={colors.primary}>View All</AppText>
                        <CaretRight size={14} color={colors.primary} weight="bold" />
                    </View>
                </Ripple>
            </View>
        </View>
    );

    const renderSkeleton = () => (
        <View style={{ padding: Spacing.md }}>
            <AppSkeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: Spacing.xl }} />
            
            <AppSkeleton width={150} height={24} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: Spacing.xl }} />

            <AppSkeleton width={180} height={24} style={{ marginBottom: Spacing.md }} />
            {[1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
                    <AppSkeleton width={40} height={40} borderRadius={20} style={{ marginRight: Spacing.md }} />
                    <View style={{ flex: 1 }}>
                        <AppSkeleton width="60%" height={20} style={{ marginBottom: 6 }} />
                        <AppSkeleton width="40%" height={14} />
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <AppScreen disablePadding>
            <ScreenHeader title="Wallet" />
            
            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <TransactionItem {...item} />}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingBottom: Spacing.xl }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                            <AppText color={colors.textSecondary}>No transactions yet</AppText>
                        </View>
                    }
                    refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}

            <AppAlert 
                visible={alertVisible}
                title="Copied"
                message={alertMessage}
                onConfirm={() => setAlertVisible(false)}
                type="success"
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.lg,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    verificationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        gap: 12,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceFooter: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: Spacing.sm,
    },
    topUpCard: {
        // Wrapper handled inline
    },
    copyIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
