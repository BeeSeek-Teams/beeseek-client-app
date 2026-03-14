import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Check } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TimelineStepStatus = 'completed' | 'current' | 'pending';

export interface TimelineStep {
    id: string;
    title: string;
    description?: string; // e.g. "Sub: ..."
    status: TimelineStepStatus;
    timestamp?: string;
}

interface JobTimelineProps {
    steps: TimelineStep[];
    accentColor?: string;
}

export const JobTimeline = ({ steps, accentColor }: JobTimelineProps) => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];
    const activeColor = accentColor || colors.primary;

    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                let iconColor = colors.border;
                let lineColor = colors.border;

                if (step.status === 'completed') {
                    iconColor = activeColor;
                    lineColor = activeColor;
                } else if (step.status === 'current') {
                    iconColor = activeColor;
                    lineColor = colors.border; // Line after current is pending
                }

                return (
                    <View key={step.id} style={styles.stepContainer}>
                        {/* Left: Icon and Line */}
                        <View style={styles.leftColumn}>
                            <View style={[
                                styles.iconContainer, 
                                { 
                                    borderColor: iconColor,
                                    backgroundColor: step.status === 'completed' ? iconColor : colors.background 
                                }
                            ]}>
                                {step.status === 'completed' ? (
                                    <Check size={12} color="#fff" weight="bold" />
                                ) : (
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: step.status === 'current' ? activeColor :  'transparent' }} />
                                )}
                            </View>
                            {!isLast && (
                                <View style={[styles.line, { backgroundColor: step.status === 'completed' ? activeColor : colors.border }]} />
                            )}
                        </View>

                        {/* Right: Content */}
                        <View style={[styles.contentContainer, { paddingBottom: isLast ? 0 : Spacing.xl }]}>
                            <AppText 
                                variant={step.status === 'current' ? 'bold' : 'medium'} 
                                color={step.status === 'pending' ? colors.textSecondary : colors.text}
                            >
                                {step.title}
                            </AppText>
                            {step.description && (
                                <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>
                                    {step.description}
                                </AppText>
                            )}
                            {step.timestamp && (
                                <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2, fontStyle: 'italic' }}>
                                    {step.timestamp}
                                </AppText>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
    },
    stepContainer: {
        flexDirection: 'row',
    },
    leftColumn: {
        alignItems: 'center',
        marginRight: Spacing.md,
        width: 24,
    },
    iconContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: -2, // Connects dots ideally
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-start',
    },
});
