import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppModal } from '@/components/AppModal';
import { AppText } from '@/components/AppText';
import { AppTextArea } from '@/components/AppTextArea';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadService } from '@/services/upload.service';
import { Plus, Trash } from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

interface CreateTicketModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (subject: string, description: string, evidence?: string[]) => void;
}

export const CreateTicketModal = ({ visible, onClose, onSubmit }: CreateTicketModalProps) => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const MAX_SUBJECT = 50;
    const MAX_DESCRIPTION = 500;
    const MAX_IMAGES = 5;

    const handlePickImage = async (source: 'camera' | 'library') => {
        setIsPickerVisible(false);
        try {
            const uri = await uploadService.pickImage(source);
            if (uri) {
                setIsUploading(true);
                // Use uploadFile for optimization (compression/resizing)
                const result = await uploadService.uploadFile(uri, 'documents');
                setImages(prev => [...prev, result.url]);
            }
        } catch (error) {
            console.error('[CreateTicketModal] Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (subject.trim() && description.trim()) {
            onSubmit(subject, description, images);
            setSubject('');
            setDescription('');
            setImages([]);
        }
    };

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Create New Ticket"
            height="75%"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: Spacing.xl, paddingHorizontal: Spacing.md }}
                >
                    <View style={{ gap: Spacing.md }}>
                        <View>
                            <View style={styles.labelRow}>
                                <AppText variant="bold">Subject</AppText>
                                <AppText size="xs" color={subject.length >= MAX_SUBJECT ? colors.error : colors.textSecondary}>
                                    {subject.length}/{MAX_SUBJECT}
                                </AppText>
                            </View>
                            <AppInput
                                placeholder="e.g., Payment Issue"
                                value={subject}
                                onChangeText={(text) => text.length <= MAX_SUBJECT && setSubject(text)}
                            />
                        </View>

                        <View>
                            <View style={styles.labelRow}>
                                <AppText variant="bold">Description</AppText>
                                <AppText size="xs" color={description.length >= MAX_DESCRIPTION ? colors.error : colors.textSecondary}>
                                    {description.length}/{MAX_DESCRIPTION}
                                </AppText>
                            </View>
                            <AppTextArea
                                placeholder="Please describe your issue in detail..."
                                value={description}
                                onChangeText={(text) => text.length <= MAX_DESCRIPTION && setDescription(text)}
                                numberOfLines={6}
                            />
                        </View>

                        <View>
                            <View style={styles.labelRow}>
                                <AppText variant="bold">Evidence (Optional)</AppText>
                                <AppText size="xs" color={colors.textSecondary}>{images.length}/{MAX_IMAGES}</AppText>
                            </View>
                            
                            <View style={styles.imageGrid}>
                                {images.map((url, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image source={{ uri: url }} style={styles.previewImage} />
                                        <TouchableOpacity 
                                            onPress={() => removeImage(index)}
                                            style={[styles.removeBtn, { backgroundColor: colors.error }]}
                                        >
                                            <Trash size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                
                                {images.length < MAX_IMAGES && (
                                    <Ripple 
                                        onPress={() => setIsPickerVisible(true)}
                                        style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : (
                                            <>
                                                <Plus size={24} color={colors.textSecondary} />
                                                <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 4 }}>Add</AppText>
                                            </>
                                        )}
                                    </Ripple>
                                )}
                            </View>
                        </View>

                        <AppButton 
                            title="Submit Ticket" 
                            onPress={handleSubmit} 
                            disabled={!subject.trim() || !description.trim() || isUploading}
                            style={{ marginTop: Spacing.sm, marginBottom: Spacing.lg }}
                        />
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            <ImagePickerModal 
                visible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                onSelect={handlePickImage}
                title="Upload Evidence"
            />
        </AppModal>
    );
};

const styles = StyleSheet.create({
    labelRow: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 6
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imageWrapper: {
        width: 70,
        height: 70,
        borderRadius: 8,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    addBtn: {
        width: 70,
        height: 70,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
