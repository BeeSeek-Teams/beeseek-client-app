import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { X } from 'phosphor-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ImageAttachmentsProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function ImageAttachments({ images, onRemove }: ImageAttachmentsProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  if (images.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {images.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.image} />
          <TouchableOpacity 
            style={[styles.removeBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
            onPress={() => onRemove(index)}
          >
            <X size={12} color="#FFF" weight="bold" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 90,
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 12,
  },
  content: {
    paddingRight: 12,
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
