import { borderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../AppText';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const OtpInput = ({ length = 6, value, onChange, error }: OtpInputProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasClipboardCode, setHasClipboardCode] = useState(false);

  // Check clipboard for OTP code on mount and when focused
  useEffect(() => {
    checkClipboard();
  }, []);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const digits = text?.replace(/[^0-9]/g, '');
      setHasClipboardCode(!!digits && digits.length === length);
    } catch {
      setHasClipboardCode(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const digits = text?.replace(/[^0-9]/g, '').slice(0, length);
      if (digits && digits.length > 0) {
        onChange(digits);
      }
    } catch {
      // Silently fail
    }
  };

  const handlePress = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.inputsContainer} onPress={handlePress}>
        {Array.from({ length }).map((_, index) => {
          const char = value[index] || '';
          const isCurrentBox = index === value.length && isFocused;
          const isFilled = !!char;
          
          return (
            <View
              key={index}
              style={[
                styles.box,
                { 
                  borderColor: error 
                    ? colors.error 
                    : isCurrentBox 
                      ? colors.primary 
                      : colors.border,
                  backgroundColor: colors.surface,
                },
                isCurrentBox && styles.boxFocused,
              ]}
            >
              <AppText 
                variant="bold" 
                size="xl" 
                style={{ textAlign: 'center' }}
              >
                {char}
              </AppText>
              
              {/* Optional: Cursor indicator */}
              {isCurrentBox && <View style={[styles.cursor, { backgroundColor: colors.primary }]} />}
            </View>
          );
        })}
      </Pressable>

      {/* Hidden Input Layer */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
            // Only allow numbers
            const num = text.replace(/[^0-9]/g, '');
            if (num.length <= length) {
                onChange(num);
            }
        }}
        onBlur={handleBlur}
        onFocus={() => setIsFocused(true)}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
      />
      
      {error && (
        <AppText size="xs" color={colors.error} style={{ marginTop: 8, textAlign: 'center' }}>
          {error}
        </AppText>
      )}

      {hasClipboardCode && !value && (
        <Pressable
          onPress={handlePasteFromClipboard}
          style={[styles.pasteButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
        >
          <AppText size="sm" variant="bold" color={colors.primary}>Paste Code</AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85, 
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 50,
  },
  boxFocused: {
    borderWidth: 2,
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: '40%',
    height: 2,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  pasteButton: {
    marginTop: Spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
});
