import { AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supportService, SupportTicket } from '@/services/support.service';
import { useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function SupportHistoryScreen() {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isByLoading, setIsByLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertNewTicket, setAlertNewTicket] = useState<SupportTicket | null>(null);

    const fetchTickets = async () => {
        try {
            const data = await supportService.getUserTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
            setIsByLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleCreateTicket = async (subject: string, description: string, evidence?: string[]) => {
        try {
            setIsByLoading(true);
            const newTicket = await supportService.createTicket(subject, description, evidence);
            setIsModalVisible(false);
            // Refresh list or navigate
            fetchTickets();
            Alert.alert('Success', 'Your support ticket has been created.', [
                { text: 'View Ticket', onPress: () => router.push({ pathname: '/support/[id]', params: { id: newTicket.id, subject: newTicket.subject } }) },
                { text: 'Close', style: 'cancel' }
            ]);
        } catch (error: any) {
            console.error('Support ticket creation error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create ticket. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsByLoading(false);
        }
    };

    const renderTicket = ({ item }: { item: SupportTicket }) => (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
            <Ripple 
                onPress={() => router.push({ pathname: '/support/[id]', params: { id: item.id, subject: item.subject } })}
                style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <AppText variant="bold" size="sm" style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>{item.subject}</AppText>
                    <View style={[
                        styles.statusBadge, 
                        { 
                            backgroundColor: item.status === 'OPEN' ? colors.primary + '20' : 
                                            item.status === 'RESOLVED' ? colors.success + '20' : 
                                            item.status === 'IN_PROGRESS' ? colors.secondary + '20' : colors.textSecondary + '20' 
                        }
                    ]}>
                        <AppText 
                            size="xs" 
                            variant="bold"
                            color={item.status === 'OPEN' ? colors.primary : 
                                item.status === 'RESOLVED' ? colors.success : 
                                item.status === 'IN_PROGRESS' ? colors.secondary : colors.textSecondary}
                        >
                            {item.status}
                        </AppText>
                    </View>
                </View>
                <AppText size="xs" color={colors.textSecondary}>Ticket ID: {item.id.split('-')[0].toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}</AppText>
            </Ripple>
        </View>
    );

    const renderSkeleton = () => (
        <View style={{ padding: Spacing.lg }}>
            <AppSkeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={80} borderRadius={12} />
        </View>
    );

    return (
        <AppScreen disablePadding>
            <ScreenHeader 
                title="Support History" 
                rightAction={
                    <Ripple onPress={() => setIsModalVisible(true)}>
                        <Plus size={24} color={colors.primary} />
                    </Ripple>
                }
            />
            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={item => item.id}
                    renderItem={renderTicket}
                    contentContainerStyle={{ paddingVertical: Spacing.md }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: Spacing.xl * 2 }}>
                            <AppText color={colors.textSecondary}>No tickets found</AppText>
                        </View>
                    }
                    ListFooterComponent={
                        <View style={{ padding: Spacing.lg }}>
                             <AppButton 
                                title="Report a New Issue" 
                                onPress={() => setIsModalVisible(true)}
                                loading={isByLoading}
                            />
                        </View>
                    }
                />
            )}
            <CreateTicketModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCreateTicket}
            />
            <AppAlert
                visible={alertVisible}
                type={alertType}
                title={alertTitle}
                message={alertMessage}
                confirmText={alertType === 'success' && alertNewTicket ? 'View Ticket' : 'OK'}
                onConfirm={() => {
                    setAlertVisible(false);
                    if (alertType === 'success' && alertNewTicket) {
                        router.push({ pathname: '/support/[id]', params: { id: alertNewTicket.id, subject: alertNewTicket.subject } });
                    }
                }}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    ticketCard: {
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 8,
    }
});
