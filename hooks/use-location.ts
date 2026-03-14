import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const SIGNIFICANT_DISTANCE_METERS = 500;

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
}

export const useLocation = () => {
  const { lastLocation, lastAddress, setLocation, setActualLocation } = useAuthStore();
  const [address, setAddress] = useState<string | null>(lastAddress);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(lastLocation);

  // Sync with store changes
  useEffect(() => {
    setAddress(lastAddress);
    setCoords(lastLocation);
  }, [lastAddress, lastLocation]);

  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // High Accuracy Watcher for Drift Detection
  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 100, // Trigger every 100m
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setActualLocation({ latitude, longitude });
          }
        );
      }
    };

    const hasHydrated = useAuthStore.getState()._hasHydrated;
    if (hasHydrated) {
      startWatching();
    }

    return () => {
      if (watcher) {
        watcher.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActualLocation]);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      console.log('[Location] Attempting native reverse geocoding...');
      const response = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (response && response.length > 0) {
        const item = response[0];
        const formattedAddress = `${item.name || ''} ${item.street || ''}, ${item.city || item.region || ''}`.trim().replace(/^ ,/, '');
        if (formattedAddress) {
          console.log('[Location] Native geocoding success:', formattedAddress);
          return formattedAddress;
        }
      }
    } catch (error: any) {
      console.warn('[Location] Native reverse geocoding failed:', error.message);
      
      // Fallback to Google Geocoding if native fails (common when rate limited)
      if (GOOGLE_PLACES_API_KEY) {
        console.log('[Location] Attempting Google Geocoding fallback...');
        try {
          const googleResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_PLACES_API_KEY}`
          );
          
          if (googleResponse.data.results && googleResponse.data.results.length > 0) {
            let locString = googleResponse.data.results[0].formatted_address;
            
            // Clean up the string to be more compact for the header
            const parts = locString.split(',');
            if (parts.length > 2) {
                locString = parts.slice(0, 2).join(',').trim();
            }
            
            console.log('[Location] Google fallback success:', locString);
            return locString;
          }
        } catch (googleError: any) {
          console.error('[Location] Google fallback also failed:', googleError.message);
        }
      }
    }
    return 'Unknown Location';
  };

  const refreshLocation = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setShowPermissionModal(true);
        setLoading(false);
        return;
      }

      setShowPermissionModal(false);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const newCoords = { latitude, longitude };

      // Cost saving: Only reverse geocode if forced or distance > 500m
      let newAddress = lastAddress;
      if (
        force ||
        !lastLocation ||
        !lastAddress ||
        getDistance(latitude, longitude, lastLocation.latitude, lastLocation.longitude) > SIGNIFICANT_DISTANCE_METERS
      ) {
        newAddress = await getAddressFromCoords(latitude, longitude);
      }

      setCoords(newCoords);
      setAddress(newAddress);
      setLocation(newCoords, newAddress || 'Unknown Location');

      // Sync with backend only if logged in
      if (useAuthStore.getState().accessToken) {
        try {
          const { deviceId, deviceType } = await getDeviceInfo();
          await api.put('/users/profile', {
              latitude,
              longitude,
              deviceId,
              deviceType,
          }, { timeout: 15000 }); // Dedicated timeout for background sync
        } catch (e: any) {
          // Silent fail for background sync to avoid log noise, only warn on actual errors
          if (e.code !== 'ECONNABORTED') {
            console.log('[Location] Background sync failed:', e.message);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLoading(false);
    }
  }, [lastLocation, lastAddress, setLocation]);

  const getDeviceInfo = async () => {
    let deviceId = 'Unknown Fingerprint';
    try {
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync() || 'Unknown iOS';
      }
    } catch (e) {
      console.warn('Failed to get device info:', e);
    }

    return {
      deviceId,
      deviceType: Platform.OS.toUpperCase(),
      deviceModel: Device.modelName || 'Unknown Device',
    };
  };

  useEffect(() => {
    // Initial fetch only after hydration and if logged in
    const hasHydrated = useAuthStore.getState()._hasHydrated;
    if (hasHydrated) {
        refreshLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    address,
    coords,
    loading,
    permissionStatus,
    showPermissionModal,
    setShowPermissionModal,
    refreshLocation,
    getDeviceInfo,
  };
};
