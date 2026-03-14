import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Colors, Spacing, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { X } from 'phosphor-react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

interface SearchFilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: SearchFilters) => void;
}

export interface SearchFilters {
    minRating: number;
    maxDistance: number;
    showVerifiedOnly: boolean;
    showOnlineOnly: boolean;
    showInspectionsOnly: boolean;
    // Add sort options
    sortBy: 'distance' | 'rating' | 'inspection_price';
}

const SORT_OPTIONS = [
    { id: 'distance', label: 'Nearest' },
    { id: 'rating', label: 'Highest Rated' },
    { id: 'inspection_price', label: 'Inspection: Low to High' },
];

const DEFAULT_FILTERS: SearchFilters = {
    minRating: 0,
    maxDistance: 15, // Default 15km
    showVerifiedOnly: false,
    showOnlineOnly: false,
    showInspectionsOnly: false,
    sortBy: 'distance',
};

export const SearchFilterModal = ({ visible, onClose, onApply }: SearchFilterModalProps) => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearAll = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const FilterChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
        <Ripple
            style={[
                styles.chip, 
                { 
                    backgroundColor: selected ? colors.primary + '15' : colors.surface,
                    borderColor: selected ? colors.primary : colors.border
                }
            ]}
            onPress={onPress}
            rippleColor={colors.primary}
        >
            <AppText 
                size="sm" 
                variant={selected ? 'bold' : 'medium'}
                color={selected ? colors.primary : colors.text}
            >
                {label}
            </AppText>
        </Ripple>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={[styles.container, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <View>
                            <AppText variant="bold" size="lg">Filter Bees</AppText>
                            <TouchableOpacity 
                                onPress={handleClearAll}
                                style={styles.clearAllButton}
                            >
                                <AppText size="xs" color={colors.primary} variant="bold">Clear All</AppText>
                            </TouchableOpacity>
                        </View>
                        <Ripple onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color={colors.text} />
                        </Ripple>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Sort By */}
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <AppText variant="bold" style={styles.sectionTitle}>Sort By</AppText>
                                {filters.sortBy !== DEFAULT_FILTERS.sortBy && (
                                    <TouchableOpacity onPress={() => updateFilter('sortBy', DEFAULT_FILTERS.sortBy)}>
                                        <AppText size="xs" color={colors.textSecondary}>Reset</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.chipGrid}>
                                {SORT_OPTIONS.map(opt => (
                                    <FilterChip 
                                        key={opt.id}
                                        label={opt.label}
                                        selected={filters.sortBy === opt.id}
                                        onPress={() => updateFilter('sortBy', opt.id)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Status */}
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <AppText variant="bold" style={styles.sectionTitle}>Agent Status</AppText>
                                {(filters.showVerifiedOnly !== DEFAULT_FILTERS.showVerifiedOnly || filters.showOnlineOnly !== DEFAULT_FILTERS.showOnlineOnly || filters.showInspectionsOnly !== DEFAULT_FILTERS.showInspectionsOnly) && (
                                    <TouchableOpacity onPress={() => {
                                        updateFilter('showVerifiedOnly', DEFAULT_FILTERS.showVerifiedOnly);
                                        updateFilter('showOnlineOnly', DEFAULT_FILTERS.showOnlineOnly);
                                        updateFilter('showInspectionsOnly', DEFAULT_FILTERS.showInspectionsOnly);
                                    }}>
                                        <AppText size="xs" color={colors.textSecondary}>Reset</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.chipGrid}>
                                <FilterChip 
                                    label="Verified Pro"
                                    selected={filters.showVerifiedOnly}
                                    onPress={() => updateFilter('showVerifiedOnly', !filters.showVerifiedOnly)}
                                />
                                <FilterChip 
                                    label="Online Now"
                                    selected={filters.showOnlineOnly}
                                    onPress={() => updateFilter('showOnlineOnly', !filters.showOnlineOnly)}
                                />
                                <FilterChip 
                                    label="Offers Inspection"
                                    selected={filters.showInspectionsOnly}
                                    onPress={() => updateFilter('showInspectionsOnly', !filters.showInspectionsOnly)}
                                />
                            </View>
                        </View>

                        {/* Rating */}
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <AppText variant="bold" style={styles.sectionTitle}>Minimum Rating</AppText>
                                {filters.minRating !== DEFAULT_FILTERS.minRating && (
                                    <TouchableOpacity onPress={() => updateFilter('minRating', DEFAULT_FILTERS.minRating)}>
                                        <AppText size="xs" color={colors.textSecondary}>Reset</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.chipGrid}>
                                {[4.5, 4.0, 3.5].map(rating => (
                                    <FilterChip 
                                        key={rating}
                                        label={`${rating} & up`}
                                        selected={filters.minRating === rating}
                                        onPress={() => updateFilter('minRating', filters.minRating === rating ? 0 : rating)}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderColor: colors.border }]}>
                        <AppButton title="Show Results" onPress={handleApply} variant="primary" />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Bottom sheet style, or 'center' for dialog
    },
    container: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        minHeight: '40%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    closeBtn: {
        padding: 4,
    },
    clearAllButton: {
        backgroundColor: Colors.light.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    content: {
        paddingHorizontal: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    footer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 20,
        borderTopWidth: 1,
    },
});
