import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contractService } from '@/services/contract.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Briefcase, Calendar, CheckCircle, Clock, CreditCard, Download, FileText, Info, MapPin, Plus, ShieldCheck, WarningCircle, XCircle } from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { AppLoader } from './AppLoader';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

interface ContractMessageProps {
  message: any;
  isSender: boolean;
  onPay?: (contract: any) => void;
  onComplete?: (contract: any) => void;
  onCancel?: (contractId: string) => void;
  onViewDetails?: (contract: any) => void;
}

export const ContractMessage = ({ message, isSender, onPay, onComplete, onCancel, onViewDetails }: ContractMessageProps) => {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { contract, type } = message;
  const [showAgreement, setShowAgreement] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!contract) return null;

  const isRequest = type === 'service_request';
  const isQuote = type === 'service_quote';
  const isAgreementActive = ['PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(contract.status);
  const isTerminated = contract.status === 'CANCELLED';

  // Financial Harmonization - Single Source of Truth
  const workmanshipNaira = Number(contract.workmanshipCost || 0) / 100;
  const transportNaira = Number(contract.transportFare || 0) / 100;

  // Expiration Logic: 30-minute guard
  const isExpired = (() => {
    if (contract.status !== 'PENDING' && contract.status !== 'ACCEPTED') return false;
    
    try {
      const now = new Date();
      const [year, month, day] = contract.workDate.split('-').map(Number);
      const [hours, minutes] = contract.startTime.split(':').map(Number);
      const bookingStart = new Date(year, month - 1, day, hours, minutes);
      
      // Expire if time is in the past OR less than 30 minutes away
      const diffMs = bookingStart.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);
      
      return diffMins < 30;
    } catch (e) {
      return false;
    }
  })();

  const materialsTotalNaira = (contract.materials || []).reduce((acc: number, m: any) => acc + (Number(m.cost || 0) / 100), 0);
  const baseGrossNaira = workmanshipNaira + transportNaira + materialsTotalNaira;
  const commissionNaira = Number(contract.commissionAmount || 0) / 100;
  const serviceFeeNaira = Number(contract.serviceFee || 0) / 100;
  
  // What the Agent actually gets
  const netEarningsNaira = baseGrossNaira - commissionNaira;
  // What the Client actually pays (Total)
  const totalClientCostNaira = baseGrossNaira + serviceFeeNaira;
  
  const userBalanceNaira = (user?.walletBalance || 0) / 100;
  const hasInsufficientFunds = userBalanceNaira < totalClientCostNaira;

  const formatTime12h = (time: string) => {
    if (!time) return '';
    // If it's already 12h formatted (contains AM/PM)
    if (time.includes('AM') || time.includes('PM')) return time;
    
    const parts = time.split(':');
    if (parts.length < 2) return time;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  };

  const formatWorkDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await contractService.downloadPdf(contract.id, contract.contractNumber || contract.id);
    } catch (error) {
      console.error('PDF Download Error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStatus = () => {
      let color = colors.textSecondary;
      let icon = <Info size={16} color={color} />;
      
      if (contract.status === 'ACCEPTED') {
          color = colors.success;
          icon = <CheckCircle size={16} color={color} weight="fill" />;
      } else if (contract.status === 'REJECTED') {
          color = colors.error;
          icon = <XCircle size={16} color={color} weight="fill" />;
      } else if (contract.status === 'CANCELLED') {
        color = colors.error;
        icon = <WarningCircle size={16} color={color} weight="fill" />;
      } else if (contract.status === 'PAID') {
          color = colors.primary;
          icon = <ShieldCheck size={16} color={color} weight="fill" />;
      } else if (contract.status === 'COMPLETED') {
        color = colors.success;
        icon = <CheckCircle size={16} color={color} weight="fill" />;
      }
      
      return (
          <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
              {icon}
              <AppText size="xs" variant="bold" color={color} style={{ marginLeft: 4 }}>
                  {contract.status === 'PAID' ? 'ACTIVE' : contract.status === 'CANCELLED' ? 'TERMINATED' : contract.status}
              </AppText>
          </View>
      );
  };

  const renderAgreementDoc = () => (
    <View style={styles.agreementModalContent}>
      <View style={[styles.docHeader, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="bold" size="xl">{isTerminated ? 'Terminated Agreement' : 'Service Agreement'}</AppText>
          <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>REF: BS-{contract.id.slice(0, 8).toUpperCase()}</AppText>
        </View>
        {isTerminated ? (
          <XCircle size={32} color={colors.error} weight="fill" />
        ) : (
          <ShieldCheck size={32} color={colors.primary} weight="fill" />
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {isTerminated && (
          <View style={{ backgroundColor: colors.error + '10', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: colors.error, borderStyle: 'dashed' }}>
            <AppText variant="bold" color={colors.error} size="sm">VOID & TERMINATED</AppText>
            <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 4 }}>
              This agreement was legally terminated via platform protocol. Financial reconciliations have been processed according to the BeeSeek Cancellation Policy.
            </AppText>
          </View>
        )}
        <View style={styles.agreementSection}>
          <AppText variant="bold" size="sm" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>1. Legal Entities</AppText>
          <View style={[styles.partyBox, { backgroundColor: colors.surface }]}>
            <View style={styles.partyRow}>
              <AppText size="xs" color={colors.textSecondary}>Service Provider (Agent)</AppText>
              <AppText variant="semiBold" size="sm">{contract.agent?.firstName || 'System'} {contract.agent?.lastName || 'User'}</AppText>
            </View>
            <View style={styles.partyRow}>
              <AppText size="xs" color={colors.textSecondary}>Contracting Client</AppText>
              <AppText variant="semiBold" size="sm">{contract.client?.firstName || 'System'} {contract.client?.lastName || 'User'}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.agreementSection}>
          <AppText variant="bold" size="sm" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>2. Scope of Service</AppText>
          <AppText size="sm" style={{ lineHeight: 22, color: colors.textSecondary }}>
            {contract.details}
          </AppText>
        </View>

        <View style={styles.agreementSection}>
          <AppText variant="bold" size="sm" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>3. Financial Schedule</AppText>
          <View style={{ gap: 8 }}>
            <View style={styles.quoteRow}>
              <AppText size="sm">Workmanship</AppText>
              <AppText variant="semiBold">₦{workmanshipNaira.toLocaleString()}</AppText>
            </View>
            <View style={styles.quoteRow}>
              <AppText size="sm">Logistics & Transport</AppText>
              <AppText variant="semiBold">₦{transportNaira.toLocaleString()}</AppText>
            </View>
            {contract.materials?.length > 0 && (
              <View style={[styles.materialsList, { backgroundColor: colors.surface }]}>
                {contract.materials.map((m: any, i: number) => (
                  <View key={i} style={styles.materialItem}>
                    <AppText size="xs">{m.item}</AppText>
                    <AppText size="xs" variant="bold">₦{(Number(m.cost)/100).toLocaleString()}</AppText>
                  </View>
                ))}
              </View>
            )}
            
            <View style={[styles.quoteRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
              <AppText variant="bold" size="sm">Gross Contract Value</AppText>
              <AppText variant="bold" size="sm">₦{baseGrossNaira.toLocaleString()}</AppText>
            </View>

            <View style={styles.quoteRow}>
              <AppText size="xs" color={colors.textSecondary}>Platform Service Fee (Client)</AppText>
              <AppText size="xs" color={colors.textSecondary}>+ ₦{serviceFeeNaira.toLocaleString()}</AppText>
            </View>

            <View style={styles.quoteRow}>
              <AppText variant="semiBold" size="sm">Total Payment (Outlay)</AppText>
              <AppText variant="semiBold" size="sm">₦{totalClientCostNaira.toLocaleString()}</AppText>
            </View>

            <View style={[styles.quoteRow, { marginTop: 4 }]}>
              <AppText size="xs" color={colors.textSecondary}>Platform Commission (Agent)</AppText>
              <AppText size="xs" color={colors.error}>- ₦{commissionNaira.toLocaleString()}</AppText>
            </View>

            <View style={[styles.quoteRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
              <AppText variant="bold" color={colors.success}>Net Agent Payout</AppText>
              <AppText variant="bold" size="lg" color={colors.success}>₦{netEarningsNaira.toLocaleString()}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.agreementSection}>
          <AppText variant="bold" size="sm" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>4. Binding Terms</AppText>
          <AppText size="xs" color={colors.textSecondary} style={{ lineHeight: 18 }}>
            • Funds are held securely by BeeSeek as the neutral Escrow Agent.{"\n"}
            • Service Provider shall mark the job as 'Completed' upon physical delivery.{"\n"}
            • Client has 48 hours to inspect and release funds after completion.{"\n"}
            • This document is a legally binding record and forensic evidence of the agreement.
          </AppText>
        </View>

        <View style={styles.agreementSection}>
          <AppText variant="bold" size="sm" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>5. Platform Protections</AppText>
          <AppText size="xs" color={colors.textSecondary} style={{ lineHeight: 18 }}>
            • <AppText variant="bold" size="xs" color={colors.textSecondary}>Arbitration:</AppText> Parties agree that BeeSeek is the final arbitrator for Escrow fund disputes based on platform evidence.{"\n"}
            • <AppText variant="bold" size="xs" color={colors.textSecondary}>Liability:</AppText> BeeSeek is a venue provider and is not liable for party conduct, damages, or quality of service.{"\n"}
            • <AppText variant="bold" size="xs" color={colors.textSecondary}>Governing Law:</AppText> This agreement is governed by the laws of the Federal Republic of Nigeria.
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.agreementActions}>
        <Ripple 
          style={[styles.pdfButton, { borderColor: colors.primary }]}
          onPress={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Download size={20} color={colors.primary} />
          )}
          <View>
            <AppText color={colors.primary} variant="bold" size="sm">{isDownloading ? 'Processing...' : 'Export Agreement (PDF)'}</AppText>
            <AppText color={colors.textSecondary} size="xs">Digital certified copy</AppText>
          </View>
        </Ripple>

        <Ripple 
          style={[styles.closeButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAgreement(false)}
        >
          <AppText color="#fff" variant="bold">Got it</AppText>
        </Ripple>
      </View>
    </View>
  );

  return (
    <View style={[
        styles.container, 
        { 
            backgroundColor: isTerminated ? colors.error + '05' : (isAgreementActive ? colors.primary + '05' : colors.background), 
            borderColor: isTerminated ? colors.error : (isAgreementActive ? colors.primary : colors.border),
            borderBottomRightRadius: isSender ? 4 : 20,
            borderBottomLeftRadius: !isSender ? 4 : 20,
            borderWidth: isAgreementActive ? 1.5 : 1,
        }
    ]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isTerminated ? colors.error + '10' : (isAgreementActive ? colors.primary + '10' : colors.primary + '08') }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconWrapper, { backgroundColor: isTerminated ? colors.error : colors.primary }]}>
                {isTerminated ? <WarningCircle size={16} color="#fff" weight="bold" /> : (isAgreementActive ? <ShieldCheck size={16} color="#fff" weight="bold" /> : <Briefcase size={16} color="#fff" weight="bold" />)}
              </View>
              <AppText variant="bold" style={{ marginLeft: 10 }}>
                  {isTerminated ? 'Terminated Agreement' : (isAgreementActive ? 'Service Agreement' : isRequest ? 'Hire Request' : 'Job Quote')}
              </AppText>
          </View>
          {renderStatus()}
      </View>

      <View style={styles.body}>
          {isRequest && !isAgreementActive ? (
              <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <AppText variant="bold" size="lg" style={{ flex: 1 }}>{contract.bee?.title || 'Requested Service'}</AppText>
                    {contract.type === 'INSPECTION' ? (
                        <View style={[styles.typeBadge, { backgroundColor: '#F59E0B' }]}>
                            <AppText size="xs" color="#fff" variant="bold">INSPECTION</AppText>
                        </View>
                    ) : (
                        <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                            <AppText size="xs" color="#fff" variant="bold">TASK</AppText>
                        </View>
                    )}
                  </View>
                  
                  <View style={[styles.detailsBox, { backgroundColor: colors.surface }]}>
                    <AppText size="sm" color={colors.text} style={{ lineHeight: 20 }}>
                        {contract.details}
                    </AppText>
                  </View>

                  <View style={styles.grid}>
                    <View style={styles.gridItem}>
                      <Calendar size={18} color={colors.primary} />
                      <View style={{ marginLeft: 10 }}>
                        <AppText size="xs" color={colors.textSecondary}>Date</AppText>
                        <AppText size="sm" variant="bold">{formatWorkDate(contract.workDate)}</AppText>
                      </View>
                    </View>
                    <View style={styles.gridItem}>
                      <Clock size={16} color={colors.primary} />
                      <View style={{ marginLeft: 10 }}>
                        <AppText size="xs" color={colors.textSecondary}>Time</AppText>
                        <AppText size="sm" variant="bold">{formatTime12h(contract.startTime)}</AppText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.locationRow, { borderTopColor: colors.border }]}>
                      <MapPin size={18} color={colors.primary} />
                      <AppText size="sm" style={{ marginLeft: 8, flex: 1 }} numberOfLines={1}>{contract.address}</AppText>
                  </View>
              </>
          ) : (
              <>
                  {isAgreementActive && (
                    <View style={{ marginBottom: 16 }}>
                      <AppText variant="bold" size="lg" color={isTerminated ? colors.textSecondary : colors.text}>{contract.bee?.title || 'Professional Service'}</AppText>
                      <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {isTerminated ? 'Contract was legally dissolved' : 'Secure Escrow Agreement'}
                      </AppText>
                    </View>
                  )}

                  {isTerminated && (
                    <View style={[styles.cancellationBanner, { backgroundColor: colors.error + '05', borderColor: colors.error }]}>
                        <WarningCircle size={20} color={colors.error} weight="fill" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <AppText variant="bold" size="sm" color={colors.error}>Termination recorded in ledger</AppText>
                             {contract.job?.cancellationAudit && (
                                <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>
                                    Category: {contract.job.cancellationAudit.category}
                                </AppText>
                            )}
                        </View>
                    </View>
                  )}
                  
                  <View style={styles.quoteRow}>
                      <AppText size="sm" color={colors.textSecondary}>Workmanship</AppText>
                      <AppText variant="bold">₦{(Number(contract.workmanshipCost || 0) / 100).toLocaleString()}</AppText>
                  </View>
                  <View style={styles.quoteRow}>
                      <AppText size="sm" color={colors.textSecondary}>Transport Fare</AppText>
                      <AppText variant="bold">₦{(Number(contract.transportFare || 0) / 100).toLocaleString()}</AppText>
                  </View>
                  {contract.materials?.length > 0 && (
                      <View style={[styles.materialsList, { backgroundColor: colors.surface }]}>
                          <AppText size="xs" variant="bold" color={colors.textSecondary} style={{ marginBottom: 6, textTransform: 'uppercase' }}>Materials Breakdown</AppText>
                          {contract.materials.map((m: any, i: number) => (
                              <View key={i} style={styles.materialItem}>
                                  <AppText size="sm">{m.item}</AppText>
                                  <AppText size="sm" variant="bold">₦{(Number(m.cost || 0) / 100).toLocaleString()}</AppText>
                              </View>
                          ))}
                      </View>
                  )}
                  <View style={[styles.quoteRow, { marginTop: 8 }]}>
                      <AppText size="sm" color={colors.textSecondary}>Service Fee</AppText>
                      <AppText variant="bold">₦{(Number(contract.serviceFee || 0) / 100).toLocaleString()}</AppText>
                  </View>
                  <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                      <View>
                        <AppText variant="bold" size="sm">Total Payment</AppText>
                        <AppText size="xs" color={colors.textSecondary}>Inclusive of all fees</AppText>
                      </View>
                      <AppText variant="bold" size="xl" color={colors.primary}>₦{totalClientCostNaira.toLocaleString()}</AppText>
                  </View>
              </>
          )}
      </View>

      <AppModal 
        visible={showAgreement} 
        onClose={() => setShowAgreement(false)}
        title="Service Agreement"
        height="90%"
      >
        {renderAgreementDoc()}
      </AppModal>

      {!isSender && isQuote && (
          <View style={[styles.footer, { borderTopColor: colors.border, justifyContent: 'center' }]}>
              {isExpired ? (
                <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                  <WarningCircle size={24} color={colors.error} weight="fill" />
                  <AppText size="xs" color={colors.error} variant="bold">Quote Expired</AppText>
                  <AppText size="xs" color={colors.textSecondary}>This offer is no longer valid due to time constraints.</AppText>
                </View>
              ) : isTerminated ? (
                <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                  <WarningCircle size={24} color={colors.error} weight="fill" />
                  <AppText size="xs" color={colors.error} variant="bold">Job Terminated</AppText>
                  <Ripple 
                    onPress={() => setShowAgreement(true)}
                    style={{ padding: 4 }}
                  >
                    <AppText size="xs" color={colors.textSecondary} variant="bold">View Termination Records</AppText>
                  </Ripple>
                </View>
              ) : contract.status === 'ACCEPTED' ? (
                  hasInsufficientFunds ? (
                    <Ripple 
                      style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, width: '100%' }]}
                      onPress={() => router.push('/wallet')}
                      rippleColor={colors.primary}
                    >
                        <Plus size={18} color={colors.primary} style={{ marginRight: 6 }} />
                        <AppText color={colors.primary} variant="bold" size="xs">Top up ₦{(totalClientCostNaira - userBalanceNaira).toLocaleString()} to Pay</AppText>
                    </Ripple>
                  ) : (
                    <Ripple 
                      style={[styles.actionBtn, { backgroundColor: user?.isNinVerified ? colors.primary : colors.border, width: '100%' }]}
                      onPress={() => user?.isNinVerified && onPay?.(contract)}
                      disabled={!user?.isNinVerified}
                      rippleColor="#fff"
                    >
                        <CreditCard size={18} color={user?.isNinVerified ? "#fff" : colors.textSecondary} style={{ marginRight: 6 }} />
                        <AppText color={user?.isNinVerified ? "#fff" : colors.textSecondary} variant="bold" size="xs">
                          {user?.isNinVerified ? 'Proceed to Pay' : user?.ninStatus === 'PENDING' ? 'Verification Pending' : 'Verification Required'}
                        </AppText>
                    </Ripple>
                  )
              ) : (contract.status === 'PAID' || contract.status === 'IN_PROGRESS') ? (
                  <View style={{ width: '100%', gap: 12 }}>
                    <Ripple 
                      style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, width: '100%' }]}
                      onPress={() => setShowAgreement(true)}
                    >
                        <FileText size={18} color={colors.primary} style={{ marginRight: 6 }} />
                        <AppText color={colors.primary} variant="bold" size="xs">Read Full Agreement</AppText>
                    </Ripple>

                    <View style={[styles.divider, { backgroundColor: colors.border, height: 1.5, opacity: 0.5 }]} />

                    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                      <AppText size="xs" color={colors.success} variant="bold">Escrow Active · Funds Secured</AppText>
                      <AppText size="xs" color={colors.textSecondary} style={{ marginTop: 2 }}>Manage this job in the tracking screen</AppText>
                    </View>
                  </View>
              ) : contract.status === 'COMPLETED' ? (
                  <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={24} color={colors.success} weight="fill" />
                    <AppText size="xs" color={colors.success} variant="bold">Job Completed · Funds Released</AppText>
                    <Ripple 
                      onPress={() => setShowAgreement(true)}
                      style={{ padding: 4 }}
                    >
                      <AppText size="xs" color={colors.primary} variant="bold">View Archived Agreement</AppText>
                    </Ripple>
                  </View>
              ) : (
                  <AppText size="xs" color={colors.textSecondary}>Quote is no longer active</AppText>
              )}
          </View>
      )}

      {isSender && isQuote && (
          <View style={[styles.footer, { borderTopColor: colors.border, justifyContent: 'center' }]}>
              {isExpired ? (
                <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                  <XCircle size={24} color={colors.textSecondary} weight="fill" />
                  <AppText size="xs" color={colors.textSecondary} variant="bold">Quote Expired</AppText>
                </View>
              ) : isTerminated ? (
                <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                  <XCircle size={24} color={colors.error} weight="fill" />
                  <AppText size="xs" color={colors.error} variant="bold">Contract Cancelled</AppText>
                  <Ripple onPress={() => setShowAgreement(true)}>
                    <AppText size="xs" color={colors.textSecondary} variant="bold">View Transaction Logs</AppText>
                  </Ripple>
                </View>
              ) : contract.status === 'ACCEPTED' ? (
                  <AppText size="xs" color={colors.textSecondary}>Waiting for Client to pay...</AppText>
              ) : (contract.status === 'PAID' || contract.status === 'IN_PROGRESS') ? (
                  <View style={{ width: '100%', gap: 12 }}>
                    <Ripple 
                      style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, width: '100%' }]}
                      onPress={() => setShowAgreement(true)}
                    >
                        <FileText size={18} color={colors.primary} style={{ marginRight: 6 }} />
                        <AppText color={colors.primary} variant="bold" size="xs">Read Signed Agreement</AppText>
                    </Ripple>
                    <AppText size="xs" color={colors.success} variant="bold" style={{ textAlign: 'center' }}>Job Active · Escrow Verified</AppText>
                  </View>
              ) : contract.status === 'COMPLETED' ? (
                  <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={24} color={colors.success} weight="fill" />
                    <AppText size="xs" color={colors.success} variant="bold">Payment Received · Relationship Closed</AppText>
                    <Ripple onPress={() => setShowAgreement(true)}>
                      <AppText size="xs" color={colors.primary} variant="bold">View Agreement Records</AppText>
                    </Ripple>
                  </View>
              ) : (
                  <AppText size="xs" color={colors.textSecondary}>Quote is no longer active</AppText>
              )}
          </View>
      )}

      {isSender && isRequest && (
        <View style={[styles.footer, { borderTopColor: colors.border, justifyContent: 'center' }]}>
          {isExpired ? (
            <View style={{ width: '100%', alignItems: 'center', gap: 4 }}>
              <WarningCircle size={20} color={colors.error} weight="fill" />
              <AppText size="xs" color={colors.error} variant="bold">Request Expired</AppText>
              <AppText size="xs" color={colors.textSecondary}>Scheduled time too close or past</AppText>
            </View>
          ) : contract.status === 'PENDING' ? (
            <AppText size="xs" color={colors.textSecondary}>Waiting for Agent's response...</AppText>
          ) : contract.status === 'ACCEPTED' || isAgreementActive ? (
            <AppText size="xs" color={colors.success} variant="bold">Contract Initiated</AppText>
          ) : (
            <AppText size="xs" color={colors.error} variant="bold">Agent declined your request</AppText>
          )}
        </View>
      )}

      {!isSender && isRequest && (
        <View style={[styles.footer, { borderTopColor: colors.border, justifyContent: 'center' }]}>
          {isExpired ? (
             <View style={{ width: '100%', alignItems: 'center', gap: 4 }}>
              <XCircle size={20} color={colors.textSecondary} weight="fill" />
              <AppText size="xs" color={colors.textSecondary} variant="bold">Request Expired</AppText>
            </View>
          ) : contract.status === 'PENDING' ? (
            <AppText size="xs" color={colors.textSecondary}>Pending your quote</AppText>
          ) : contract.status === 'ACCEPTED' || isAgreementActive ? (
            <AppText size="xs" color={colors.success} variant="bold">Quote sent</AppText>
          ) : (
            <AppText size="xs" color={colors.error} variant="bold">Request declined</AppText>
          )}
        </View>
      )}
      <AppLoader visible={isDownloading} message="Generating Document..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cancellationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  body: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialsList: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  agreementModalContent: {
    padding: 8,
    flex: 1,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  agreementSection: {
    marginBottom: 24,
  },
  partyBox: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agreementActions: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  pdfButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  closeButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    backgroundColor: '#E5E5E5',
    height: 1,
  }
});

