import { AlertType, AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { MediaPreviewModal } from '@/components/MediaPreviewModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UploadStatusModal } from '@/components/UploadStatusModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { authService } from '@/services/auth.service';
import { uploadService } from '@/services/upload.service';
import { userService } from '@/services/users.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Camera, LockKey, ShieldCheck, Trash, User as UserIcon } from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function ManageProfileScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  // New states for image handling
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'optimizing' | 'uploading' | 'complete' | 'error'>('optimizing');
  const [uploadStatusVisible, setUploadStatusVisible] = useState(false);
  const isUploadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  const handleImagePickerSelect = async (source: 'camera' | 'library') => {
    setImagePickerVisible(false);
    
    // Give modal time to close for smoother transition to system picker
    setTimeout(async () => {
      try {
        const uri = await uploadService.pickImage(source);
        if (uri) {
          setPreviewUri(uri);
          setPreviewVisible(true);
        }
      } catch (error: any) {
        console.error('Image picking failed:', error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to pick image',
        });
      }
    }, 800);
  };

  const handleUploadConfirm = async () => {
    if (!previewUri) return;
    
    setPreviewVisible(false);
    setUploadStatus('optimizing');
    setUploadStatusVisible(true);
    isUploadingRef.current = true;
    
    try {
      setTimeout(async () => {
        if (!isUploadingRef.current) return;

        try {
          setUploadStatus('uploading');
          const result = await uploadService.uploadFile(previewUri, 'profiles');
          
          if (result) {
            if (!isUploadingRef.current) return;
            
            const response = await api.put('/users/profile', { profileImage: result.url });
            updateUser(response.data);
            setUploadStatus('complete');
            
            setTimeout(() => {
              setUploadStatusVisible(false);
              setPreviewUri(null);
              isUploadingRef.current = false;
              showAlert({
                type: 'success',
                title: 'Success',
                message: 'Profile picture updated successfully',
              });
            }, 1000);
          }
        } catch (uploadError: any) {
          console.error('Upload failed:', uploadError);
          if (!isUploadingRef.current) return;

          setUploadStatus('error');
          setTimeout(() => {
            setUploadStatusVisible(false);
            isUploadingRef.current = false;
            showAlert({
              type: 'error',
              title: 'Upload Failed',
              message: 'Could not upload image. Please try again.',
            });
          }, 1500);
        }
      }, 1000);
      
    } catch (error: any) {
      setUploadStatusVisible(false);
      isUploadingRef.current = false;
    }
  };

  const handleCancelUpload = () => {
    isUploadingRef.current = false;
    setPreviewVisible(false);
    setUploadStatusVisible(false);
    setPreviewUri(null);
  };

  const handleDeleteAccount = async () => {
      try {
          await authService.deleteAccount();
          showAlert({
              type: 'success', 
              title: 'Account Deactivated', 
              message: 'Your account has been initiated for deletion. You have 30 days to contact support if you wish to undo this. You will be logged out shortly.',
              onConfirm: () => {
                  logout();
                  router.replace('/');
              }
          });
      } catch (error: any) {
          showAlert({
              type: 'error',
              title: 'Cannot Close Account',
              message: error.response?.data?.message || 'Failed to initiate account deletion. Please contact support.',
          });
      }
  };

  useEffect(() => {
    if (user) {
        let phone = user.phone || '';
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
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: phone,
        });
        setLoading(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
        const response = await userService.updateProfile(formData);
        updateUser(response);
        showAlert({
            type: 'success',
            title: 'Success',
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Failed to update profile:', error);
        showAlert({
            type: 'error',
            title: 'Error',
            message: 'Failed to update profile. Please try again.',
        });
    } finally {
        setSaving(false);
    }
  };

  const renderSkeleton = () => (
    <View style={{ padding: Spacing.lg }}>
      <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
        <AppSkeleton width={100} height={100} borderRadius={50} />
      </View>
      <AppSkeleton width="100%" height={50} style={{ marginBottom: Spacing.md }} />
      <AppSkeleton width="100%" height={50} style={{ marginBottom: Spacing.md }} />
      <AppSkeleton width="100%" height={50} style={{ marginBottom: Spacing.md }} />
      <AppSkeleton width="100%" height={50} style={{ marginBottom: Spacing.md }} />
    </View>
  );

  return (
    <AppScreen disablePadding>
      <ScreenHeader title="Manage Profile" />
      
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onSelect={handleImagePickerSelect}
        title="Change Profile Photo"
      />

      <MediaPreviewModal
        visible={previewVisible}
        uri={previewUri}
        onConfirm={handleUploadConfirm}
        onCancel={handleCancelUpload}
        title="Profile Photo Preview"
      />

      <UploadStatusModal
        visible={uploadStatusVisible}
        status={uploadStatus}
        onCancel={handleCancelUpload}
        canCancel={uploadStatus !== 'uploading' && uploadStatus !== 'complete'}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.content}>
            {loading ? (
              renderSkeleton()
            ) : (
              <>
                <View style={styles.avatarSection}>
                  <View style={styles.avatarContainer}>
                    {user?.profileImage ? (
                        <Image
                            source={{ uri: user.profileImage }}
                            style={[styles.avatar, { borderColor: colors.border }]}
                        />
                    ) : (
                        <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                             <UserIcon size={32} color={colors.primary} weight="fill" />
                        </View>
                    )}
                    <Ripple 
                      style={[styles.cameraButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
                      onPress={() => setImagePickerVisible(true)}
                      rippleColor="#FFF"
                      rippleContainerBorderRadius={16}
                    >
                      <Camera size={20} color="#fff" weight="fill" />
                    </Ripple>
                  </View>
                  <Ripple 
                    onPress={() => setImagePickerVisible(true)}
                    rippleColor={colors.primary}
                    style={{ padding: 4 }}
                  >
                    <AppText 
                        color={colors.primary} 
                        variant="semiBold" 
                        style={{ marginTop: Spacing.xs }}
                    >
                        Change Photo
                    </AppText>
                  </Ripple>

                  <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginTop: Spacing.md, 
                      backgroundColor: user?.isNinVerified ? colors.primary + '15' : (user?.ninStatus === 'PENDING' ? '#F59E0B15' : colors.text + '10'), 
                      paddingVertical: 6, 
                      paddingHorizontal: 12, 
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: user?.isNinVerified ? colors.primary + '30' : (user?.ninStatus === 'PENDING' ? '#F59E0B30' : colors.border)
                  }}>
                      <ShieldCheck 
                        size={16} 
                        color={user?.isNinVerified ? colors.primary : (user?.ninStatus === 'PENDING' ? '#F59E0B' : colors.textSecondary)} 
                        weight="fill" 
                      />
                      <AppText 
                        size="xs" 
                        variant="medium" 
                        color={user?.isNinVerified ? colors.primary : (user?.ninStatus === 'PENDING' ? '#F59E0B' : colors.textSecondary)} 
                        style={{ marginLeft: 6 }}
                      >
                          {user?.isNinVerified ? 'Verified Client' : (user?.ninStatus === 'PENDING' ? 'Verification Pending' : 'Unverified')}
                      </AppText>
                  </View>
                </View>

                <View style={styles.form}>
                  <View style={styles.row}>
                    <AppInput
                      label="First Name"
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                      containerStyle={{ flex: 1, marginRight: Spacing.sm }}
                    />
                    <AppInput
                      label="Last Name"
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>

                  <AppInput
                    label="Email Address"
                    value={formData.email}
                    editable={false}
                    containerStyle={{ opacity: 0.6 }}
                  />

                  <AppInput
                    label="Phone Number"
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    placeholder="+234 800 000 0000"
                  />

                  <AppButton
                    title="Save Changes"
                    onPress={handleSave}
                    loading={saving}
                    style={{ marginTop: Spacing.md }}
                  />

                  <View style={{ marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <AppText variant="semiBold" size="md" style={{ marginBottom: Spacing.md }}>Account Actions</AppText>
                      
                      <AppButton
                        title="Change Password"
                        variant="ghost"
                        style={{ backgroundColor: colors.primary + '10', marginBottom: Spacing.md }}
                        textColor={colors.primary}
                        onPress={() => router.push('/change-password/request-otp')}
                        icon={<LockKey size={20} color={colors.primary} />}
                      />

                      <AppButton
                        title="Delete Account"
                        variant="ghost" 
                        textColor={colors.error}
                        style={{ backgroundColor: colors.error + '10' }}
                        onPress={() => setDeleteVisible(true)}
                        icon={<Trash size={20} color={colors.error} />}
                      />
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <DeleteAccountModal
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onDelete={handleDeleteAccount}
      />

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
    paddingBottom: Spacing['2xl'],
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
});
