import { AlertType, AppAlert } from '@/components/AppAlert';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { JobCancellationModal } from '@/components/JobCancellationModal';
import { JobTimeline, TimelineStep } from '@/components/JobTimeline';
import { PayoutBreakdownModal } from '@/components/PayoutBreakdownModal';
import { ReviewModal } from '@/components/ReviewModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecurityPinModal } from '@/components/SecurityPinModal';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useJobSocket } from '@/hooks/use-job-socket';
import { chatService } from '@/services/chat.service';
import { contractService } from '@/services/contract.service';
import { reviewService } from '@/services/review.service';
import { useAuthStore } from '@/store/useAuthStore';
import dayjs from 'dayjs';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, ChatTeardropText, Check, Copy, Info, MagnifyingGlass, Phone, ShieldWarning } from 'phosphor-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

// Interfaces for State Logic
type JobState = 'ALL_SET' | 'MATERIALS_PURCHASED' | 'ON_THE_WAY' | 'ARRIVED' | 'STARTED' | 'FINISHED' | 'HOME_SAFE' | 'COMPLETED';

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [cancellationModalVisible, setCancellationModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Alert Config
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm: () => void;
  }>({ visible: false, type: 'info', title: '', message: '', onConfirm: () => {} });

  const { joinJobRoom, leaveJobRoom, onJobUpdate } = useJobSocket();

  const showAlert = (config: any) => setAlertConfig({ 
    showCancel: false, 
    ...config, 
    visible: true, 
    onConfirm: config.onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false }))) 
  });

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    joinJobRoom(id as string);

    const unsubscribe = onJobUpdate((updatedJob) => {
      if (updatedJob.id === id) {
        console.log('[CLIENT_SOCKET] Real-time job update received');
        fetchJob();
      }
    });

    return () => {
      unsubscribe();
      leaveJobRoom(id as string);
    };
  }, [id]);

  const fetchJob = async () => {
    try {
      const data = await contractService.getJob(id as string);
      setJobData(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeline = useMemo(() => {
    if (!jobData) return [];
    
    const steps: TimelineStep[] = [];
    const { contract, currentStep, status } = jobData;
    const hasMaterials = (contract.materials?.length || 0) > 0;

    const getStatus = (stepName: string) => {
        if (status === 'CANCELLED') return 'pending';
        
        const order = ['ALL_SET', 'MATERIALS_PURCHASED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'FINISHED', 'HOME_SAFE'];
        const currentIdx = order.indexOf(currentStep);

        if (stepName === 'COMPLETED') {
            return (jobData.completedAt || status === 'COMPLETED') ? 'completed' : 
                   (currentStep === 'FINISHED' || currentStep === 'HOME_SAFE' ? 'current' : 'pending');
        }

        const thisIdx = order.indexOf(stepName);
        if (thisIdx === -1) return 'pending';

        if (thisIdx <= currentIdx || status === 'COMPLETED') return 'completed';

        if (thisIdx === currentIdx + 1 && status === 'ACTIVE') return 'current';
        
        if (currentStep === 'ALL_SET' && !hasMaterials && stepName === 'ON_THE_WAY' && status === 'ACTIVE') {
            return 'current';
        }

        return 'pending';
    };

    const formatTime = (date?: string) => date ? dayjs(date).format('hh:mm A') : undefined;

    // 1. All Set
    steps.push({
        id: '1',
        title: 'All is Set',
        description: 'Contract signed, payment escrowed',
        status: getStatus('ALL_SET'),
        timestamp: formatTime(jobData.paidAt)
    });

    // 2. Materials (Optional)
    if (hasMaterials) {
        steps.push({
            id: '2',
            title: 'Materials Purchased',
            description: 'Agent has acquired required materials',
            status: getStatus('MATERIALS_PURCHASED'),
            timestamp: formatTime(jobData.materialsPurchasedAt)
        });
    }

    // 3. En Route
    steps.push({
        id: '3',
        title: 'On the Way',
        description: 'Agent is en route to location',
        status: getStatus('ON_THE_WAY'),
        timestamp: formatTime(jobData.onTheWayAt)
    });

    // 4. Arrived
    steps.push({
        id: '4',
        title: 'Arrived',
        description: 'Agent has arrived at location',
        status: getStatus('ARRIVED'),
        timestamp: formatTime(jobData.arrivedAt)
    });

    // 5. Started
    steps.push({
        id: '5',
        title: 'Started',
        description: 'Work in progress',
        status: getStatus('STARTED'),
        timestamp: formatTime(jobData.startedAt)
    });

    // 6. Finished
    steps.push({
        id: '6',
        title: 'Finished',
        description: 'Agent marked work as completed',
        status: getStatus('FINISHED'),
        timestamp: formatTime(jobData.finishedAt)
    });

    // 7. Completed (Payment Released) - Moved before Home Safe
    steps.push({
        id: '7',
        title: 'Payment Released',
        description: 'Funds transferred to agent',
        status: getStatus('COMPLETED'),
        timestamp: formatTime(jobData.completedAt)
    });

    // 8. Feedback (New)
    const clientReview = jobData.reviews?.find((r: any) => r.reviewerId === jobData.contract.clientId);
    steps.push({
        id: '8',
        title: 'Feedback',
        description: clientReview ? `You rated ${clientReview.rating} stars` : 'Review the service provided',
        status: clientReview ? 'completed' : (jobData.status === 'COMPLETED' ? 'current' : 'pending'),
        timestamp: formatTime(clientReview?.createdAt)
    });

    // 9. Home Safe - Moved to end
    steps.push({
        id: '9',
        title: 'Home Safe',
        description: 'Agent returned safely',
        status: getStatus('HOME_SAFE'),
        timestamp: formatTime(jobData.homeSafeAt)
    });

    return steps;
  }, [jobData]);

  if (loading) {
    return (
      <AppScreen disablePadding>
        {/* Header Skeleton */}
        <View style={{ padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md }}>
            <AppSkeleton width={32} height={32} borderRadius={16} />
            <AppSkeleton width={120} height={24} />
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
            {/* Main Info */}
            <View style={{ marginBottom: Spacing.xl }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                    <AppSkeleton width={80} height={24} borderRadius={8} />
                    <AppSkeleton width={60} height={24} />
                </View>
                <AppSkeleton width={200} height={32} style={{ marginBottom: Spacing.sm }} />
                <AppSkeleton width="100%" height={16} style={{ marginBottom: 4 }} />
                <AppSkeleton width="80%" height={16} />
            </View>

            {/* Worker Info */}
            <View style={{ marginBottom: Spacing.xl }}>
                 <AppSkeleton width={60} height={16} style={{ marginBottom: Spacing.md }} />
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <AppSkeleton width={140} height={24} style={{ marginBottom: 4 }} />
                        <AppSkeleton width={100} height={16} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <AppSkeleton width={40} height={40} borderRadius={20} />
                        <AppSkeleton width={40} height={40} borderRadius={20} />
                    </View>
                 </View>
            </View>

            {/* Timeline */}
             <AppSkeleton width="100%" height={300} borderRadius={16} />
        </ScrollView>
      </AppScreen>
    );
  }

  if (!jobData) return <AppText>Job not found</AppText>;

  const job = {
      ...jobData,
      title: jobData.contract.details.split('\n')[0],
      description: jobData.contract.details,
      workerName: `${jobData.contract.agent.firstName} ${jobData.contract.agent.lastName}`,
      workerPhone: jobData.contract.agent.phoneNumber || 'Not provided',
      // Convert from Kobo
      price: Number(jobData.contract.totalCost || 0) / 100,
      workmanship: Number(jobData.contract.workmanshipCost || 0) / 100,
      transport: Number(jobData.contract.transportFare || 0) / 100,
      materials: (jobData.contract.materials || []).map((m: any) => ({ ...m, cost: Number(m.cost || 0) / 100 })),
      serviceFee: Number(jobData.contract.serviceFee || 0) / 100,
      type: (jobData.contract.type?.toLowerCase() || (Number(jobData.contract.workmanshipCost) > 1500000 ? 'task' : 'inspection')),
      arrivalCode: jobData.arrivalCode,
  };

  const handleCall = () => {
    if (!jobData?.contract?.agent?.phoneNumber) {
       showAlert({ type: 'info', title: 'No Phone Number', message: 'The agent has not provided a phone number.' });
       return;
    }
    Linking.openURL(`tel:${jobData.contract.agent.phoneNumber}`);
 };

 const handleChat = async () => {
    try {
       const room = await chatService.getOrCreateRoom(jobData.contract.agentId);
       const name = `${jobData.contract.agent.firstName || ''} ${jobData.contract.agent.lastName || ''}`.trim() || 'Agent';
       router.push({
          pathname: '/chat/[id]',
          params: {
             id: room.id,
             name,
             avatarUrl: jobData.contract.agent.profileImage || ''
          }
       });
    } catch (e) {
       showAlert({ type: 'error', title: 'Error', message: 'Could not open chat.' });
    }
 };

  const copyCode = async () => {
      await Clipboard.setStringAsync(job.arrivalCode);
      showAlert({ type: 'success', title: 'Copied', message: 'Arrival code copied to clipboard.' });
  };

  const handleReleasePayment = () => {
      showAlert({ 
          type: 'warning', 
          title: 'Confirm Payment Release', 
          message: 'By proceeding, you confirm that the work has been completed to your satisfaction. This action will release the escrowed funds to the agent and cannot be reversed.',
          showCancel: true,
          onConfirm: async () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
              // Open PIN Modal
              setTimeout(() => setPinModalVisible(true), 100);
          }
      });
  };

  const handlePinSuccess = async (pin?: string) => {
    if (!pin) return;
    setPinModalVisible(false);
    setIsCompleting(true);

    try {
        await contractService.complete(jobData.contract.id, pin);
        showAlert({ 
            type: 'success', 
            title: 'Payment Released', 
            message: 'Funds have been successfully released to the agent. A receipt has been sent to your email.',
            onConfirm: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                setTimeout(() => setReviewModalVisible(true), 500);
            }
        });
        fetchJob(); // Refresh UI
    } catch (e: any) {
        showAlert({ 
            type: 'error', 
            title: 'Error', 
            message: e.response?.data?.message || 'Transaction failed. Please check your PIN and try again.' 
        });
    } finally {
        setIsCompleting(false);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    setIsSubmittingReview(true);
    try {
        await reviewService.submitReview({
            jobId: jobData.id,
            rating,
            comment
        });
        setReviewModalVisible(false);
        showAlert({ 
            type: 'success', 
            title: 'Thank You!', 
            message: 'Your review has been submitted. We appreciate your feedback!' 
        });
        fetchJob(); // Refresh to update timeline
    } catch (error: any) {
        showAlert({ 
            type: 'error', 
            title: 'Review Failed', 
            message: error.response?.data?.message || 'Could not submit review at this time.' 
        });
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const renderActionButtons = () => {
      if (jobData.status !== 'ACTIVE') {
          const clientReview = jobData.reviews?.find((r: any) => r.reviewerId === jobData.contract.clientId);
          if (jobData.status === 'COMPLETED' && !clientReview) {
              return (
                  <View style={styles.actionContainer}>
                      <AppButton 
                        title="Rate Agent & Give Feedback" 
                        onPress={() => setReviewModalVisible(true)} 
                      />
                  </View>
              );
          }
          return null;
      }
      
      // Allow payment release once job is FINISHED or HOME_SAFE
      if (jobData.currentStep === 'FINISHED' || jobData.currentStep === 'HOME_SAFE') {
          return (
             <View style={styles.actionContainer}>
                  <AppButton 
                    title="Release Payment" 
                    variant="primary"  
                    onPress={handleReleasePayment} 
                    loading={isCompleting}
                  />
             </View>
          );
      }

      if (jobData.currentStep === 'ON_THE_WAY' || jobData.currentStep === 'ALL_SET' || jobData.currentStep === 'MATERIALS_PURCHASED') {
          return (
              <View style={styles.actionContainer}>
                  <View style={[styles.codeBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <View>
                          <AppText size="xs" color={colors.textSecondary}>Arrival Code</AppText>
                          <AppText variant="bold" size="xl" style={{ letterSpacing: 4 }}>{job.arrivalCode}</AppText>
                      </View>
                      <Ripple onPress={copyCode} style={[styles.iconBtn, { borderColor: colors.border }]}>
                          <Copy size={20} color={colors.primary} />
                      </Ripple>
                  </View>
                  <AppText size="xs" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: Spacing.sm }}>
                      Give this code to the agent once they arrive to start the work.
                  </AppText>
              </View>
          );
      }

      return null;
  };

  const handleCancel = () => {
    setCancellationModalVisible(true);
  };

  const onConfirmCancel = async (reason: string, category: string) => {
    try {
      setIsCancelling(true);
      await contractService.cancelJob(id as string, reason, category);
      setCancellationModalVisible(false);
      showAlert({
        type: 'success',
        title: 'Job Cancelled',
        message: 'The job has been cancelled successfully. Your refund (excluding non-refundable transport) has been processed.',
        onConfirm: () => router.back()
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AppScreen disablePadding>
      <ScreenHeader 
        title={`Job #${job.id.substring(0,8)}`} 
        rightAction={
            jobData.status === 'ACTIVE' ? (
                jobData.currentStep === 'ALL_SET' ? (
                    <TouchableOpacity onPress={handleCancel}>
                        <AppText color={colors.error} variant="bold" size="sm">Cancel Job</AppText>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => router.push('/support')}>
                        <AppText color={colors.primary} variant="bold" size="sm">Contact Support</AppText>
                    </TouchableOpacity>
                )
            ) : null
        }
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Status Banner */}
          {jobData.status === 'COMPLETED' && (
              <View style={[styles.statusBanner, { backgroundColor: colors.success + '15' }]}>
                  <Check size={18} color={colors.success} weight="bold" />
                  <AppText variant="bold" color={colors.success} style={{ marginLeft: 8 }}>Job Completed Successfully</AppText>
              </View>
          )}

          {jobData.status === 'CANCELLED' && (
              <View style={[styles.statusBanner, { backgroundColor: colors.error + '15', flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Info size={18} color={colors.error} weight="bold" />
                    <AppText variant="bold" color={colors.error} style={{ marginLeft: 8 }}>This Job was Cancelled</AppText>
                  </View>
                  {jobData.cancellationAudit && (
                    <View style={{ marginLeft: 26 }}>
                       <AppText size="sm" color={colors.textSecondary}>
                         Reason: <AppText size="sm" variant="bold">{jobData.cancellationAudit.category?.replace('_', ' ')}</AppText>
                       </AppText>
                       {jobData.cancellationAudit.reason ? (
                         <AppText size="xs" color={colors.textSecondary} style={{ fontStyle: 'italic', marginTop: 2 }}>
                           "{jobData.cancellationAudit.reason}"
                         </AppText>
                       ) : null}
                    </View>
                  )}
              </View>
          )}

          {jobData.status === 'ESCALATED' && (
              <View style={[styles.statusBanner, { backgroundColor: colors.error + '15' }]}>
                  <ShieldWarning size={18} color={colors.error} weight="bold" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppText variant="bold" color={colors.error}>Job Escalated / Under Dispute</AppText>
                    <AppText size="xs" color={colors.error}>Our support team is reviewing this case. All actions are disabled.</AppText>
                  </View>
              </View>
          )}

          {/* Main Info */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.tag, { backgroundColor: job.type === 'inspection' ? colors.secondary + '15' : colors.primary + '15' }]}>
                    {job.type === 'inspection' ? <MagnifyingGlass size={14} color={colors.secondary} weight="bold"/> : <Briefcase size={14} color={colors.primary} weight="bold"/>}
                    <AppText size="xs" variant="bold" color={job.type === 'inspection' ? colors.secondary : colors.primary} style={{ marginLeft: 6, textTransform: 'uppercase' }}>{job.type}</AppText>
                </View>
                <AppText variant="bold" color={colors.primary}>₦{job.price.toLocaleString()}</AppText> 
             </View>
             
             <AppText variant="bold" size="xl" style={{ marginTop: Spacing.sm }}>{job.title}</AppText>
             
             <TouchableOpacity 
                activeOpacity={0.7}
                onPress={async () => {
                    await Clipboard.setStringAsync(job.id);
                    showAlert({ type: 'success', title: 'Copied', message: 'Job ID copied to clipboard' });
                }}
                style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginTop: 8,
                    backgroundColor: colors.surface,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                    borderWidth: 1,
                    borderColor: colors.border
                }}
             >
                <AppText size="xs" variant="bold" color={colors.textSecondary} style={{ fontFamily: 'monospace' }}>Job ID: {job.id.substring(0, 18)}...</AppText>
                <Copy size={14} color={colors.primary} weight="bold" style={{ marginLeft: 6 }} />
             </TouchableOpacity>

             <AppText color={colors.textSecondary} style={{ marginTop: Spacing.sm }}>{job.description}</AppText>
             
             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md }}>
                 <Info size={16} color={colors.textSecondary} />
                 <TouchableOpacity onPress={() => setPayoutModalVisible(true)}>
                    <AppText variant="medium" size="xs" color={colors.textSecondary} style={{ marginLeft: 4, textDecorationLine: 'underline' }}>View Price Breakdown</AppText>
                 </TouchableOpacity>
             </View>
          </View>

          {/* Involved Party */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
             <AppText variant="bold" size="sm" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>WORKER</AppText>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <View>
                     <AppText variant="bold" size="lg">{job.workerName}</AppText>
                     <AppText color={colors.textSecondary} size="sm">{job.workerPhone}</AppText>
                 </View>
                 {jobData.status === 'ACTIVE' && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Ripple 
                            onPress={handleChat}
                            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <ChatTeardropText size={20} color={colors.primary} />
                        </Ripple>
                        <Ripple 
                            onPress={handleCall}
                            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <Phone size={20} color={colors.primary} />
                        </Ripple>
                    </View>
                 )}
             </View>
          </View>

          {/* Timeline */}
          <View style={[styles.section, { borderBottomWidth: 0 }]}>
             <AppText variant="bold" size="sm" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>TIMELINE</AppText>
             <JobTimeline 
                steps={timeline} 
                accentColor={
                    jobData.status === 'COMPLETED' ? colors.success : 
                    (jobData.status === 'CANCELLED' || jobData.status === 'ESCALATED') ? colors.error : 
                    colors.primary
                } 
             />
          </View>
      </ScrollView>

      {/* Persistent Footer Actions */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
         {renderActionButtons()}
      </View>

      <PayoutBreakdownModal 
         visible={payoutModalVisible} 
         onClose={() => setPayoutModalVisible(false)} 
         workmanship={job.workmanship} 
         transport={job.transport} 
         materials={job.materials}
         serviceFee={job.serviceFee} 
         total={job.price} 
      />

      <SecurityPinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onSuccess={handlePinSuccess}
        useBiometrics={user?.useBiometrics}
      />

      <ReviewModal 
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleReviewSubmit}
        loading={isSubmittingReview}
        title={`Rate ${job.workerName}`}
      />

      <JobCancellationModal
        visible={cancellationModalVisible}
        onClose={() => setCancellationModalVisible(false)}
        onConfirm={onConfirmCancel}
        loading={isCancelling}
        isAgent={false}
        transportFare={job.transport}
      />

      <AppAlert 
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    margin: Spacing.lg,
    borderRadius: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
      padding: Spacing.lg,
      borderTopWidth: 1,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
  },
  actionContainer: {
     // 
  },
  codeBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
  }
});
