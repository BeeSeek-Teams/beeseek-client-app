import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Check, UserPlus } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface AccountLinkingModalProps {
  visible: boolean;
  linkedAccountName?: string;
  currentRole: 'CLIENT' | 'AGENT';
  linkedRole: 'CLIENT' | 'AGENT';
  onDismiss?: () => void;
}

export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  visible,
  linkedAccountName,
  currentRole,
  linkedRole,
  onDismiss,
}) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const [animationValue] = useState(new Animated.Value(0));
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowComplete(false);
      
      // Animate line traveling from left to right
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowComplete(true);
        // Auto-dismiss after completion
        setTimeout(() => {
          onDismiss?.();
        }, 1500);
      });
    }
  }, [visible]);

  const lineWidth = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getRoleLabel = (role: 'CLIENT' | 'AGENT') => {
    return role === 'CLIENT' ? 'Client' : 'Agent';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <UserPlus size={32} color={colors.primary} weight="duotone" />
            <AppText variant="bold" size="xl" style={styles.title} align="center">
              Linking Accounts
            </AppText>
            <AppText color={colors.textSecondary} size="sm" align="center">
              Connecting your {getRoleLabel(currentRole)} and {getRoleLabel(linkedRole)} accounts
            </AppText>
          </View>

          {/* Accounts and Line */}
          <View style={styles.accountsContainer}>
            {/* Current Account */}
            <View style={styles.accountCard}>
              <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
                <UserPlus size={24} color={colors.primary} weight="fill" />
              </View>
              <AppText variant="bold" size="sm" style={styles.roleLabel}>
                {getRoleLabel(currentRole)}
              </AppText>
              <AppText color={colors.textSecondary} size="xs">
                Your Account
              </AppText>
            </View>

            {/* Animated Line */}
            <View style={styles.lineContainer}>
              <Animated.View
                style={[
                  styles.animatedLine,
                  {
                    width: lineWidth,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
              
              {/* Travel Icon */}
              <Animated.View
                style={[
                  styles.travelIcon,
                  {
                    opacity: animationValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              </Animated.View>
            </View>

            {/* Linked Account */}
            <View style={styles.accountCard}>
              <View style={[styles.iconBg, { backgroundColor: colors.secondary + '15' }]}>
                <UserPlus size={24} color={colors.secondary} weight="fill" />
              </View>
              <AppText variant="bold" size="sm" style={styles.roleLabel}>
                {getRoleLabel(linkedRole)}
              </AppText>
              <AppText color={colors.textSecondary} size="xs">
                {linkedAccountName || 'Your Account'}
              </AppText>
            </View>
          </View>

          {/* Status Message */}
          <View style={styles.statusContainer}>
            {showComplete ? (
              <>
                <View style={[styles.checkIcon, { backgroundColor: colors.success + '15' }]}>
                  <Check size={24} color={colors.success} weight="fill" />
                </View>
                <AppText variant="bold" size="lg" align="center" style={styles.statusText}>
                  Accounts Linked!
                </AppText>
                <AppText color={colors.textSecondary} size="sm" align="center">
                  Your {getRoleLabel(currentRole)} and {getRoleLabel(linkedRole)} accounts are now connected. You can switch between them anytime.
                </AppText>
              </>
            ) : (
              <>
                <AppText color={colors.textSecondary} size="sm" align="center">
                  Verifying and connecting your accounts...
                </AppText>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    borderRadius: 16,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing['xl'],
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  accountsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing['2xl'],
  },
  accountCard: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleLabel: {
    marginBottom: Spacing.xs,
  },
  lineContainer: {
    flex: 1.2,
    height: 2,
    marginHorizontal: Spacing.md,
    position: 'relative',
    justifyContent: 'center',
  },
  animatedLine: {
    height: 2,
    borderRadius: 1,
  },
  travelIcon: {
    position: 'absolute',
    left: 0,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: Spacing['xl'],
    paddingTop: Spacing['xl'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  checkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusText: {
    marginBottom: Spacing.sm,
  },
});
