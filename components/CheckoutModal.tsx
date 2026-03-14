import { AppButton } from '@/components/AppButton';
import { AppModal } from '@/components/AppModal';
import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Info, ShieldCheck } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contract: any;
}

export function CheckoutModal({ visible, onClose, onConfirm, contract }: CheckoutModalProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  if (!contract) return null;

  const workmanship = Number(contract.workmanshipCost || 0);
  const transport = Number(contract.transportFare || 0);
  const serviceFee = Number(contract.serviceFee || 0);
  const materialsTotal = (contract.materials || []).reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0);
  
  const subtotal = workmanship + transport + materialsTotal;
  const grandTotal = subtotal + serviceFee;

  const SummaryRow = ({ label, amount, isTotal = false, isFee = false }: any) => (
    <View style={[styles.row, isTotal && [styles.totalRow, { borderTopColor: colors.border }]]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AppText 
           size={isTotal ? 'md' : 'sm'} 
           variant={isTotal ? 'bold' : 'regular'} 
           color={isTotal ? colors.text : colors.textSecondary}
        >
          {label}
        </AppText>
        {isFee && <Info size={14} color={colors.textSecondary} />}
      </View>
      <AppText 
        size={isTotal ? 'lg' : 'sm'} 
        variant="bold"
        color={isTotal ? colors.primary : colors.text}
      >
        ₦{(amount / 100).toLocaleString()}
      </AppText>
    </View>
  );

  return (
    <AppModal 
      visible={visible} 
      onClose={onClose} 
      title="Payment Summary"
    >
      <View style={styles.container}>
        {/* Breakdown Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SummaryRow label="Workmanship" amount={workmanship} />
          <SummaryRow label="Transport Fare" amount={transport} />
          {contract.materials?.length > 0 && (
            <SummaryRow label="Materials" amount={materialsTotal} />
          )}
          <SummaryRow label="Service Fee" amount={serviceFee} isFee />
          <SummaryRow label="Total Amount" amount={grandTotal} isTotal />
        </View>

        {/* Escrow Badge */}
        <View style={[styles.escrowContainer, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
            <ShieldCheck size={20} color={colors.success} weight="fill" />
            <View style={{ flex: 1 }}>
                <AppText size="xs" variant="bold" color={colors.success}>Secure Escrow Payment</AppText>
                <AppText size="xs" color={colors.success} style={{ opacity: 0.8 }}>
                    Your funds are held safely and only released once you confirm the job is done.
                </AppText>
            </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <AppButton 
            title="Cancel" 
            variant="outline" 
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <AppButton 
            title="Confirm & Pay" 
            onPress={onConfirm}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.md,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  escrowContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  }
});
