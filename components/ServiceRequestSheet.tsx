import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contractService } from '@/services/contract.service';
import { usePresenceStore } from '@/store/usePresenceStore';
import axios from 'axios';
import * as Location from 'expo-location';
import { Calendar, Clock, Info, MapPin, NavigationArrow, X } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { AppTextArea } from './AppTextArea';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface ServiceRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  bee: any;
  agentId: string;
  roomId: string;
  onSuccess: (contract: any) => void;
}

export const ServiceRequestSheet = ({ visible, onClose, bee, agentId, roomId, onSuccess }: ServiceRequestSheetProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState('');
  const [serviceType, setServiceType] = useState<'TASK' | 'INSPECTION'>('TASK');
  const [workDate, setWorkDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('');
  const [busySlots, setBusySlots] = useState<string[]>([]);
  
  // Location
  const [address, setAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  // Sync busy slots in realtime if presence store updates for this agent
  const agentPresence = usePresenceStore(state => state.presences[agentId]);

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertTo24h = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes(':') && (timeStr.includes('AM') || timeStr.includes('PM'))) {
      const [time, period] = timeStr.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }
    return timeStr;
  };

  useEffect(() => {
    if (visible && workDate) {
      const dateStr = getLocalISODate(workDate);
      contractService.getBusySlots(agentId, dateStr)
        .then(setBusySlots)
        .catch(err => console.error('Failed to refresh busy slots:', err));
    }
  }, [visible, workDate, agentPresence?.isBooked, agentPresence?.bookedTime]);

  const handleUseCurrentLocation = async () => {
    try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setLocationLoading(false);
            return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        setLocationCoords({ lat: latitude, lng: longitude });

        let locString = '';
        
        try {
            const addressRes = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (addressRes && addressRes.length > 0) {
                const addr = addressRes[0];
                const components = [addr.street, addr.district, addr.city, addr.region].filter(Boolean);
                locString = components.slice(0, 2).join(', ');
                if (!locString && addr.name) locString = addr.name;
            }
        } catch (nativeError) {
            console.warn('[Location] Native geocoding failed, trying Google fallback...', nativeError);
        }

        if (!locString && GOOGLE_PLACES_API_KEY) {
            try {
                const googleResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_PLACES_API_KEY}`
                );
                
                if (googleResponse.data.results && googleResponse.data.results.length > 0) {
                    locString = googleResponse.data.results[0].formatted_address;
                    const parts = locString.split(',');
                    if (parts.length > 2) locString = parts.slice(0, 2).join(',').trim();
                }
            } catch (googleError) {
                console.error('[Location] Google fallback failed:', googleError);
            }
        }
        
        if (locString) {
            setAddress(locString);
        }
    } catch (error: any) {
        console.error('[Location] Error fetching location:', error);
    } finally {
        setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!details || !workDate || !startTime || !address) {
      return;
    }

    try {
      setLoading(true);
      const data = {
        beeId: bee.id,
        agentId,
        type: serviceType,
        details,
        workDate: getLocalISODate(workDate),
        startTime: convertTo24h(startTime),
        address,
        latitude: locationCoords?.lat || 0, 
        longitude: locationCoords?.lng || 0, 
        roomId,
      };

      const response = await contractService.createRequest(data);
      onSuccess(response);
      onClose();
    } catch (error) {
      console.error('Failed to request service:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        weekday: 'long' 
    };
    const str = date.toLocaleDateString('en-US', options);
    // Typical output: "Tuesday, Feb 17, 2026"
    const parts = str.split(', ');
    if (parts.length < 3) return str.toLowerCase();
    
    const weekday = parts[0];
    const datePart = parts[1]; // "Feb 17"
    const yearPart = parts[2]; // "2026"
    
    const [month, day] = datePart.split(' ');
    // Result: "feb, 17, 2026: tuesday"
    return `${month}, ${day}, ${yearPart}: ${weekday}`.toLowerCase();
  };

  const isSelectedDateToday = workDate?.toDateString() === new Date().toDateString();
  const minTimeMinutes = isSelectedDateToday ? (new Date().getHours() * 60 + new Date().getMinutes()) : -1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Ripple style={styles.dismissArea} onPress={onClose} rippleOpacity={0} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View>
                <AppText variant="bold" size="lg">Hiring for: {bee?.title}</AppText>
                <AppText size="sm" color={colors.textSecondary}>Specify job details</AppText>
            </View>
            <Ripple onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <X size={20} color={colors.text} />
            </Ripple>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {bee?.offersInspection && (
              <View style={styles.section}>
                <AppText variant="bold" style={styles.label}>What type of booking?</AppText>
                <View style={styles.typeContainer}>
                   <Ripple 
                      onPress={() => setServiceType('TASK')}
                      style={[
                        styles.typeTab, 
                        serviceType === 'TASK' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                   >
                     <AppText color={serviceType === 'TASK' ? '#fff' : colors.text} variant="bold" size="sm">Standard Task</AppText>
                   </Ripple>
                   <Ripple 
                      onPress={() => setServiceType('INSPECTION')}
                      style={[
                        styles.typeTab, 
                        serviceType === 'INSPECTION' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                   >
                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AppText color={serviceType === 'INSPECTION' ? '#fff' : colors.text} variant="bold" size="sm">Inspection</AppText>
                        {(bee.inspectionPrice !== null && bee.inspectionPrice !== undefined) && (
                          <View style={[styles.priceBadge, { backgroundColor: serviceType === 'INSPECTION' ? 'rgba(255,255,255,0.2)' : colors.primary + '15' }]}>
                             <AppText size="xs" color={serviceType === 'INSPECTION' ? '#fff' : colors.primary} variant="bold">₦{Number(bee.inspectionPrice).toLocaleString()}</AppText>
                          </View>
                        )}
                     </View>
                   </Ripple>
                </View>
                <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 6 }}>
                  {serviceType === 'INSPECTION' 
                    ? "Identify the problem first. The agent will visit your location to inspect and provide a full quote." 
                    : "Book a direct service if you already know what needs to be fixed."}
                </AppText>
              </View>
            )}

            <View style={styles.section}>
              <AppText variant="bold" style={styles.label}>What needs to be done?</AppText>
              <AppTextArea
                placeholder="e.g. Broken pipe in the kitchen, needs urgent fixing."
                value={details}
                onChangeText={setDetails}
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
                <AppText variant="bold" style={styles.label}>When should the work start?</AppText>
                
                <Ripple 
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.pickerTrigger, { borderColor: colors.border }]}
                >
                    <Calendar size={20} color={colors.primary} />
                    <AppText style={styles.pickerText}>
                        {formatDisplayDate(workDate)}
                    </AppText>
                </Ripple>

                <View style={styles.row}>
                    <Ripple 
                        onPress={() => setShowStartTimePicker(true)}
                        style={[styles.pickerTrigger, { borderColor: colors.border, flex: 1 }]}
                    >
                        <Clock size={20} color={colors.primary} />
                        <AppText style={styles.pickerText}>
                            {startTime || 'Start Time'}
                        </AppText>
                    </Ripple>
                </View>
            </View>

            <View style={styles.section}>
              <AppText variant="bold" style={styles.label}>Where is the location?</AppText>
              <AppTextArea
                placeholder="Enter work address"
                numberOfLines={3}
                containerStyle={styles.locationInput}
                leftIcon={<MapPin size={20} color={colors.primary} />}
                value={address}
                onChangeText={setAddress}
                minHeight={80}
              />
              <Ripple 
                onPress={handleUseCurrentLocation}
                disabled={locationLoading}
                style={[styles.locationBtn, { borderColor: colors.primary + '30' }]}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <NavigationArrow size={16} color={colors.primary} weight="fill" />
                    <AppText size="xs" variant="bold" color={colors.primary} style={{ marginLeft: 6 }}>Use My Current Location</AppText>
                  </>
                )}
              </Ripple>
              <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 12 }}>
                <Info size={12} /> Precisely describe your location for the Agent.
              </AppText>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
                <AppText size="sm" color={colors.primary}>
                    Sending this request will notify the Agent. They will then provide a quote (Workmanship + Transport + Materials) for your approval.
                </AppText>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <AppButton
              title="Send Service Request"
              onPress={handleSubmit}
              loading={loading}
              disabled={!details || !workDate || !startTime || !address}
            />
          </View>
        </View>

        <DatePicker 
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={async (date) => {
                setWorkDate(date);
                setShowDatePicker(false);
                setStartTime(''); // Reset time when date changes
                
                // Fetch busy slots for this date
                try {
                  const dateStr = getLocalISODate(date);
                  const slots = await contractService.getBusySlots(agentId, dateStr);
                  setBusySlots(slots);
                } catch (error) {
                  console.error('Failed to fetch busy slots:', error);
                }
            }}
        />

        <TimePicker 
            visible={showStartTimePicker}
            title="Start Time"
            onClose={() => setShowStartTimePicker(false)}
            busySlots={busySlots}
            minTimeMinutes={minTimeMinutes}
            workHours={bee?.workHours}
            onSelect={(time) => {
                setStartTime(time);
                setShowStartTimePicker(false);
            }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.md,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  textArea: {
    height: 100,
  },
  locationInput: {
    height: 80,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  row: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  pickerText: {
    marginLeft: 12,
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
