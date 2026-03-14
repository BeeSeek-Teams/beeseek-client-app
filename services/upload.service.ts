import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import api from './api';

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadService = {
  /**
   * Internal helper to compress and resize images before upload
   */
  async optimizeImage(uri: string) {
    const actions: ImageManipulator.Action[] = [
      { resize: { width: 1200 } }, // Limit width to 1200px for efficiency
    ];

    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // High compression with acceptable quality
    );

    return result.uri;
  },

  /**
   * Only picks the image and returns the local URI
   */
  async pickImage(source: 'camera' | 'library' = 'library'): Promise<string | null> {
    try {
      const permissionResult = source === 'library' 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error(`Permission to access ${source} was denied`);
      }

      const pickerResult = source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });

      if (pickerResult.canceled || !pickerResult.assets || !pickerResult.assets[0]) {
        return null;
      }

      return pickerResult.assets[0].uri;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Uploads any media file
   */
  async uploadMedia(
    uri: string,
    folder: 'profiles' | 'bees' | 'documents' | 'chat',
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<UploadResult> {
    const formData = new FormData();
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // @ts-ignore
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: `upload.${fileType}`,
      type: resourceType === 'image' ? `image/${fileType}` : `video/${fileType}`,
    });

    const response = await api.post(`/uploads/single?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data;
  },

  /**
   * Uploads a file with optimized step
   */
  async uploadFile(
    uri: string,
    folder: 'profiles' | 'bees' | 'documents'
  ): Promise<UploadResult> {
    // 1. Optimize
    const optimizedUri = await this.optimizeImage(uri);

    // 2. Prepare Form Data
    const formData = new FormData();
    const uriParts = optimizedUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // @ts-ignore
    formData.append('file', {
      uri: Platform.OS === 'ios' ? optimizedUri.replace('file://', '') : optimizedUri,
      name: `upload.${fileType}`,
      type: `image/${fileType}`,
    });

    // 3. Upload
    const response = await api.post(`/uploads/single?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data;
  },

  /**
   * Picks an image from camera or library and uploads it
   */
  async pickAndUpload(
    folder: 'profiles' | 'documents',
    source: 'camera' | 'library' = 'library'
  ): Promise<UploadResult | null> {
    try {
      const permissionResult = source === 'library' 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error(`Permission to access ${source} was denied`);
      }

      const pickerResult = source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });

      if (pickerResult.canceled || !pickerResult.assets || !pickerResult.assets[0]) {
        return null;
      }

      // 1. Optimize
      const optimizedUri = await this.optimizeImage(pickerResult.assets[0].uri);

      // 2. Prepare Form Data
      const formData = new FormData();
      const uriParts = optimizedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'ios' ? optimizedUri.replace('file://', '') : optimizedUri,
        name: `upload.${fileType}`,
        type: `image/${fileType}`,
      });

      // 3. Upload
      const response = await api.post(`/uploads/single?folder=${folder}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Longer timeout for uploads
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
