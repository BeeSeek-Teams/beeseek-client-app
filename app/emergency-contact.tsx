import { AlertType, AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Phone, Trash, User, Users as UsersIcon, Warning } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

interface EmergencyContactForm {
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyContactScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user, updateUser } = useAuthStore();
  
  const hasContact = !!user?.emergencyContactName;
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EmergencyContactForm>({
    name: user?.emergencyContactName || '',
    phone: '', // Will be set in useEffect
    relationship: user?.emergencyContactRelationship || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
        let phone = user.emergencyContactPhone || '';
        if (!phone.startsWith('+234')) {
          if (phone.startsWith('0')) {
            phone = '+234' + phone.substring(1);
          } else if (phone && !phone.startsWith('+')) {
            phone = '+234' + phone;
          } else if (!phone) {
            phone = '+234';
          }
        }
        setFormData({
            name: user.emergencyContactName || '',
            phone: phone,
            relationship: user.emergencyContactRelationship || '',
        });
    }
  }, [user]);

  const handlePhoneChange = (text: string) => {
    // Only allow typed numbers after the +234
    if (!text.startsWith('+234')) {
      // If they try to delete the prefix, force it back
      setFormData({ ...formData, phone: '+234' });
      return;
    }
    
    // Allow only digits after +234
    const suffix = text.substring(4);
    const sanitizedSuffix = suffix.replace(/[^0-9]/g, '');
    setFormData({ ...formData, phone: '+234' + sanitizedSuffix });
  };

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm: () => void;
    showCancel?: boolean;
    onCancel?: () => void;
    confirmText?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (config: Partial<typeof alertConfig>) => {
    setAlertConfig(prev => ({
      ...prev,
      visible: true,
      onConfirm: () => setAlertConfig(c => ({ ...c, visible: false })),
      ...config,
    }));
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.relationship) {
      showAlert({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all fields to save your emergency contact.',
      });
      return;
    }

    setLoading(true);
    try {
        const response = await api.put('/users/profile', {
            emergencyContactName: formData.name,
            emergencyContactPhone: formData.phone,
            emergencyContactRelationship: formData.relationship,
        });
        updateUser(response.data);
        setIsEditing(false);
        showAlert({
            type: 'success',
            title: 'Success',
            message: 'Emergency contact saved successfully.',
        });
    } catch (error) {
        console.error('Failed to save emergency contact:', error);
        showAlert({
            type: 'error',
            title: 'Error',
            message: 'Failed to save emergency contact. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert({
      type: 'error',
      title: 'Delete Contact',
      message: 'Are you sure you want to delete your emergency contact? In an emergency, we won\'t have anyone to notify.',
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        setLoading(true);
        try {
            const response = await api.put('/users/profile', {
                emergencyContactName: null,
                emergencyContactPhone: null,
                emergencyContactRelationship: null,
            });
            updateUser(response.data);
            setFormData({ name: '', phone: '', relationship: '' });
            setIsEditing(false);
            hideAlert();
        } catch (error) {
            console.error('Failed to delete emergency contact:', error);
            showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete emergency contact. Please try again.',
            });
        } finally {
            setLoading(false);
        }
      }
    });
  };

  const startEditing = () => {
    let phone = user?.emergencyContactPhone || '';
    if (!phone.startsWith('+234')) {
      if (phone.startsWith('0')) {
        phone = '+234' + phone.substring(1);
      } else if (phone && !phone.startsWith('+')) {
        phone = '+234' + phone;
      } else if (!phone) {
        phone = '+234';
      }
    }

    setFormData({
        name: user?.emergencyContactName || '',
        phone: phone,
        relationship: user?.emergencyContactRelationship || '',
    });
    setIsEditing(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
        <Warning size={48} color={colors.primary} weight="fill" />
      </View>
      <AppText variant="bold" size="xl" align="center" style={{ marginBottom: Spacing.sm }}>
        No Emergency Contact
      </AppText>
      <AppText align="center" color={colors.textSecondary} style={{ marginBottom: Spacing.xl }}>
        Add a trusted contact who we can reach out to in case of an emergency during a job.
      </AppText>
      <AppButton
        title="Add Emergency Contact"
        onPress={() => setIsEditing(true)}
        style={{ width: '100%' }}
      />
    </View>
  );

  const renderContactCard = () => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}>
          <AppText variant="bold" color={colors.primary} size="lg">
            {user?.emergencyContactName?.charAt(0) || 'E'}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bold" size="lg">{user?.emergencyContactName}</AppText>
          <AppText color={colors.textSecondary}>{user?.emergencyContactRelationship}</AppText>
        </View>
      </View>
      
      <View style={[styles.infoRow, { borderColor: colors.border }]}>
        <Phone size={20} color={colors.textSecondary} />
        <AppText style={{ marginLeft: Spacing.sm }}>{user?.emergencyContactPhone}</AppText>
      </View>

      <View style={styles.actionRow}>
        <AppButton
          title="Edit"
          variant="outline"
          onPress={startEditing}
          style={{ flex: 1, marginRight: Spacing.sm }}
        />
        <AppButton
          title="Delete"
          variant="ghost"
          textColor={colors.error}
          icon={<Trash size={20} color={colors.error} />}
          onPress={handleDelete}
          style={{ backgroundColor: colors.error + '10' }}
        />
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.form}>
      <AppText color={colors.textSecondary} style={{ marginBottom: Spacing.lg }}>
        Please provide details of someone we can contact in case of an emergency.
      </AppText>

      <AppInput
        label="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="e.g. John Doe"
        leftIcon={<User size={20} color={colors.textSecondary} />}
      />

      <AppInput
        label="Relationship"
        value={formData.relationship}
        onChangeText={(text) => setFormData({ ...formData, relationship: text })}
        placeholder="e.g. Spouse, Sibling, Friend"
        leftIcon={<UsersIcon size={20} color={colors.textSecondary} />}
      />

      <AppInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={handlePhoneChange}
        placeholder="+234 800 000 0000"
        keyboardType="phone-pad"
        leftIcon={<Phone size={20} color={colors.textSecondary} />}
      />

      <View style={styles.formActions}>
        <AppButton
          title="Cancel"
          variant="ghost"
          onPress={() => {
            setIsEditing(false);
            if (!hasContact) setFormData({ name: '', phone: '', relationship: '' });
          }}
          style={{ flex: 1, marginRight: Spacing.sm }}
        />
        <AppButton
          title="Save Contact"
          onPress={handleSave}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Emergency Contact" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.content}>
            {!hasContact && !isEditing && renderEmptyState()}
            {hasContact && !isEditing && renderContactCard()}
            {isEditing && renderForm()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <AppAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        onCancel={hideAlert}
        confirmText={alertConfig.confirmText}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  form: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
});
