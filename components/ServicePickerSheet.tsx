import { borderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { beesService } from '@/services/bees.service';
import { Image } from 'expo-image';
import { CaretRight, Image as ImageIcon, Info, MapPin, Star, X } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppText } from './AppText';

interface ServicePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  agentId: string;
  onSelect: (bee: any) => void;
  suggestedBeeId?: string;
}

export const ServicePickerSheet = ({ visible, onClose, agentId, onSelect, suggestedBeeId }: ServicePickerSheetProps) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const [bees, setBees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && agentId) {
      fetchBees();
    }
  }, [visible, agentId]);

  const fetchBees = async () => {
    try {
      setLoading(true);
      const data = await beesService.getAgentBees(agentId);
      // Sort to put suggested bee at the top
      if (suggestedBeeId) {
        data.sort((a: any, b: any) => (a.id === suggestedBeeId ? -1 : b.id === suggestedBeeId ? 1 : 0));
      }
      setBees(data);
    } catch (error) {
      console.error('Failed to fetch agent bees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
           <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <AppText variant="bold" size="lg">Select a Service</AppText>
            <Ripple 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
              rippleCentered={true}
              rippleContainerBorderRadius={20}
            >
              <X size={20} color={colors.text} />
            </Ripple>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {bees.length === 0 ? (
                <View style={styles.empty}>
                  <Info size={48} color={colors.textSecondary} />
                  <AppText color={colors.textSecondary} style={{ marginTop: 12 }}>No services available</AppText>
                </View>
              ) : (
                bees.map((bee) => (
                  <Ripple
                    key={bee.id}
                    style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => onSelect(bee)}
                  >
                    {(bee.images?.[0] || bee.coverImage) ? (
                      <Image
                        source={{ uri: bee.images?.[0] || bee.coverImage }}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ImageIcon size={24} color={colors.textSecondary} weight="light" />
                      </View>
                    )}
                    <View style={styles.info}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <AppText variant="bold" numberOfLines={1} style={{ flexShrink: 1 }}>{bee.title}</AppText>
                          {bee.id === suggestedBeeId && (
                            <View style={[styles.suggestedBadge, { backgroundColor: colors.primary + '15' }]}>
                              <AppText size="xs" color={colors.primary} variant="bold">Suggested</AppText>
                            </View>
                          )}
                        </View>
                        <View style={styles.ratingRow}>
                          <Star size={12} color={colors.warning} weight="fill" />
                          <AppText size="xs" variant="bold" style={{ marginLeft: 2 }}>
                            {Number(bee.rating || 0).toFixed(1)}
                          </AppText>
                        </View>
                      </View>
                      
                      <View style={styles.metaRow}>
                        <AppText size="xs" color={colors.textSecondary}>{bee.category}</AppText>
                        <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                        <MapPin size={12} color={colors.textSecondary} />
                        <AppText size="xs" color={colors.textSecondary} style={{ marginLeft: 2 }} numberOfLines={1}>
                          {(typeof bee.locationAddress === 'string' ? bee.locationAddress : (typeof bee.location === 'string' ? bee.location : 'Lagos')).split(',')[0]}
                        </AppText>
                      </View>

                      <View style={styles.priceContainer}>
                        {(Number(bee.price) > 0) ? (
                          <AppText variant="bold" color={colors.primary} size="sm">₦{Number(bee.price).toLocaleString()}</AppText>
                        ) : (
                          <AppText variant="bold" color={colors.success} size="xs">PRICE NEGOTIABLE</AppText>
                        )}
                        
                        {bee.offersInspection && (
                          <View style={[styles.inspectionBadge, { backgroundColor: colors.primary + '08' }]}>
                             <AppText size="xs" color={colors.primary} variant="medium">
                               Insp: ₦{Number(bee.inspectionPrice || 0).toLocaleString()}
                             </AppText>
                          </View>
                        )}
                      </View>
                    </View>
                    <CaretRight size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                  </Ripple>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 450,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  inspectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestedBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: 100,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 60,
  }
});
