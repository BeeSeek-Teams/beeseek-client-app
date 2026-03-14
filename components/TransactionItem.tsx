import { AppText } from '@/components/AppText';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ArrowDownLeft, ArrowUpRight, Lock, Receipt } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TransactionType = 'CREDIT' | 'DEBIT' | 'LOCKED' | 'ESCROW' | 'REVENUE';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface TransactionItemProps {
    id: string;
    type: TransactionType;
    title: string;
    date: string;
    amount: number;
    status: TransactionStatus;
}

export function TransactionItem({ id, type, title, date, amount, status }: TransactionItemProps) {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = Colors[colorScheme];

    const isCredit = type === 'CREDIT';
    const isLocked = type === 'LOCKED';
    
    let Icon = ArrowUpRight;
    let iconColor = colors.text;
    let amountPrefix = '-';
    let amountColor = colors.text;

    if (isCredit) {
        Icon = ArrowDownLeft;
        iconColor = colors.success;
        amountPrefix = '+';
        amountColor = colors.success;
    } else if (isLocked) {
        Icon = Lock;
        iconColor = colors.warning;
        amountPrefix = '';
        amountColor = colors.warning;
    } else if (type === 'REVENUE' || type === 'ESCROW') {
        Icon = Receipt;
        iconColor = colors.primary;
        amountPrefix = '-';
    }

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Icon size={20} color={iconColor} weight="bold" />
            </View>
            
            <View style={styles.content}>
                <View style={styles.row}>
                    <AppText variant="bold" size="md" style={{ flex: 1 }} numberOfLines={1}>
                        {title}
                    </AppText>
                    <AppText variant="bold" size="md" color={amountColor}>
                        {amountPrefix}₦{Math.abs(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </AppText>
                </View>
                
                <View style={[styles.row, { marginTop: 4 }]}>
                    <View style={{ flex: 1 }}>
                        <AppText size="xs" color={colors.textSecondary}>
                            {date}
                        </AppText>
                        <AppText size="xs" color={colors.textSecondary} style={{ fontSize: 10, marginTop: 2 }}>
                            Ref: {id.slice(0, 13).toUpperCase()}
                        </AppText>
                    </View>
                    <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(status, colors) + '15' }
                    ]}>
                        <AppText size="xs" color={getStatusColor(status, colors)} variant="bold" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                            {status}
                        </AppText>
                    </View>
                </View>
            </View>
        </View>
    );
}

function getStatusColor(status: TransactionStatus, colors: any) {
    switch (status) {
        case 'SUCCESS': return colors.success;
        case 'PENDING': return colors.warning;
        case 'FAILED': return colors.error;
        default: return colors.textSecondary;
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    content: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    }
});
