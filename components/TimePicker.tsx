import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Clock, Moon, Sun, X } from 'phosphor-react-native';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  busySlots?: string[];
  minTimeMinutes?: number;
  workHours?: string;
  title?: string;
}

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24 * 4; i++) {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const displayM = m === 0 ? '00' : m < 10 ? `0${m}` : m.toString();
    const timeStr = `${displayH}:${displayM} ${period}`;
    const minutes = h * 60 + m;
    
    let section: 'morning' | 'afternoon' | 'evening' | 'night' = 'night';
    if (h >= 5 && h < 12) section = 'morning';
    else if (h >= 12 && h < 17) section = 'afternoon';
    else if (h >= 17 && h < 22) section = 'evening';
    
    slots.push({ time: timeStr, minutes, section, h, m });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return -1;
  if (timeStr.includes(' ')) {
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const TimePicker = ({ 
  visible, 
  onClose, 
  onSelect, 
  busySlots = [], 
  minTimeMinutes = -1,
  workHours = "08:00-18:00",
  title = 'Select Time' 
}: TimePickerProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const WINDOW_MINUTES = 180;

  // Parse work hours e.g., "08:00-18:00"
  let startMinutes = 480; // 8 AM
  let endMinutes = 1080; // 6 PM
  if (workHours && workHours.includes('-')) {
    const [start, end] = workHours.split('-');
    startMinutes = timeToMinutes(start.trim());
    endMinutes = timeToMinutes(end.trim());
  }

  const getSlotStatus = (slotMins: number) => {
    // 1. Check if outside work hours
    if (slotMins < startMinutes || slotMins >= endMinutes) return 'CLOSED';

    // 2. Check if it's in the past (for today)
    if (minTimeMinutes !== -1 && slotMins < minTimeMinutes) return 'PASSED';

    // 3. Check if overlapping with busy slots
    const busy = busySlots.some(busyTime => {
      const busyMins = timeToMinutes(busyTime as string);
      return Math.abs(slotMins - busyMins) < WINDOW_MINUTES;
    });
    if (busy) return 'BUSY';

    return null;
  };

  const sections = [
    { id: 'morning', title: 'Morning', icon: <Sun size={20} color="#F59E0B" /> },
    { id: 'afternoon', title: 'Afternoon', icon: <Sun size={20} color="#EA580C" /> },
    { id: 'evening', title: 'Evening', icon: <Moon size={20} color="#6366F1" /> },
    { id: 'night', title: 'Late Night', icon: <Moon size={20} color="#1E293B" /> }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
           <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={22} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="bold" size="lg">{title}</AppText>
            </View>
            <Ripple 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
              rippleCentered={true}
              rippleContainerBorderRadius={20}
            >
              <X size={20} color={colors.text} />
            </Ripple>
          </View>

          <View style={styles.calendarHeader}>
            {[':00', ':15', ':30', ':45'].map((m) => (
              <View key={m} style={styles.dayHeader}>
                <AppText size="xs" color={colors.textSecondary} variant="bold">{m}</AppText>
              </View>
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {sections.map((sec) => {
              const slots = TIME_SLOTS.filter(s => s.section === sec.id);
              if (slots.length === 0) return null;

              // Group by hour
              const hours = Array.from(new Set(slots.map(s => s.h)));

              return (
                <View key={sec.id} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    {sec.icon}
                    <AppText variant="bold" style={{ marginLeft: 8 }}>{sec.title}</AppText>
                  </View>
                  
                  {hours.map(h => {
                    const hourSlots = slots.filter(s => s.h === h);
                    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
                    const period = h < 12 ? 'AM' : 'PM';

                    return (
                      <View key={h} style={styles.hourRow}>
                        <View style={styles.hourLabel}>
                           <AppText size="xs" variant="bold" color={colors.textSecondary}>{displayH} {period}</AppText>
                        </View>
                        <View style={styles.grid}>
                          {hourSlots.map((s) => {
                            const status = getSlotStatus(s.minutes);
                            const disabled = !!status;
                            return (
                              <Ripple
                                key={s.time}
                                style={[
                                  styles.timeSlot,
                                  { backgroundColor: colors.surface, borderColor: colors.border },
                                  disabled && { opacity: 0.3 }
                                ]}
                                onPress={() => !disabled && onSelect(s.time)}
                                disabled={disabled}
                              >
                                <AppText 
                                  size="xs" 
                                  variant={disabled ? 'regular' : 'bold'} 
                                  color={disabled ? colors.textSecondary : colors.text}
                                >
                                  {s.time.split(':')[1].split(' ')[0]}
                                </AppText>
                                {status && (
                                  <AppText size="xs" color={status === 'BUSY' ? colors.primary : colors.textSecondary} style={{ fontSize: 7, marginTop: 1 }}>
                                    {status}
                                  </AppText>
                                )}
                              </Ripple>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    height: height * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  calendarHeader: {
    flexDirection: 'row',
    paddingLeft: 70, 
    paddingRight: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hourLabel: {
    width: 50,
    marginRight: 10,
    alignItems: 'flex-end',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
