import { AppButton } from '@/components/AppButton';
import { AppModal } from '@/components/AppModal';
import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import * as Battery from 'expo-battery';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ambulance, BellRinging, Phone, Plus, ShieldWarning, Siren } from 'phosphor-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppAlert } from './AppAlert';

interface SOSModalProps {
    visible: boolean;
    onClose: () => void;
}

const EMERGENCY_NUMBERS = [
    { id: '1',  name: 'General Emergency', number: '112', icon: Siren, color: '#FF4444' },
    { id: '2', name: 'Police Force', number: '199', icon: ShieldWarning, color: '#3366FF' },
    { id: '3', name: 'Ambulance / Medical', number: '122', icon: Ambulance, color: '#FF8800' }, // Lagos Emergency
];

export function SOSModal({ visible, onClose }: SOSModalProps) {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const { user } = useAuthStore();
    
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertSent, setAlertSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const [customAlertVisible, setCustomAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({ title: '', message: '', type: 'info' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ title, message, type });
        setCustomAlertVisible(true);
    };

    const hasContact = !!user?.emergencyContactName;

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleAlertContact = async () => {
        if (!hasContact) {
            onClose();
            router.push('/emergency-contact');
            return;
        }

        setLoading(true);
        try {
            // 1. Get Location Permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Denied', 'Location access is required to send your coordinates in an emergency.', 'error');
                setLoading(false);
                return;
            }

            // 2. Get Current Location (Quickly)
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // 3. Get Battery Level
            const batteryLevelValue = await Battery.getBatteryLevelAsync();
            const batteryLevel = Math.round(batteryLevelValue * 100);

            // 4. Dispatch to Backend
            await api.post('/sos/dispatch', {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                batteryLevel: batteryLevel
            });

            setAlertSent(true);
            setAlertVisible(true);
        } catch (error: any) {
            console.error('[SOS] Dispatch failed:', error);
            showAlert(
                'Dispatch Failed', 
                'We couldn\'t send the SMS via the server. Please try calling your contact directly if this is an immediate emergency.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Emergency Assistance"
        >
            <View>
                <AppText color={colors.textSecondary} size="sm" style={{ marginBottom: Spacing.lg }}>
                    Tap a number to call immediately or alert your emergency contact.
                </AppText>

                <AppText variant="bold" size="sm" style={{ marginBottom: Spacing.md }}>
                    Emergency Services
                </AppText>
                
                <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
                    {EMERGENCY_NUMBERS.map(item => (
                        <Ripple 
                            key={item.id}
                            onPress={() => handleCall(item.number)}
                            style={[
                                styles.emergencyCard, 
                                { backgroundColor: colors.surface, borderColor: colors.border }
                            ]}
                        >
                            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                <item.icon size={24} color={item.color} weight="fill" />
                            </View>
                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                                <AppText variant="bold">{item.name}</AppText>
                                <AppText size="sm" color={colors.textSecondary}>{item.number}</AppText>
                            </View>
                            <View style={[styles.callBtn, { backgroundColor: colors.success + '20' }]}>
                                <Phone size={20} color={colors.success} weight="fill" />
                            </View>
                        </Ripple>
                    ))}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <AppText variant="bold" size="sm" style={{ marginBottom: Spacing.md, marginTop: Spacing.lg }}>
                    Emergency Contact
                </AppText>

                <View style={[styles.contactCard, { 
                    backgroundColor: hasContact ? colors.error + '10' : colors.surface, 
                    borderColor: hasContact ? colors.error : colors.border 
                }]}>
                    {hasContact ? (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                                <View style={[styles.avatar, { backgroundColor: colors.error }]}>
                                    <AppText variant="bold" color="#fff" size="lg">{user?.emergencyContactName?.charAt(0)}</AppText>
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <AppText variant="bold" size="md">{user?.emergencyContactName}</AppText>
                                    <AppText size="sm" color={colors.textSecondary}>{user?.emergencyContactRelationship} • {user?.emergencyContactPhone}</AppText>
                                </View>
                            </View>
                            
                            <AppButton 
                                title={alertSent ? "Alert Sent!" : "Send SOS Alert"} 
                                onPress={handleAlertContact}
                                loading={loading}
                                style={{ backgroundColor: colors.error, borderColor: colors.error }}
                                disabled={alertSent || loading}
                                icon={<BellRinging size={20} color="#fff" weight="fill" style={{ marginRight: 8 }} />}
                            />
                            <AppText size="xs" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                                Sends your current location and an emergency message.
                            </AppText>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: Spacing.sm }}>
                            <AppText color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: Spacing.md }}>
                                You haven't added an emergency contact yet.
                            </AppText>
                            <AppButton 
                                title="Add Contact" 
                                onPress={handleAlertContact}
                                variant="outline"
                                icon={<Plus size={16} color={colors.primary} weight="bold" style={{ marginRight: 4 }} />}
                            />
                        </View>
                    )}
                </View>
            </View>

            <AppAlert 
                visible={alertVisible}
                type="success"
                title="SOS Alert Sent"
                message={`Emergency message sent to ${user?.emergencyContactName}.`}
                onConfirm={() => {
                    setAlertVisible(false);
                    onClose();
                }}
            />

            <AppAlert 
                visible={customAlertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={() => setCustomAlertVisible(false)}
            />
        </AppModal>
    );
}

const styles = StyleSheet.create({
    emergencyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
    },
    contactCard: {
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
