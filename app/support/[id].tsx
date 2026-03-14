import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppSkeleton } from '@/components/AppSkeleton';
import { AppText } from '@/components/AppText';
import { ChatHeader } from '@/components/ChatHeader';
import { ImageAttachments } from '@/components/ImageAttachments';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupportSocket } from '@/hooks/use-support-socket';
import { SupportMessage, supportService, SupportTicket } from '@/services/support.service';
import { uploadService } from '@/services/upload.service';
import { getOptimizedImageUrl } from '@/utils/cloudinary';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Checks, Image as ImageIcon, Microphone, PaperPlaneRight, Pause, Play, User } from 'phosphor-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

export default function SupportChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);
  const { joinTicket, leaveTicket, onMessageReceived, onConnect, onTicketStatusChanged } = useSupportSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const scrollToBottom = useCallback((animated = true) => {
    if (!flatListRef.current) return;
    const doScroll = () => flatListRef.current?.scrollToEnd({ animated });
    doScroll();
    setTimeout(doScroll, Platform.OS === 'ios' ? 100 : 50);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const fetchTicketDetails = async (isSync = false) => {
    try {
      if (id && id !== 'new') {
        const data = await supportService.getTicketDetails(id as string);
        setTicket(data);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch ticket messages:', error);
      if (!isSync) Alert.alert('Error', 'Could not load chat messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();

    if (id && id !== 'new') {
      joinTicket(id as string);
    }

    const unsubscribeMessage = onMessageReceived((msg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.isFromSupport) {
        fetchTicketDetails(true);
      }
    });

    const unsubscribeStatusChange = onTicketStatusChanged((data) => {
      setTicket((prev) => {
        if (!prev) return prev;
        return { ...prev, status: data.status };
      });
    });

    const unsubscribeConnect = onConnect(() => {
      if (id && id !== 'new') {
        joinTicket(id as string);
        fetchTicketDetails(true);
      }
    });

    return () => {
      if (id && id !== 'new') leaveTicket(id as string);
      unsubscribeMessage();
      unsubscribeStatusChange();
      unsubscribeConnect();
    };
  }, [id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.unloadAsync();
    };
  }, []);

  const toggleAudioPlayback = async (message: SupportMessage) => {
    try {
      if (playingAudioId === message.id && audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
        setPlayingAudioId(null);
        return;
      }
      if (audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
      }
      if (!message.mediaUrl) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
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

  const sendWithRetry = async (tempId: string, text: string, type: string, mediaUrl?: string) => {
    try {
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } as any : m));
      let finalMediaUrl = mediaUrl;
      if (mediaUrl && (mediaUrl.startsWith('file://') || mediaUrl.startsWith('content://') || mediaUrl.startsWith('ph://'))) {
        const resourceType = type === 'audio' ? 'video' : 'image';
        const uploadResult = await uploadService.uploadMedia(mediaUrl, 'chat', resourceType);
        finalMediaUrl = uploadResult.url;
      }
      const savedMsg = await supportService.sendMessage(id as string, text, type, finalMediaUrl);
      setMessages((prev) => {
        if (prev.some(m => m.id === savedMsg.id)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? savedMsg : m);
      });
    } catch (error) {
      console.error(`Failed to send ${type}:`, error);
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'error' } as any : m));
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;
    if (!id || id === 'new') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const content = newMessage.trim();
    setNewMessage('');

    if (content) {
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: tempId, text: content, type: 'text', isFromSupport: false,
        createdAt: new Date().toISOString(), status: 'sending',
      } as any]);
      sendWithRetry(tempId, content, 'text');
    }

    if (selectedImages.length > 0) {
      const imagesToUpload = [...selectedImages];
      setSelectedImages([]);
      await Promise.all(
        imagesToUpload.map(async (imgUri) => {
          const tempId = `temp-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          setMessages((prev) => [...prev, {
            id: tempId, text: 'Sent an image', type: 'image', mediaUrl: imgUri,
            isFromSupport: false, createdAt: new Date().toISOString(), status: 'sending',
          } as any]);
          try {
            const compressed = await ImageManipulator.manipulateAsync(
              imgUri, [{ resize: { width: 800 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            await sendWithRetry(tempId, 'Sent an image', 'image', compressed.uri);
          } catch {
            await sendWithRetry(tempId, 'Sent an image', 'image', imgUri);
          }
        })
      );
    }
  };

  const handleAudioSend = async (uri: string, duration: number) => {
    setIsAudioMode(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tempId = `temp-audio-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId, text: 'Voice Message', type: 'audio', mediaUrl: uri,
      isFromSupport: false, createdAt: new Date().toISOString(), status: 'sending',
    } as any]);
    await sendWithRetry(tempId, 'Voice Message', 'audio', uri);
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

  return (
    <AppScreen disablePadding>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatHeader
        name={ticket?.subject || "BeeSeek Support"}
        avatarUrl="https://ui-avatars.com/api/?name=Bee+Seek&background=FCD34D&color=fff"
        isOnline={true}
        statusText={id === 'new' ? "New Ticket" : (ticket?.status ? ticket.status.replace(/_/g, ' ') : 'Loading...')}
        rightAction={
          <TouchableOpacity onPress={() => {}} style={{ padding: 8 }}>
             <User size={24} color={colors.primary} />
          </TouchableOpacity>
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
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { flexGrow: 1, justifyContent: 'flex-end' }]}
            onContentSizeChange={() => {
              if (messages.length > 0) scrollToBottom();
            }}
            onLayout={() => {
              if (messages.length > 0) scrollToBottom(false);
            }}
            ListHeaderComponent={() => (
              ticket?.evidence && ticket.evidence.length > 0 ? (
                <View style={styles.evidenceHeader}>
                  <AppText variant="bold" size="sm" style={{ marginBottom: 8 }}>Attached Evidence</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ticket.evidence.map((url, idx) => (
                      <TouchableOpacity key={idx}>
                        <Image source={{ uri: url }} style={styles.evidenceImage} contentFit="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null
            )}
            renderItem={({ item, index }) => {
              const messageDate = new Date(item.createdAt);
              const dateStr = messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isSender = !item.isFromSupport;
              const msgType = item.type || 'text';

              const showDateChip = index === 0 || 
                new Date(messages[index - 1].createdAt).toLocaleDateString() !== messageDate.toLocaleDateString();

              return (
                <View>
                  {showDateChip && (
                    <View style={styles.dateChipContainer}>
                      <View style={[styles.dateChip, { backgroundColor: colors.surface }]}>
                        <AppText size="xs" color={colors.textSecondary}>{dateStr}</AppText>
                      </View>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageContainer,
                      isSender ? styles.senderMessage : styles.receiverMessage,
                      { backgroundColor: isSender ? colors.primary : colors.surface },
                    ]}
                  >
                    {msgType === 'image' && item.mediaUrl ? (
                      <View style={{ marginBottom: 4 }}>
                        <Image
                          source={{ uri: getOptimizedImageUrl(item.mediaUrl, 440, 360) }}
                          style={{ width: 220, height: 180, borderRadius: 12 }}
                          contentFit="cover"
                        />
                      </View>
                    ) : msgType === 'audio' ? (
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
                    ) : (
                      <AppText 
                        size="sm" 
                        variant="medium"
                        style={{ lineHeight: 20 }}
                        color={isSender ? '#fff' : colors.text}
                      >
                        {item.text}
                      </AppText>
                    )}
                    <View style={styles.metaContainer}>
                      <AppText
                        size="xs"
                        color={isSender ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
                      >
                        {timeStr}
                      </AppText>
                      {isSender && (
                        <Checks size={14} color="rgba(255,255,255,0.9)" weight="bold" />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {ticket?.status === 'RESOLVED' ? (
            <View style={{ paddingVertical: Spacing.md, alignItems: 'center' }}>
              <AppText size="sm" color={colors.textSecondary} style={{ textAlign: 'center' }}>
                This ticket has been resolved. You can no longer send messages.
              </AppText>
            </View>
          ) : (
            <>
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
                    onChangeText={setNewMessage}
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  evidenceHeader: {
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
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
});
