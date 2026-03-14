import { AppButton } from '@/components/AppButton';
import { AppModal } from '@/components/AppModal';
import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PayoutBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  workmanship: number;
  transport: number;
  materials?: { item: string; cost: number }[];
  serviceFee: number;
  total: number;
}

export const PayoutBreakdownModal = ({ 
  visible, 
  onClose, 
  workmanship, 
  transport, 
  materials = [], 
  serviceFee, 
  total 
}: PayoutBreakdownModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <AppModal visible={visible} onClose={onClose} title="Price Breakdown">
      <View style={{ padding: Spacing.sm }}>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <AppText color={colors.textSecondary}>Workmanship</AppText>
            <AppText variant="semiBold">₦{workmanship.toLocaleString()}</AppText>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <AppText color={colors.textSecondary}>Logistics & Transport</AppText>
            <AppText variant="semiBold">₦{transport.toLocaleString()}</AppText>
        </View>

        {materials.length > 0 && materials.map((m, i) => (
           <View key={i} style={[styles.row, { borderBottomColor: colors.border, paddingLeft: Spacing.md }]}>
                <AppText color={colors.textSecondary} size="sm">• {m.item}</AppText>
                <AppText variant="medium" size="sm">₦{m.cost.toLocaleString()}</AppText>
            </View>
        ))}

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <AppText color={colors.textSecondary}>Service Fee (Platform)</AppText>
            <AppText variant="semiBold">₦{serviceFee.toLocaleString()}</AppText>
        </View>

        <View style={[styles.row, { borderBottomWidth: 0, marginTop: Spacing.sm }]}>
            <AppText variant="bold" size="lg">Total Outlay</AppText>
            <AppText variant="bold" size="lg" color={colors.primary}>₦{total.toLocaleString()}</AppText>
        </View>

        <AppButton title="Close" onPress={onClose} style={{ marginTop: Spacing.xl }} />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});
