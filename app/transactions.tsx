import { AppModal } from '@/components/AppModal';
import { AppRefreshControl } from '@/components/AppRefreshControl';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionItem, TransactionStatus, TransactionType } from '@/components/TransactionItem';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Receipt } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  createdAt: string;
  amount: number;
  status: TransactionStatus;
}

export default function TransactionsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/wallet/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' || t.type === filterType
  );

  const handleTxPress = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalVisible(true);
  };

  const copyToClipboard = async (id: string) => {
    await Clipboard.setStringAsync(id);
    Alert.alert('Copied', 'Transaction ID copied to clipboard');
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS': return '#4CAF50';
      case 'PENDING': return '#FF9800';
      case 'FAILED': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const FilterChip = ({ label, value }: { label: string, value: TransactionType | 'all' }) => (
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

  const renderSkeleton = () => (
      <View style={{ padding: Spacing.lg }}>
          {[1,2,3,4,5,6,7].map(i => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: Spacing.xl }}>
                  <AppSkeleton width={44} height={44} borderRadius={12} style={{ marginRight: Spacing.md }} />
                  <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppSkeleton width="60%" height={16} borderRadius={4} />
                          <AppSkeleton width="20%" height={16} borderRadius={4} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <AppSkeleton width="30%" height={12} borderRadius={4} />
                          <AppSkeleton width="15%" height={12} borderRadius={4} />
                      </View>
                  </View>
              </View>
          ))}
      </View>
  );

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Transactions" />
      
      <View style={{ backgroundColor: colors.surface }}>
          <FlatList 
            data={['all', 'CREDIT', 'DEBIT', 'LOCKED'] as const}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
            keyExtractor={item => item}
            renderItem={({ item }) => (
                <FilterChip 
                    label={item === 'all' ? 'All' : item} 
                    value={item as TransactionType | 'all'} 
                />
            )}
          />
      </View>

      <FlatList 
        data={filteredTransactions}
        refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyExtractor={item => item.id}
        ListEmptyComponent={
            !loading ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
                        <Receipt size={48} color={colors.textSecondary} weight="thin" />
                    </View>
                    <AppText variant="bold" size="lg" style={{ marginTop: Spacing.lg }}>
                        No transactions found
                    </AppText>
                    <AppText color={colors.textSecondary} style={{ textAlign: 'center', marginTop: Spacing.xs }}>
                        Your transaction history will appear here once you start using your wallet.
                    </AppText>
                </View>
            ) : null
        }
        renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleTxPress(item)}>
                <TransactionItem 
                    id={item.id}
                    type={item.type}
                    title={item.description}
                    date={formatDate(item.createdAt)}
                    amount={item.amount}
                    status={item.status}
                />
            </TouchableOpacity>
        )}
        ListFooterComponent={loading ? renderSkeleton : <View style={{ height: Spacing.xl }} />}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <AppModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Transaction Details"
      >
          {selectedTx && (
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <View style={[
                          styles.modalIconContainer, 
                          { backgroundColor: (selectedTx.type === 'CREDIT' || selectedTx.type === 'REVENUE') ? '#E8F5E9' : selectedTx.type === 'LOCKED' ? '#FFF3E0' : '#FFEBEE' }
                      ]}>
                          <MaterialCommunityIcons 
                              name={(selectedTx.type === 'CREDIT' || selectedTx.type === 'REVENUE') ? 'arrow-down-bold' : selectedTx.type === 'DEBIT' ? 'arrow-up-bold' : 'lock-outline'} 
                              size={32} 
                              color={(selectedTx.type === 'CREDIT' || selectedTx.type === 'REVENUE') ? '#2E7D32' : selectedTx.type === 'LOCKED' ? '#E65100' : '#C62828'} 
                          />
                      </View>
                      <AppText variant="bold" size="xl" style={styles.modalAmount}>
                          {(selectedTx.type === 'CREDIT' || selectedTx.type === 'REVENUE') ? '+' : (selectedTx.type === 'LOCKED' ? '' : '-')}₦{selectedTx.amount.toLocaleString()}
                      </AppText>
                      <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(selectedTx.status) + '20' }
                      ]}>
                          <AppText variant="bold" size="xs" style={[styles.statusText, { color: getStatusColor(selectedTx.status) }]}>
                              {selectedTx.status}
                          </AppText>
                      </View>
                  </View>

                  <View style={styles.modalDetails}>
                      <View style={styles.verticalDetail}>
                          <AppText color={colors.textSecondary} size="xs" variant="bold" style={{ textTransform: 'uppercase', marginBottom: 4 }}>Reference ID</AppText>
                          <TouchableOpacity 
                              style={[styles.idContainer, { backgroundColor: colors.surface, justifyContent: 'space-between' }]}
                              onPress={() => copyToClipboard(selectedTx.id)}
                          >
                              <AppText style={styles.idText}>{selectedTx.id}</AppText>
                              <MaterialCommunityIcons name="content-copy" size={14} color={colors.primary} />
                          </TouchableOpacity>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      <View style={styles.detailRow}>
                          <AppText color={colors.textSecondary} size="sm">Transaction Type</AppText>
                          <AppText variant="bold" size="sm">{selectedTx.type}</AppText>
                      </View>

                      <View style={styles.detailRow}>
                          <AppText color={colors.textSecondary} size="sm">Date & Time</AppText>
                          <AppText variant="medium" size="sm">{formatDate(selectedTx.createdAt)}</AppText>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      <View style={styles.verticalDetail}>
                          <AppText color={colors.textSecondary} size="xs" variant="bold" style={{ textTransform: 'uppercase', marginBottom: 4 }}>Description</AppText>
                          <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 8 }}>
                             <AppText variant="medium" size="sm" color={colors.text}>{selectedTx.description}</AppText>
                          </View>
                      </View>
                  </View>

                  <Ripple 
                      style={[styles.closeButton, { backgroundColor: colors.primary }]}
                      onPress={() => setModalVisible(false)}
                      rippleColor="rgba(255,255,255,0.2)"
                  >
                      <AppText variant="bold" color="#FFFFFF">Close</AppText>
                  </Ripple>
              </View>
          )}
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalAmount: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    textTransform: 'uppercase',
  },
  modalDetails: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  verticalDetail: {
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 11,
    flex: 1,
  },
  closeButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
