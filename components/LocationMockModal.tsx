import { AppAlert } from '@/components/AppAlert';
import { AppText } from '@/components/AppText';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Location from 'expo-location';
import { MapPin, NavigationArrow, X } from 'phosphor-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Ripple from 'react-native-material-ripple';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface LocationMockModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string, coords?: { latitude: number; longitude: number }) => void;
  currentLocation: string;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export function LocationMockModal({ visible, onClose, onSelect, currentLocation }: LocationMockModalProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const googleRef = useRef<any>(null);

  const [alertConfig, setAlertConfig] = useState<any>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => setAlertConfig((prev: any) => ({ ...prev, visible: false }))
  });

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          setAlertConfig({
              visible: true,
              title: 'Permission Denied',
              message: 'Allow location access to find agents near you.',
              type: 'warning',
              onConfirm: () => setAlertConfig((prev: any) => ({ ...prev, visible: false }))
          });
          setLoading(false);
          return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      
      const response = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (response && response.length > 0) {
        const item = response[0];
        const formattedAddress = `${item.name || ''} ${item.street || ''}, ${item.city || item.region || ''}`.trim().replace(/^ ,/, '');
        onSelect(formattedAddress || 'Unknown Location', { latitude, longitude });
        onClose();
      }
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const handleLocationSelected = async (data: any, details: any = null) => {
    if (!details) return;
    
    const { lat: latitude, lng: longitude } = details.geometry.location;
    const address = data.description;
    
    // Distance check
    try {
        const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const distance = getDistance(
            currentPos.coords.latitude, 
            currentPos.coords.longitude,
            latitude,
            longitude
        );

        if (distance > 10000) { // 10km
            setAlertConfig({
                visible: true,
                title: 'Address is Far',
                message: "This location is quite far from your current position. We'll show you agents nearby this area.",
                type: 'info',
                onConfirm: () => {
                    setAlertConfig((prev: any) => ({ ...prev, visible: false }));
                    onSelect(address, { latitude, longitude });
                    onClose();
                }
            });
            return;
        }
    } catch (e) {
        // Fallback if location permission fails during check
    }

    onSelect(address, { latitude, longitude });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <AppAlert 
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            onConfirm={alertConfig.onConfirm}
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              <View style={[styles.pill, { backgroundColor: colors.border }]} />
              
              <View style={styles.header}>
                <AppText variant="bold" size="xl">Change Location</AppText>
                <Ripple 
                  onPress={onClose} 
                  style={styles.closeButton}
                  rippleCentered={true}
                  rippleColor={colors.text}
                  rippleOpacity={0.1}
                >
                  <X size={24} color={colors.text} />
                </Ripple>
              </View>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <AppText color={colors.textSecondary} size="sm" style={styles.subtitle}>
                   Search for an address or use your current location.
                </AppText>

                <View style={[styles.activeLocationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MapPin size={14} color={colors.primary} weight="fill" />
                        <AppText size="xs" variant="bold" color={colors.primary} style={{ marginLeft: 6 }}>CURRENTLY SELECTED</AppText>
                    </View>
                    <AppText size="sm" variant="medium" numberOfLines={1}>{currentLocation}</AppText>
                </View>

                <View style={styles.content}>
                   <Ripple
                     style={[styles.currentLocationBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                     onPress={handleUseCurrentLocation}
                     disabled={loading}
                   >
                     {loading ? (
                       <ActivityIndicator color={colors.primary} size="small" />
                     ) : (
                       <NavigationArrow size={20} color={colors.primary} weight="fill" />
                     )}
                     <AppText variant="bold" color={colors.primary} style={{ marginLeft: 12 }}>
                       Use Current Location
                     </AppText>
                   </Ripple>

                   <AppText variant="medium" style={{ marginBottom: Spacing.sm, marginLeft: 4 }}>New Location</AppText>
                   <View style={styles.searchContainer}>
                     <GooglePlacesAutocomplete
                       ref={googleRef}
                       placeholder='Search address or neighborhood'
                       fetchDetails={true}
                       onPress={handleLocationSelected}
                       query={{
                         key: GOOGLE_PLACES_API_KEY,
                         language: 'en',
                         components: 'country:ng',
                       }}
                       styles={{
                         container: { 
                            flex: 0, 
                            width: '100%',
                         },
                         textInputContainer: {
                            height: 58,
                            alignItems: 'center',
                            paddingHorizontal: 0,
                            backgroundColor: 'transparent',
                         },
                         textInput: {
                            height: 58,
                            color: colors.text,
                            fontSize: 16,
                            backgroundColor: colors.surface,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingLeft: 45,
                            fontFamily: Typography.weights.medium,
                         },
                         listView: {
                            backgroundColor: colors.surface,
                            borderRadius: 12,
                            marginTop: 8,
                            borderWidth: 1,
                            borderColor: colors.border,
                            zIndex: 3000,
                            position: 'relative', // Changed from absolute to work inside ScrollView better
                            width: '100%',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 5,
                         },
                         row: {
                            padding: 16,
                            height: 'auto',
                            flexDirection: 'row',
                            alignItems: 'center',
                         },
                         separator: {
                            height: 1,
                            backgroundColor: colors.border + '50',
                         },
                         description: {
                            color: colors.text,
                            fontSize: 14,
                            fontFamily: Typography.weights.medium,
                         },
                       }}
                       enablePoweredByContainer={false}
                       textInputProps={{
                         placeholderTextColor: colors.textSecondary + '80',
                       }}
                       renderLeftButton={() => (
                         <View style={{ position: 'absolute', left: 16, zIndex: 1, top: 18 }}>
                            <MapPin size={22} color={colors.primary} weight="fill" />
                         </View>
                       )}
                     />
                   </View>
                   <View style={{ height: 40 }} />
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: '85%',
  },
  pill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
      marginBottom: 24,
  },
  activeLocationCard: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 24,
  },
  content: {
      flex: 1,
  },
  currentLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: Spacing.md,
  },
  searchContainer: {
      flex: 1,
      zIndex: 2000,
  }
});
