import { AppAlert } from '@/components/AppAlert';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supportService, SupportTicket } from '@/services/support.service';
import { useRouter } from 'expo-router';
import { CaretDown, CaretUp, EnvelopeSimple, Ticket } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

const FAQS = [
    { id: '1', question: 'How do I know if an Agent is verified?', answer: 'Look for the gold "Verified" badge on their profile. This means they have successfully completed our mandatory NIN (National Identity Number) verification process.' },
    { id: '2', question: 'Can I negotiate the price for a service?', answer: 'Yes! Jobs marked as "Negotiable" allow you to discuss and agree on a final price with the Agent via the chat before the booking is confirmed.' },
    { id: '3', question: 'Is my payment secure?', answer: 'Absolutely. We use an escrow system where your payment is held securely and only released to the Agent once you confirm the job is completed.' },
    { id: '4', question: 'What happens if an Agent doesn\'t show up?', answer: 'If an Agent fails to arrive, report it immediately through this support center. You will receive a full refund, and we will handle the disciplinary process.' },
    { id: '5', question: 'How do I submit a complaint about a job?', answer: 'If you are unsatisfied, do not confirm completion. Open a ticket here with photos of the issue, and our dispute team will mediate within 24 hours.' },
    { id: '6', question: 'Where can I find my Job ID?', answer: 'Go to your Activities, select the specific job, and you will see the "ID" field under the job title. Tap it to copy and paste it into your support ticket.' },
];

const SUPPORT_EMAIL = 'support@beeseek.site';
const SUPPORT_PHONE = '+2347086373024';
const SUPPORT_VANITY = '+234 BEESEEK';

export default function SupportScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isByLoading, setIsByLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertNewTicket, setAlertNewTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const data = await supportService.getUserTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch support data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (subject: string, description: string, evidence?: string[]) => {
        try {
            setIsByLoading(true);
            const newTicket = await supportService.createTicket(subject, description, evidence);
            setIsModalVisible(false);
            fetchInitialData();
            setAlertType('success');
            setAlertTitle('Success');
            setAlertMessage('Your support ticket has been created.');
            setAlertNewTicket(newTicket);
            setAlertVisible(true);
        } catch (error: any) {
            console.error('Support ticket creation error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create ticket. Please try again.';
            setAlertType('error');
            setAlertTitle('Error');
            setAlertMessage(errorMessage);
            setAlertNewTicket(null);
            setAlertVisible(true);
        } finally {
            setIsByLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setExpandedFaq(null); // Collapse all on search
    };

    const toggleFaq = (id: string) => {
        if (expandedFaq === id) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(id);
        }
    };

    const filteredFaqs = FAQS.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderSkeleton = () => (
         <View style={{ padding: Spacing.lg }}>
            <AppSkeleton width={150} height={32} style={{ marginBottom: 8 }} />
            <AppSkeleton width={200} height={20} style={{ marginBottom: Spacing.lg }} />
            <AppSkeleton width="100%" height={50} borderRadius={12} style={{ marginBottom: Spacing.lg }} />
            
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: Spacing.xl }}>
                <AppSkeleton style={{ flex: 1, height: 80 }} borderRadius={12} />
                <AppSkeleton style={{ flex: 1, height: 80 }} borderRadius={12} />
                <AppSkeleton style={{ flex: 1, height: 80 }} borderRadius={12} />
            </View>

            <AppSkeleton width={180} height={24} style={{ marginBottom: Spacing.md }} />
            <AppSkeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
            <AppSkeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        </View>
    );

    return (
        <AppScreen disablePadding>
            <ScreenHeader title="Support" />
            
            {loading ? (
                renderSkeleton()
            ) : (
                <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false}>
                    <View style={{ marginBottom: Spacing.xl }}>
                         <AppText variant="bold" size="xl" style={{ marginBottom: 4 }}>Hello, Client</AppText>
                        <AppText color={colors.textSecondary}>How can we help you today?</AppText>
                    </View>

                    <View style={styles.contactGrid}>
                        <Ripple 
                            onPress={() => router.push('/support/history')}
                            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <Ticket size={24} color={colors.primary} weight="fill" />
                            <AppText variant="bold" size="sm" style={{ marginTop: 8 }}>My History</AppText>
                        </Ripple>
                        <Ripple 
                            onPress={() => setIsModalVisible(true)}
                            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <EnvelopeSimple size={24} color={colors.secondary} weight="fill" />
                            <AppText variant="bold" size="sm" style={{ marginTop: 8 }}>Contact Support</AppText>
                        </Ripple>
                    </View>

                    <View style={{ marginBottom: Spacing.xl }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                            <AppText variant="bold" size="lg">Recent Support Tickets</AppText>
                            <TouchableOpacity onPress={() => router.push('/support/history')}>
                                <AppText color={colors.primary} variant="bold" size="sm">View All</AppText>
                            </TouchableOpacity>
                        </View>
                        
                        {tickets.length > 0 ? (
                            tickets.slice(0, 2).map((item) => (
                                <Ripple 
                                    key={item.id}
                                    onPress={() => router.push({ pathname: '/support/[id]', params: { id: item.id, subject: item.subject } })}
                                    style={[styles.recentTicket, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                >
                                    <View style={{ flex: 1, marginRight: Spacing.md }}>
                                        <AppText variant="bold" size="sm" numberOfLines={1}>{item.subject}</AppText>
                                        <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString()} • {item.id.split('-')[0].toUpperCase()}</AppText>
                                    </View>
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
                                </Ripple>
                            ))
                        ) : (
                            <View style={{ padding: Spacing.xl, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                <Ticket size={48} color={colors.textSecondary + '40'} weight="thin" />
                                <AppText size="sm" color={colors.textSecondary} style={{ marginTop: 12 }}>You have no recent support tickets.</AppText>
                            </View>
                        )}
                    </View>

                    <AppText variant="bold" size="lg" style={{ marginBottom: Spacing.md }}>
                        Frequently Asked Questions
                    </AppText>

                    <View style={{ gap: Spacing.sm }}>
                        {filteredFaqs.map(faq => (
                            <View 
                                key={faq.id} 
                                style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                                <TouchableOpacity 
                                    onPress={() => toggleFaq(faq.id)}
                                    style={styles.faqHeader}
                                >
                                    <AppText variant="medium" style={{ flex: 1 }}>{faq.question}</AppText>
                                    {expandedFaq === faq.id ? (
                                        <CaretUp size={16} color={colors.textSecondary} />
                                    ) : (
                                        <CaretDown size={16} color={colors.textSecondary} />
                                    )}
                                </TouchableOpacity>
                                {expandedFaq === faq.id && (
                                    <View style={styles.faqAnswer}>
                                        <AppText color={colors.textSecondary} size="sm">{faq.answer}</AppText>
                                    </View>
                                )}
                            </View>
                        ))}
                         {filteredFaqs.length === 0 && (
                             <AppText color={colors.textSecondary} style={{ fontStyle: 'italic' }}>No results match your search.</AppText>
                         )}
                    </View>
                </ScrollView>
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
    contactGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.xl,
    },
    contactCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    recentTicket: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.sm
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    faqItem: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        justifyContent: 'space-between',
    },
    faqAnswer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    }
});
