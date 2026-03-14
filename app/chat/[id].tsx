import { AppAlert } from '@/components/AppAlert';
import { AppInput } from '@/components/AppInput';
import { AppLoader } from '@/components/AppLoader';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ChatHeader } from '@/components/ChatHeader';
import { CheckoutModal } from '@/components/CheckoutModal';
import { ContractMessage } from '@/components/ContractMessage';
import { ImageAttachments } from '@/components/ImageAttachments';
import { SecurityPinModal } from '@/components/SecurityPinModal';
import { ServicePickerSheet } from '@/components/ServicePickerSheet';
import { ServiceRequestSheet } from '@/components/ServiceRequestSheet';
import { TypingIndicator } from '@/components/TypingIndicator';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Colors, Spacing } from '@/constants/theme';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresence, UserStatus } from '@/hooks/use-presence';
import { authService } from '@/services/auth.service';
import { chatService, Message } from '@/services/chat.service';
import { contractService } from '@/services/contract.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { getOptimizedImageUrl } from '@/utils/cloudinary';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, Check, Checks, Image as ImageIcon, Microphone, PaperPlaneRight, Pause, Play, ShieldCheck, User, WarningCircle } from 'phosphor-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name, avatarUrl } = params;
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { setTotalUnreadCount } = useChatStore();
  const flatListRef = useRef<FlatList>(null);
  const { joinRoom, leaveRoom, onMessageReceived, onMessagesRead, sendTyping, onTypingStatus, onConnect } = useChatSocket();
  const { presences, fetchBatchStatus } = usePresence();

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showServiceRequest, setShowServiceRequest] = useState(false);
  const [selectedBee, setSelectedBee] = useState<any>(null);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [contractToPay, setContractToPay] = useState<any>(null);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as any });
  const typingTimeoutRef = useRef<any>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const showAlert = (title: string, message: string, type: string = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const otherUser = conversation?.participant1Id === user?.id 
    ? conversation?.participant2 
    : conversation?.participant1;

  const otherUserId = conversation?.participant1Id === user?.id 
    ? conversation?.participant2Id 
    : conversation?.participant1Id;

  // Reliable scroll-to-bottom helper — double-fire pattern for iOS & Android
  const scrollToBottom = useCallback((animated = true) => {
    if (!flatListRef.current) return;
    const doScroll = () => flatListRef.current?.scrollToEnd({ animated });
    doScroll();
    // Second fire after layout settles — critical for iOS to reach absolute bottom
    setTimeout(doScroll, Platform.OS === 'ios' ? 100 : 50);
  }, []);

  // Scroll when messages change (new sent/received, image, audio, contract)
  useEffect(() => {
    if (messages.length > 0 && !isMoreLoading) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, isMoreLoading]);

  // Scroll when typing indicator appears
  useEffect(() => {
    if (isOtherTyping) {
      scrollToBottom();
    }
  }, [isOtherTyping, scrollToBottom]);

  useEffect(() => {
    fetchMessages();
    fetchConversation();
    
    // Join conversation room
    if (id) {
      joinRoom(id as string);
      chatService.markAsRead(id as string)
        .then(() => {
          // Re-fetch total unread count after marking this room as read
          chatService.getTotalUnreadCount().then(setTotalUnreadCount);
        })
        .catch(console.error);
    }
    
    // Listen for real-time messages
    const unsubscribeMessage = onMessageReceived((msg) => {
      // Only add if it's for this room and not already in state
      if (msg.conversationId === id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          
          let nextMessages = [...prev, msg];

          // Real-time Update: If this message is related to a contract (request/quote)
          // we update any previous request messages for the same contract
          if (msg.contractId && msg.contract) {
            nextMessages = nextMessages.map(m => {
              if (m.contractId === msg.contractId) {
                return { ...m, contract: msg.contract };
              }
              return m;
            });
          }

          return nextMessages;
        });
        
        // If message is from someone else, mark as read
        if (msg.senderId !== user?.id) {
          chatService.markAsRead(id as string)
            .then(() => {
              chatService.getTotalUnreadCount().then(setTotalUnreadCount);
            })
            .catch(console.error);
        }
      }
    });

    // Handle reconnection
    const unsubscribeConnect = onConnect(() => {
      if (id) {
        joinRoom(id as string);
        // Fetch latest messages to see if any were missed while offline
        fetchMessages(0); 
        chatService.markAsRead(id as string)
          .then(() => {
            chatService.getTotalUnreadCount().then(setTotalUnreadCount);
          })
          .catch(console.error);
      }
    });

    // Listen for read receipts
    const unsubscribeRead = onMessagesRead((payload) => {
      if (payload.roomId === id && payload.userId !== user?.id) {
        // Someone else read our messages
        setMessages((prev) => prev.map(m => 
          m.senderId === user?.id ? { ...m, isRead: true } : m
        ));
      }
    });

    // Listen for typing status
    const unsubscribeTyping = onTypingStatus((payload) => {
      if (payload.roomId === id && payload.userId !== user?.id) {
        setIsOtherTyping(payload.isTyping);
      }
    });

    return () => {
      if (id) leaveRoom(id as string);
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeRead();
      unsubscribeTyping();
    };
  }, [id]);

  const fetchConversation = async () => {
    if (!id) return;
    try {
      const data = await chatService.getConversation(id as string);
      setConversation(data);
      
      const otherUserObj = data.participant1Id === user?.id ? data.participant2 : data.participant1;
      if (otherUserObj?.id) {
        fetchBatchStatus([otherUserObj.id]);
      }
    } catch (error) {
      // Conversation fetch failed
    }
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    
    if (!id) return;

    // Send typing start
    if (text.length > 0) {
      sendTyping(id as string, true);
      
      // Reset timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(id as string, false);
      }, 3000); // Stop typing status after 3 seconds of inactivity
    } else {
      sendTyping(id as string, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const fetchMessages = async (offset = 0) => {
    if (!id) return;
    if (offset > 0) setIsMoreLoading(true);
    
    try {
      const data = await chatService.getMessages(id as string, 50, offset);
      const reversed = [...data].reverse();
      
      if (offset === 0) {
        setMessages((prev) => {
          // If we already have messages, merge them to avoid duplicates and preserve state
          if (prev.length > 0) {
            const newMessages = reversed.filter(nm => !prev.some(pm => pm.id === nm.id));
            if (newMessages.length === 0) return prev;
            return [...prev, ...newMessages].sort((a, b) => 
               new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
          return reversed;
        });
      } else {
        setMessages((prev) => [...reversed, ...prev]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (messages.length >= 50 && !isMoreLoading) {
      fetchMessages(messages.length);
    }
  };

  const handlePickImages = async () => {
    if (selectedImages.length >= 5) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Get text content
    const content = newMessage.trim();
    setNewMessage('');
    
    // Handle Text Message
    if (content) {
      const tempId = `temp-${Date.now()}`;
      const tempMessage: any = {
        id: tempId,
        content: content,
        type: 'text',
        createdAt: new Date().toISOString(),
        senderId: user?.id,
        sender: user,
        status: 'sending',
      };
      
      sendTyping(id as string, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      setMessages((prev) => [...prev, tempMessage]);
      sendWithRetry(tempId, content, 'text');
    }

    // Handle Images
    if (selectedImages.length > 0) {
      const imagesToUpload = [...selectedImages];
      setSelectedImages([]);

      // Create temp messages and fire uploads in parallel
      const uploadJobs = imagesToUpload.map((imgUri) => {
        const tempId = `temp-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setMessages((prev) => [...prev, {
          id: tempId,
          content: 'Sent an image',
          type: 'image',
          mediaUrl: imgUri, // Local URI for preview
          createdAt: new Date().toISOString(),
          senderId: user?.id,
          sender: user,
          status: 'sending',
        } as any]);
        return { tempId, imgUri };
      });

      // Compress and send all images in parallel
      await Promise.all(
        uploadJobs.map(async ({ tempId, imgUri }) => {
          try {
            const compressed = await ImageManipulator.manipulateAsync(
              imgUri,
              [{ resize: { width: 800 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            sendWithRetry(tempId, 'Sent an image', 'image', compressed.uri);
          } catch {
            sendWithRetry(tempId, 'Sent an image', 'image', imgUri);
          }
        })
      );
    }
  };

  const toggleAudioPlayback = async (message: Message) => {
    try {
      // If already playing this message, stop it
      if (playingAudioId === message.id && audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
        setPlayingAudioId(null);
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
      }

      if (!message.mediaUrl) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingAudioId(null);
            audioRef.current?.unloadAsync();
            audioRef.current = null;
          }
        }
      );

      audioRef.current = sound;
      setPlayingAudioId(message.id);
    } catch {
      setPlayingAudioId(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.unloadAsync();
    };
  }, []);

  const handleAudioSend = async (uri: string, duration: number) => {
    setIsAudioMode(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const tempId = `temp-audio-${Date.now()}`;
    const tempMessage: any = {
      id: tempId,
      content: 'Voice Message',
      type: 'audio',
      mediaUrl: uri, // local uri for preview
      createdAt: new Date().toISOString(),
      senderId: user?.id,
      sender: user,
      status: 'sending',
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    await sendWithRetry(tempId, 'Voice Message', 'audio', uri);
  };

  const handleFinalPayment = async (pin?: string) => {
    if (!contractToPay || !pin) {
      return;
    }
    setIsPinModalVisible(false);
    
    try {
      setIsActionLoading(true);
      const result = await contractService.pay(contractToPay.id, id as string, pin);
      
      // Refresh user profile to get updated balance
      const updatedProfile = await authService.getProfile();
      useAuthStore.getState().updateUser(updatedProfile);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // If payment was for a job, navigate to the job screen
      const jobId = result.contract?.job?.id || result.job?.id;
      if (jobId) {
        router.push(`/job/${jobId}`);
      }
      
      setContractToPay(null);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Payment Failed', error?.response?.data?.message || 'Something went wrong with the transaction. Please check your connection and try again.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const sendWithRetry = async (tempId: string, content: string, type: string, mediaUrl?: string) => {
    try {
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
      
      let finalMediaUrl = mediaUrl;
      
      // If it's a local URI (starting with file:// or similar), upload it first
      if (mediaUrl && (mediaUrl.startsWith('file://') || mediaUrl.startsWith('content://') || mediaUrl.startsWith('ph://'))) {
        const resourceType = type === 'audio' ? 'video' : 'image';
        const uploadResult = await uploadService.uploadMedia(mediaUrl, 'chat', resourceType);
        finalMediaUrl = uploadResult.url;
      }

      const savedMsg = await chatService.sendMessage(id as string, content, type, finalMediaUrl);
      setMessages((prev) => {
        // If the socket already added this message, just remove the temp one
        if (prev.some(m => m.id === savedMsg.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        // Otherwise replace the temp one with the saved one
        return prev.map(m => m.id === tempId ? savedMsg : m);
      });
    } catch (error) {
      console.error(`Failed to send ${type}:`, error);
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const handleRetry = (item: any) => {
    sendWithRetry(item.id, item.content, item.type, item.mediaUrl);
  };

  const renderSkeleton = () => (
    <View style={{ flex: 1, padding: Spacing.md }}>
      <View style={{ marginBottom: Spacing.lg, alignSelf: 'flex-start', width: '70%' }}>
        <AppSkeleton width="100%" height={60} borderRadius={12} />
      </View>
      <View style={{ marginBottom: Spacing.lg, alignSelf: 'flex-end', width: '70%' }}>
        <AppSkeleton width="100%" height={40} borderRadius={12} />
      </View>
      <View style={{ marginBottom: Spacing.lg, alignSelf: 'flex-start', width: '60%' }}>
        <AppSkeleton width="100%" height={50} borderRadius={12} />
      </View>
      <View style={{ marginBottom: Spacing.lg, alignSelf: 'flex-end', width: '80%' }}>
        <AppSkeleton width="100%" height={70} borderRadius={12} />
      </View>
      <View style={{ marginBottom: Spacing.lg, alignSelf: 'flex-start', width: '50%' }}>
        <AppSkeleton width="100%" height={40} borderRadius={12} />
      </View>
    </View>
  );

  const presence = otherUser?.id ? presences[otherUser.id] : null;
  const isOnline = presence?.status === UserStatus.ONLINE;
  
  const getStatusText = () => {
    if (isOtherTyping) return 'Typing...';
    if (isOnline) return 'Online';
    if (!presence?.lastSeenAt) return 'Offline';
    
    const lastSeenDate = new Date(presence.lastSeenAt);
    const now = new Date();
    const diffInMins = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  const displayName = otherUser 
    ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'User'
    : (name as string);
  const displayAvatar = otherUser?.profileImage || (avatarUrl as string);

  return (
    <AppScreen disablePadding>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatHeader
        name={displayName}
        avatarUrl={displayAvatar}
        isOnline={isOnline}
        statusText={getStatusText()}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ripple 
                onPress={() => {
                  if (!user?.isNinVerified) {
                    showAlert('Verification Required', 'Please complete your identity verification to hire service providers.', 'error');
                    return;
                  }
                  otherUserId && setShowServicePicker(true);
                }} 
                style={[styles.hireButton, { backgroundColor: (user?.isNinVerified ? colors.primary : colors.textSecondary) + '15' }]}
                rippleColor={colors.primary}
                rippleContainerBorderRadius={20}
              >
                 <Briefcase size={20} color={user?.isNinVerified ? colors.primary : colors.textSecondary} weight="bold" />
                 <AppText variant="bold" color={user?.isNinVerified ? colors.primary : colors.textSecondary} size="sm" style={{ marginLeft: 6 }}>Hire</AppText>
              </Ripple>
              <Ripple 
                onPress={() => otherUser?.id && router.push(`/agent-profile/${otherUser.id}`)} 
                style={{ padding: 8 }}
                rippleCentered={true}
                rippleContainerBorderRadius={20}
              >
                 <User size={24} color={colors.primary} />
              </Ripple>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            {!user?.isNinVerified && user?.ninStatus !== 'PENDING' && (
              <View style={styles.verificationBanner}>
                <ShieldCheck size={20} color="#92400E" weight="fill" />
                <AppText style={styles.verificationText}>
                  Your account is not verified. Please verify your NIN to hire agents and initiate contracts.
                </AppText>
                <Ripple 
                  onPress={() => router.push('/verify-nin')}
                  style={{ padding: 4 }}
                >
                  <AppText size="xs" color="#92400E" variant="bold" style={{ textDecorationLine: 'underline' }}>Verify Now</AppText>
                </Ripple>
              </View>
            )}
            {!user?.isNinVerified && user?.ninStatus === 'PENDING' && (
              <View style={[styles.verificationBanner, { backgroundColor: '#EFF6FF', borderBottomColor: '#BFDBFE' }]}>
                <ShieldCheck size={20} color="#2563EB" weight="fill" />
                <AppText style={[styles.verificationText, { color: '#1E40AF' }]}>
                  Your NIN verification is under review. You'll be able to hire agents once approved.
                </AppText>
              </View>
            )}
            {otherUser?.role === 'AGENT' && !otherUser?.isAvailable && (
              <View style={[styles.availabilityBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <WarningCircle size={16} color={colors.textSecondary} weight="bold" />
                <AppText size="xs" color={colors.textSecondary}>{otherUser?.firstName} is not available to work.</AppText>
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { flexGrow: 1, justifyContent: 'flex-end' }]}
            onContentSizeChange={() => {
              if (messages.length > 0 && !isMoreLoading) {
                scrollToBottom();
              }
            }}
            onLayout={() => {
              // Ensure initial render scrolls to absolute bottom (no animation)
              if (messages.length > 0) {
                scrollToBottom(false);
              }
            }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item, index }) => {
              const date = new Date(item.createdAt).toLocaleDateString();
              const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString() : null;
              const showDateChip = index === 0 || date !== prevDate;
              const isSender = item.senderId === user?.id;
              const time = new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

              const isContract = item.type === 'service_request' || item.type === 'service_quote';

              return (
                <View>
                  {showDateChip && (
                    <View style={styles.dateChipContainer}>
                      <View style={[styles.dateChip, { backgroundColor: colors.surface }]}>
                        <AppText size="xs" color={colors.textSecondary}>{date === new Date().toLocaleDateString() ? 'Today' : date}</AppText>
                      </View>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageContainer,
                      isSender ? styles.senderMessage : styles.receiverMessage,
                      { backgroundColor: isSender ? colors.primary : colors.surface },
                      isContract && { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, maxWidth: '100%', alignSelf: 'stretch' }
                    ]}
                  >
                    {item.type === 'image' && item.mediaUrl ? (
                      <View style={{ marginBottom: 4 }}>
                        <Image
                          source={{ uri: getOptimizedImageUrl(item.mediaUrl, 440, 360) }}
                          style={{ width: 220, height: 180, borderRadius: 12 }}
                          contentFit="cover"
                        />
                      </View>
                    ) : item.type === 'audio' ? (
                      <Ripple 
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                        onPress={() => toggleAudioPlayback(item)}
                        rippleColor={isSender ? '#fff' : colors.primary}
                        rippleContainerBorderRadius={8}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                          {playingAudioId === item.id ? (
                            <Pause size={16} weight="fill" color={isSender ? '#fff' : colors.primary} />
                          ) : (
                            <Play size={16} weight="fill" color={isSender ? '#fff' : colors.primary} />
                          )}
                        </View>
                        <AppText size="sm" color={isSender ? '#fff' : colors.text}>
                          {playingAudioId === item.id ? 'Playing...' : 'Voice Message'}
                        </AppText>
                      </Ripple>
                    ) : item.type === 'service_request' || item.type === 'service_quote' ? (
                      <ContractMessage 
                        message={item} 
                        isSender={isSender} 
                        onPay={(contract) => {
                          setContractToPay(contract);
                          setIsCheckoutVisible(true);
                        }}
                      />
                    ) : (
                      <AppText 
                         size="sm" 
                         variant="medium"
                         style={{ lineHeight: 20 }}
                         color={isSender ? '#fff' : colors.text}
                      >
                        {item.content}
                      </AppText>
                    )}
                    <View style={[styles.metaContainer, { justifyContent: isSender ? 'flex-end' : 'flex-start' }]}>
                      <AppText
                        size="xs"
                        color={(isSender && !isContract) ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
                      >
                        {time}
                      </AppText>
                      {isSender && (
                        <View style={{ marginLeft: 4 }}>
                          {item.status === 'error' ? (
                            <Ripple 
                              onPress={() => handleRetry(item)}
                              rippleCentered={true}
                              rippleContainerBorderRadius={10}
                            >
                               <WarningCircle size={14} color="#EF4444" weight="fill" />
                            </Ripple>
                          ) : item.isRead ? (
                            <Checks size={14} color="#4ADE80" weight="bold" />
                          ) : item.status === 'sending' ? (
                            <Check size={14} color={isContract ? colors.textSecondary + '60' : "rgba(255,255,255,0.4)"} weight="regular" />
                          ) : (
                            <Check size={14} color={isContract ? colors.textSecondary : "rgba(255,255,255,0.7)"} weight="bold" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={() => isOtherTyping ? <TypingIndicator style={{ marginLeft: 16 }} /> : null}
          />
          </>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {!isAudioMode && <ImageAttachments images={selectedImages} onRemove={handleRemoveImage} />}
          {isAudioMode ? (
            <VoiceRecorder 
              onSend={handleAudioSend} 
              onCancel={() => setIsAudioMode(false)} 
            />
          ) : (
            <View style={styles.inputRow}>
              <AppInput
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={handleInputChange}
                containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              {newMessage.trim().length > 0 || selectedImages.length > 0 ? (
                <Ripple 
                  onPress={handleSend} 
                  style={{ marginLeft: 8, padding: 8, borderRadius: 20 }}
                  rippleCentered={true}
                >
                  <PaperPlaneRight size={24} color={colors.primary} weight="fill" />
                </Ripple>
              ) : (
                <View style={{ flexDirection: 'row' }}>
                  <Ripple 
                    onPress={handlePickImages} 
                    style={{ marginLeft: 8, padding: 8, borderRadius: 20 }}
                    rippleCentered={true}
                  >
                    <ImageIcon size={24} color={colors.primary} />
                  </Ripple>
                  <Ripple 
                    onPress={() => setIsAudioMode(true)} 
                    style={{ padding: 8, borderRadius: 20 }}
                    rippleCentered={true}
                  >
                    <Microphone size={24} color={colors.primary} />
                  </Ripple>
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      <ServicePickerSheet
        visible={showServicePicker}
        onClose={() => setShowServicePicker(false)}
        agentId={otherUserId!}
        onSelect={(bee) => {
          setSelectedBee(bee);
          setShowServicePicker(false);
          setShowServiceRequest(true);
        }}
        // In a real app, we'd pass the actual suggested bee ID from context
        suggestedBeeId={params.beeId as string}
      />

      <ServiceRequestSheet
        visible={showServiceRequest}
        onClose={() => setShowServiceRequest(false)}
        bee={selectedBee}
        agentId={otherUserId!}
        roomId={id as string}
        onSuccess={(contract) => {
           // Success message already sent by backend
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      <CheckoutModal 
        visible={isCheckoutVisible}
        onClose={() => setIsCheckoutVisible(false)}
        contract={contractToPay}
        onConfirm={() => {
          setIsCheckoutVisible(false);
          setTimeout(() => {
            setIsPinModalVisible(true);
          }, 300);
        }}
      />

      <SecurityPinModal 
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onSuccess={handleFinalPayment}
        title="Enter Transaction PIN to Pay"
        useBiometrics={user?.useBiometrics}
      />

      <AppLoader visible={isActionLoading} message="Processing Payment..." />

      <AppAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  verificationBanner: {
    backgroundColor: '#FFFBEB',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verificationText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  messageContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '78%',
    marginBottom: 8,
  },
  senderMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receiverMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  dateChipContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  hireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
