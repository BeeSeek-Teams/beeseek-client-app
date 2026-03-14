import { AppInput } from '@/components/AppInput';
import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { ChatListItem } from '@/components/ChatListItem';
import { Colors, Spacing } from '@/constants/theme';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresence } from '@/hooks/use-presence';
import { chatService, Conversation } from '@/services/chat.service';
import { useAuthStore } from '@/store/useAuthStore';
import { usePresenceStore, UserStatus } from '@/store/usePresenceStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

export default function ChatScreen() {
  const router = useRouter();
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { onMessageReceived, onConnect } = useChatSocket();
  const { fetchBatchStatus } = usePresence();
  const presences = usePresenceStore((state) => state.presences);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await chatService.getRooms();
      setChats(data);
      
      // Batch fetch presence for all other participants
      const otherUserIds = data.map(chat => 
        chat.participant1Id === user?.id ? chat.participant2Id : chat.participant1Id
      ).filter(Boolean) as string[];
      
      if (otherUserIds.length > 0) {
        fetchBatchStatus(otherUserIds);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onMessageReceived((msg) => {
      // Check if conversation exists in our list
      setChats((prev) => {
        const chatExists = prev.some((c) => c.id === msg.conversationId);
        
        if (chatExists) {
          // Update and move to top
          const updated = prev.map((chat) => {
            if (chat.id === msg.conversationId) {
              const myRole = chat.participant1Id === user?.id ? 'P1' : 'P2';
              const unreadField = myRole === 'P1' ? 'unreadCountP1' : 'unreadCountP2';

              return {
                ...chat,
                lastMessageText: msg.content,
                lastMessageAt: msg.createdAt,
                // Increment unread count locally if we are not the sender
                [unreadField]: msg.senderId !== user?.id ? (chat[unreadField] || 0) + 1 : chat[unreadField],
              };
            }
            return chat;
          });
          
          return updated.sort((a, b) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
        } else {
          // New chat started: trigger fetch outside this setter
          setTimeout(() => fetchChats(), 0);
          return prev;
        }
      });
    });

    const unsubscribeConnect = onConnect(() => {
       fetchChats();
    });

    return () => {
      unsubscribe();
      unsubscribeConnect();
    };
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.participant1Id === user?.id ? chat.participant2 : chat.participant1;
    if (!otherUser) return false;
    const name = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppScreen disablePadding>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header Section */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <AppText variant="bold" size="2xl">
              Messages
            </AppText>
            <AppText color={colors.textSecondary} size="sm">
              Connect with your assigned agents
            </AppText>

            <View style={styles.searchContainer}>
              <AppInput
                placeholder="Search agents..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<MagnifyingGlass size={20} color={colors.textSecondary} />}
                containerStyle={styles.searchInput}
              />
            </View>
          </View>

          {/* Chat List */}
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            renderItem={({ item }) => {
              const otherUser = item.participant1Id === user?.id ? item.participant2 : item.participant1;
              if (!otherUser) return null;
              
              const name = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'User';
              const unreadCount = item.participant1Id === user?.id ? item.unreadCountP1 : item.unreadCountP2;
              const presence = presences[otherUser.id];
              
              return (
                <ChatListItem
                  name={name}
                  lastMessage={item.lastMessageText || 'No messages yet'}
                  time={item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                  unreadCount={unreadCount}
                  isOnline={presence?.status === UserStatus.ONLINE}
                  avatarUrl={otherUser.profileImage}
                  onPress={() => router.push({ 
                    pathname: '/chat/[id]', 
                    params: { 
                      id: item.id, 
                      name: name, 
                      partnerId: otherUser.id,
                      avatarUrl: otherUser.profileImage || '' 
                    } 
                  })}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AppText color={colors.textSecondary}>
                  {isLoading ? 'Loading chats...' : 'No agents found'}
                </AppText>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchContainer: {
    marginTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0, // Override default margin from AppInput
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 48 + Spacing.xl, // Space for bottom tabs
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['2xl'],
  },
});
