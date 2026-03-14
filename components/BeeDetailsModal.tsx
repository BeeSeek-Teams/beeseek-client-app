import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { BeeSearchResult } from '@/components/BeeSearchResultCard';
import { borderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { analyticsService } from '@/services/analytics.service';
import { chatService } from '@/services/chat.service';
import { usePresenceStore, UserStatus } from '@/store/usePresenceStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    CheckCircle,
    Crown,
    Flag,
    Info,
    MapPin,
    Rocket,
    ShareNetwork,
    ShieldCheck,
    Star,
    User,
    X
} from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    View
} from 'react-native';
import Ripple from 'react-native-material-ripple';

interface BeeDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    bee: BeeSearchResult | null;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const BeeDetailsModal = ({ visible, onClose, bee }: BeeDetailsModalProps) => {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const presence = usePresenceStore(state => bee ? state.presences[bee.agent.id] : null);
    const isOnline = presence?.status === UserStatus.ONLINE;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (visible && bee?.id) {
            analyticsService.trackView(bee.id);
        }
    }, [visible, bee?.id]);

    const handleShare = async () => {
        if (!bee) return;
        try {
            const shareUrl = `https://www.beeseek.site/bee/${bee.id}`;
            await Share.share({
                message: `Check out this service on BeeSeek: ${bee.title}\n${shareUrl}`,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Error sharing bee:', error);
        }
    };

    if (!bee) return null;

    const getStatusInfo = () => {
        if (!bee?.agent) return { label: 'Currently Offline', color: colors.textSecondary, bg: colors.surface };
        if (!bee.agent.isAvailable) return { label: 'Currently Offline', color: colors.textSecondary, bg: colors.surface };
        
        if (bee.agent.isBooked) {
            try {
                if (bee.agent.bookedDate && bee.agent.bookedTime) {
                    const now = new Date();
                    const [year, month, day] = bee.agent.bookedDate.split('-').map(Number);
                    const [hours, minutes] = bee.agent.bookedTime.split(':').map(Number);
                    
                    const bookingStart = new Date(year, month - 1, day, hours, minutes);
                    const diffMs = Math.abs(now.getTime() - bookingStart.getTime());
                    const diffMins = diffMs / (1000 * 60);
                    
                    if (diffMins <= 30) {
                        return { label: 'WORKING NOW • Support on standby', color: colors.error, bg: colors.error + '15' };
                    }
                }
            } catch (e) {}
            
            const timeStr = bee.agent.bookedTime ? ` at ${bee.agent.bookedTime.slice(0, 5)}` : '';
            return { label: `ALREADY BOOKED${timeStr}`, color: colors.warning, bg: colors.warning + '15' };
        }
        
        return { label: 'ONLINE & READY', color: colors.success, bg: colors.success + '15' };
    };

    const { label: statusLabel, color: statusColor, bg: statusBg } = getStatusInfo();

    // Use bee.images if available, otherwise just coverImage if available, else empty array
    const images = bee.images && bee.images.length > 0 ? bee.images : (bee.coverImage ? [bee.coverImage] : []);

    const HasInspection = bee.offersInspection;
    const InspectionPrice = bee.inspectionPrice;
    const WorkHours = bee.workHours || 'Mon - Fri: 09:00 AM - 05:00 PM';
    const LocationStr = bee.location || 'Lekki Phase 1, Lagos';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background, height: SCREEN_HEIGHT * 0.9 }]}>
                    
                    {/* Header / Image Slider */}
                    <View style={styles.imageContainer}>
                        {images.length > 0 ? (
                            <Image 
                                source={{ uri: images[currentImageIndex] }} 
                                style={styles.headerImage} 
                                contentFit="cover"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={[styles.placeholderImage, { backgroundColor: colors.surface }]}>
                                <Info size={64} color={colors.textSecondary} weight="duotone" />
                                <AppText style={{ marginTop: Spacing.sm }} color={colors.textSecondary}>No images available</AppText>
                            </View>
                        )}

                        {/* Pagination Dots (if multiple images) */}
                        {images.length > 1 && (
                            <View style={styles.pagination}>
                                {images.map((_, idx) => (
                                    <View 
                                        key={idx} 
                                        style={[
                                            styles.dot, 
                                            { backgroundColor: idx === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                                        ]} 
                                    />
                                ))}
                            </View>
                        )}

                        {/* Close Button */}
                        <Ripple 
                            style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
                            onPress={onClose}
                            rippleContainerBorderRadius={18}
                        >
                            <X size={20} color="#FFF" weight="bold" />
                        </Ripple>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Title & Category */}
                        <View style={styles.section}>
                            <View style={styles.categoryBadgeContainer}>
                                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
                                    <AppText size="xs" variant="bold" color={colors.primary}>
                                        {bee.category}
                                    </AppText>
                                </View>
                                {HasInspection && (
                                    <View style={[styles.categoryBadge, { backgroundColor: colors.success + '15', marginLeft: Spacing.sm }]}>
                                        <AppText size="xs" variant="bold" color={colors.success}>
                                            Inspection Available
                                        </AppText>
                                    </View>
                                )}
                            </View>

                            <AppText variant="bold" size="2xl" style={{ marginTop: Spacing.xs }}>
                                {bee.title}
                            </AppText>

                            <View style={styles.metaRow}>
                                <Star size={18} color={Colors.light.warning} weight="fill" />
                                <AppText variant="bold" style={{ marginLeft: 4 }}>{bee.rating}</AppText>
                                <AppText color={colors.textSecondary}> ({bee.jobsCompleted} jobs)</AppText>
                                <View style={[styles.dotSeparator, { backgroundColor: colors.textSecondary }]} />
                                <AppText variant="bold" color={colors.primary}>Price Negotiable</AppText>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* Description & Location */}
                        <View style={styles.section}>
                            <AppText variant="bold" size="lg" style={{ marginBottom: Spacing.sm }}>Service Details</AppText>
                            <AppText style={{ lineHeight: 22 }} color={colors.text}>
                                {bee.description}
                            </AppText>
                            
                            <View style={styles.detailRow}>
                                <MapPin size={20} color={colors.textSecondary} />
                                <AppText style={{ marginLeft: Spacing.sm }} color={colors.textSecondary}>
                                    {LocationStr} ({bee.distance}km away)
                                </AppText>
                            </View>

                            <View style={styles.detailRow}>
                                <CheckCircle size={20} color={colors.textSecondary} />
                                <AppText style={{ marginLeft: Spacing.sm }} color={colors.textSecondary}>
                                    Open: {WorkHours}
                                </AppText>
                            </View>
                        </View>

                        {/* Important Notes Box */}
                        <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.noteHeader}>
                                <Info size={20} color={colors.primary} weight="fill" />
                                <AppText variant="bold" size="sm" style={{ marginLeft: Spacing.xs }}>Service Notes</AppText>
                            </View>
                            <View style={styles.bulletPoint}>
                                <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
                                <AppText size="sm" style={{ flex: 1, lineHeight: 20 }}>
                                    Transport fare is separate and calculated automatically based on distance.
                                </AppText>
                            </View>
                            <View style={styles.bulletPoint}>
                                <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
                                <AppText size="sm" style={{ flex: 1, lineHeight: 20 }}>
                                    A formal contract is created when you book this service.
                                </AppText>
                            </View>
                            {HasInspection && (
                                <View style={styles.bulletPoint}>
                                    <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
                                    <AppText size="sm" style={{ flex: 1, lineHeight: 20 }}>
                                        Inspection fee: <AppText variant="bold">₦{Number(InspectionPrice).toLocaleString()}</AppText> (Deducted from final bill if hired).
                                    </AppText>
                                </View>
                            )}
                        </View>

                        {bee.clientRequirements ? (
                            <View style={styles.section}>
                                <AppText variant="bold" size="lg" style={{ marginBottom: Spacing.sm }}>Client Requirements</AppText>
                                <View style={[styles.noteBox, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '20', borderStyle: 'dashed' }]}>
                                    <AppText size="sm" style={{ lineHeight: 22, color: colors.text }}>
                                        {bee.clientRequirements}
                                    </AppText>
                                </View>
                            </View>
                        ) : null}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* Agent Profile */}
                        <View style={styles.section}>
                            <AppText variant="bold" size="lg" style={{ marginBottom: Spacing.md }}>Service Agent</AppText>
                            
                            {bee?.agent ? (
                            <View style={styles.agentCard}>
                                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                                    {bee.agent.avatar ? (
                                        <Image 
                                            source={{ uri: bee.agent.avatar }} 
                                            style={styles.avatar}
                                            contentFit="cover"
                                            transition={200}
                                            cachePolicy="memory-disk"
                                        />
                                    ) : (
                                        <User size={24} color={colors.textSecondary} weight="bold" />
                                    )}
                                </View>
                                <View style={styles.agentInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <AppText variant="bold" size="lg">{bee.agent.name || 'Service Provider'}</AppText>
                                        {bee.agent.isVerified && (
                                            <ShieldCheck size={18} color={Colors.light.success} weight="fill" style={{ marginLeft: 4 }} />
                                        )}
                                        <View style={{ 
                                            flexDirection: 'row', 
                                            alignItems: 'center', 
                                            marginLeft: 8,
                                            backgroundColor: isOnline ? colors.success + '15' : colors.surface,
                                            paddingHorizontal: 8,
                                            paddingVertical: 2,
                                            borderRadius: 12,
                                        }}>
                                            <View style={{ 
                                                width: 6, 
                                                height: 6, 
                                                borderRadius: 3, 
                                                backgroundColor: isOnline ? colors.success : '#D1D5DB' 
                                            }} />
                                            <AppText 
                                                size="xs" 
                                                variant="bold"
                                                color={isOnline ? colors.success : colors.textSecondary} 
                                                style={{ marginLeft: 4 }}
                                            >
                                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                                            </AppText>
                                        </View>
                                        {bee.agent.achievements?.earlyAccess && (
                                            <View style={[styles.achievementBadge, { backgroundColor: '#3B82F6' }]}>
                                                <Rocket size={10} color="#FFF" weight="fill" />
                                            </View>
                                        )}
                                        {bee.agent.achievements?.topRated && (
                                            <View style={[styles.achievementBadge, { backgroundColor: '#EAB308' }]}>
                                                <Star size={10} color="#FFF" weight="fill" />
                                            </View>
                                        )}
                                        {bee.agent.achievements?.goldenBadge && (
                                            <View style={[styles.achievementBadge, { backgroundColor: '#F59E0B' }]}>
                                                <Crown size={10} color="#FFF" weight="fill" />
                                            </View>
                                        )}
                                    </View>
                                    <AppText size="sm" color={colors.textSecondary} style={{ marginTop: 2 }}>
                                        Member since {bee.agent.joinedAt ? new Date(bee.agent.joinedAt).getFullYear() : '2025'} {bee.agent.isVerified && '• Verified Pro'}
                                    </AppText>
                                </View>
                            </View>
                            ) : (
                                <View style={[styles.noteBox, { backgroundColor: colors.surface }]}>
                                    <AppText color={colors.textSecondary}>Agent information unavailable</AppText>
                                </View>
                            )}
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md }}>
                                <View style={[styles.statusBadge, { 
                                    backgroundColor: statusBg 
                                }]}>
                                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                    <AppText size="xs" variant="bold" color={statusColor}>
                                        {statusLabel}
                                    </AppText>
                                </View>

                                <Ripple 
                                    style={[styles.profileBtn, { borderColor: colors.border }]}
                                    onPress={() => {
                                        onClose();
                                        router.push(`/agent-profile/${bee?.agent?.id}`);
                                    }}
                                    rippleContainerBorderRadius={20}
                                    disabled={!bee?.agent?.id}
                                >
                                    <AppText size="xs" variant="bold">View Profile</AppText>
                                </Ripple>
                            </View>
                        </View>

                        {/* Bottom Padding for scroll */}
                        <View style={{ height: 130 }} />
                    </ScrollView>

                    {/* Fixed Footer Actions */}
                    <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.actionRow}>
                            <Ripple style={styles.iconBtn} onPress={handleShare} rippleCentered rippleContainerBorderRadius={20}>
                                <ShareNetwork size={24} color={colors.text} />
                            </Ripple>
                            <Ripple style={styles.iconBtn} onPress={() => {}} rippleCentered rippleContainerBorderRadius={20}>
                                <Flag size={24} color={colors.text} />
                            </Ripple>
                            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                                <AppButton 
                                    title="Contact & Book"
                                    onPress={async () => {
                                        if (!bee?.agent?.id) {
                                            console.error('Agent information missing');
                                            return;
                                        }
                                        try {
                                            const room = await chatService.getOrCreateRoom(bee.agent.id);
                                            onClose();
                                            router.push({
                                                pathname: '/chat/[id]',
                                                params: { 
                                                    id: room.id, 
                                                    name: bee.agent.name || 'Service Provider', 
                                                    avatarUrl: bee.agent.avatar || '' 
                                                }
                                            });
                                        } catch (error) {
                                            console.error('Failed to create chat room:', error);
                                        }
                                    }}
                                    variant="primary"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pagination: {
        position: 'absolute',
        bottom: Spacing.md,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: Spacing.lg,
    },
    categoryBadgeContainer: {
        flexDirection: 'row',
        marginBottom: Spacing.xs,
    },
    categoryBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginHorizontal: Spacing.sm,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    noteBox: {
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 6,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        marginRight: 8,
    },
    agentCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    achievementBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    profileBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    statusDot: {
        width: 6, 
        height: 6,
        borderRadius: 3,
        marginRight: 6
    },
    footer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.md, // Compact footer
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: Spacing.md,
    }
});
