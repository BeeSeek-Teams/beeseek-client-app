import { Colors, Spacing, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Warning } from 'phosphor-react-native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppTextArea } from './AppTextArea';

const CATEGORIES = [
  { label: 'Long Wait/Late', value: 'TIME_ISSUE' },
  { label: 'Fee Conflict', value: 'FEE_DISPUTE' },
  { label: 'Emergency', value: 'EMERGENCY' },
  { label: 'Changed Mind', value: 'CHANGED_MIND' },
  { label: 'Other', value: 'OTHER' },
];

interface JobCancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, category: string) => void;
  loading?: boolean;
  isAgent?: boolean;
  transportFare?: number;
}

export const JobCancellationModal = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
  isAgent = false,
  transportFare = 0,
}: JobCancellationModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');

  const handleConfirm = () => {
    if (!category) return;
    onConfirm(reason, category);
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} bounces={false}>
          <View style={styles.iconContainer}>
            <Warning size={48} color={colors.error} weight="fill" />
          </View>

          <AppText variant="bold" size="xl" align="center" style={styles.title}>
            Cancel This Job?
          </AppText>

          <AppText align="center" color={colors.textSecondary} style={styles.policyText}>
            {isAgent 
              ? "As an agent, cancelling will result in a refund of the workmanship to the client and is recorded as a contract infraction."
              : `Note: The transport fare (₦${transportFare.toLocaleString()}) is non-refundable as a booking commitment fee for the agent.`
            }
          </AppText>

          <View style={styles.section}>
            <AppText variant="semiBold" size="sm" style={styles.sectionTitle}>
              Select Reason Category
            </AppText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: category === cat.value ? colors.primary : colors.surface,
                      borderColor: category === cat.value ? colors.primary : colors.border 
                    },
                  ]}
                >
                  <AppText
                    size="xs"
                    color={category === cat.value ? '#FFF' : colors.textSecondary}
                  >
                    {cat.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="semiBold" size="sm" style={styles.sectionTitle}>
              Additional Context (Optional)
            </AppText>
            <AppTextArea
              placeholder="Tell us more about why..."
              value={reason}
              onChangeText={setReason}
              numberOfLines={4}
              minHeight={100}
            />
          </View>

          <View style={styles.actions}>
            <AppButton
              title="Keep Job"
              variant="outline"
              onPress={onClose}
              style={styles.button}
              disabled={loading}
            />
            <AppButton
              title="Confirm Cancel"
              onPress={handleConfirm}
              style={[styles.button, { backgroundColor: colors.error }]}
              loading={loading}
              disabled={!category}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    width: '100%',
  },
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  policyText: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  section: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  input: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
  },
});
