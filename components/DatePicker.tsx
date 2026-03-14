import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Calendar, X } from 'phosphor-react-native';
import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  title?: string;
}

const generateDates = () => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the start of the current week (Sunday) to align grid
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay());

  // Show 35 days (5 weeks) to fill the grid nicely, but we'll cap selection at 30 days
  for (let i = 0; i < 35; i++) {
    const date = new Date(startDay);
    date.setDate(startDay.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const DATES = generateDates();

export const DatePicker = ({ visible, onClose, onSelect, title = 'Select Date' }: DatePickerProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isPast = (date: Date) => date < today;
  const isTooFar = (date: Date) => date > maxDate;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
           <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={20} color={colors.primary} style={{ marginRight: 8 }} />
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
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <View key={i} style={styles.dayHeader}>
                <AppText size="xs" color={colors.textSecondary} variant="bold">{day}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {DATES.map((date, index) => {
              const past = isPast(date);
              const today = isToday(date);
              const tooFar = isTooFar(date);
              const disabled = past || tooFar;

              return (
                <Ripple
                  key={index}
                  style={[
                    styles.dateCell,
                    today && { backgroundColor: colors.primary + '10', borderColor: colors.primary },
                    disabled && { opacity: 0.3 }
                  ]}
                  onPress={() => !disabled && onSelect(date)}
                  disabled={disabled}
                >
                  <AppText 
                    size="sm" 
                    variant={today ? 'bold' : 'regular'} 
                    color={today ? colors.primary : disabled ? colors.textSecondary : colors.text}
                  >
                    {date.getDate()}
                  </AppText>
                  {today && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
                </Ripple>
              );
            })}
          </View>

          <View style={styles.footer}>
            <AppText size="xs" color={colors.textSecondary}>* You can book up to 30 days in advance</AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  calendarHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
});
