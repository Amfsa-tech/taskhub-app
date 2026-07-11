import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Bell from '@/assets/icons/bell.svg';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { otherParty, unreadFor } from '@/lib/api/chat';
import { formatRelativeTime } from '@/lib/api/notifications';
import { useConversations } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  avatarBg: '#f3eeff',
  badgeBg: '#eff6ff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  error: '#dc2626',
};

type ChatRowView = {
  id: string;
  name: string;
  task: string;
  message: string;
  time: string;
  unread: number;
  avatar: string;
};

function ChatRow({ chat, onPress }: { chat: ChatRowView; onPress: () => void }) {
  return (
    <Pressable style={styles.chat} onPress={onPress}>
      <View style={styles.avatarWrap}>
        {chat.avatar ? (
          <Image source={{ uri: chat.avatar }} style={styles.avatar} contentFit="cover" />
        ) : null}
      </View>

      <View style={styles.messageContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name}
          </Text>
          {chat.task ? (
            <Text style={styles.task} numberOfLines={1}>
              {chat.task}
            </Text>
          ) : null}
          <Text style={styles.preview} numberOfLines={1}>
            {chat.message}
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{chat.time}</Text>
          {chat.unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{chat.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountType } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useConversations();

  const rows: ChatRowView[] = (data?.conversations ?? []).map((c) => {
    const { name, avatar } = otherParty(c, accountType);
    return {
      id: c._id,
      name,
      task: c.task?.title ?? '',
      message: c.lastMessage ?? 'No messages yet',
      time: formatRelativeTime(c.lastMessageAt ?? c.updatedAt),
      unread: unreadFor(c, accountType),
      avatar,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Messages</Text>
          <Pressable style={styles.bell} hitSlop={8} onPress={() => router.push('/notifications')}>
            <Bell width={20} height={20} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.placeholder} />
          <Text style={styles.searchText}>Search Conversations...</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : isError ? (
        <View style={styles.state}>
          <Text style={styles.errorText}>Couldn’t load conversations.</Text>
          <Pressable hitSlop={8} onPress={() => refetch()} disabled={isRefetching}>
            <Text style={styles.retry}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.emptyText}>
            No conversations yet. Chat opens when you invite or hire a tasker.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}>
          {rows.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              onPress={() =>
                router.push({ pathname: '/chat', params: { id: chat.id, name: chat.name } })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  topBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    backgroundColor: COLORS.sunken,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.placeholder,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  chat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 999,
    backgroundColor: COLORS.avatarBg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  task: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.brand,
  },
  preview: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  timeContainer: {
    width: 46,
    alignItems: 'flex-end',
    gap: 25,
  },
  time: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.brand,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
});
