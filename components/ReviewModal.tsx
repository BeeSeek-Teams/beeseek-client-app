import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Star } from 'phosphor-react-native';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppTextArea } from './AppTextArea';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title?: string;
  loading?: boolean;
}

export const ReviewModal = ({ visible, onClose, onSubmit, title = "Rate your Experience", loading = false }: ReviewModalProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
  };

  return (
    <AppModal visible={visible} onClose={onClose} title={title} position="center">
      <View style={styles.container}>
        <AppText align="center" color={colors.textSecondary} style={{ marginBottom: Spacing.xl }}>
           How was your interaction with the professional? Your feedback helps keep the community safe and reliable.
        </AppText>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {[0, 1, 2, 3, 4].map((index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => handleStarPress(index)}
              style={styles.star}
            >
              <Star 
                size={40} 
                weight={index < rating ? "fill" : "regular"} 
                color={index < rating ? "#FFD700" : colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <AppText variant="bold" size="sm" style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
          WRITE A REVIEW (OPTIONAL)
        </AppText>
        
        <AppTextArea
          placeholder="Share more details about your experience..."
          value={comment}
          onChangeText={setComment}
          minHeight={100}
        />

        <AppButton 
          title="Submit Feedback" 
          onPress={handleSubmit} 
          disabled={rating === 0 || loading}
          loading={loading}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  star: {
    // padding: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    height: 120,
  }
});
