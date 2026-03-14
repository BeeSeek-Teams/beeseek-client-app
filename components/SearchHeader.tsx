import { AppInput } from '@/components/AppInput';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Faders, MagnifyingGlass, XCircle } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (text: string) => void;
  onFilterPress?: () => void;
}

export function SearchHeader({ query, onQueryChange, onFilterPress }: SearchHeaderProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.searchContainer}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <AppInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search services, bees..."
            leftIcon={<MagnifyingGlass size={20} color={colors.textSecondary} />}
            containerStyle={styles.input}
            style={{ paddingRight: query.length > 0 ? 30 : 0 }}
          />
          {query.length > 0 && (
            <Ripple 
              style={styles.clearButton} 
              onPress={() => onQueryChange('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              rippleCentered
              rippleContainerBorderRadius={20}
            >
              <XCircle size={20} color={colors.textSecondary} weight="fill" />
            </Ripple>
          )}
        </View>
        <Ripple 
          style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onFilterPress}
          rippleContainerBorderRadius={12}
        >
          <Faders size={20} color={colors.text} />
        </Ripple>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    marginBottom: 0, // Override default margin
  },
  clearButton: {
    position: 'absolute',
    right: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
