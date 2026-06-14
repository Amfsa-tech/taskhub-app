import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Bell from '@/assets/icons/bell.svg';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';

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
};

type Chat = {
  name: string;
  task: string;
  message: string;
  time: string;
  unread?: number;
  avatar: ImageSourcePropType;
};

export const CHATS: Chat[] = [
  {
    name: 'Chioma. A',
    task: 'Print My assignment',
    message: "I'm heading to Zik Hall now!",
    time: '2m ago',
    unread: 2,
    avatar: require('@/assets/images/chats/chat-1.png'),
  },
  {
    name: 'Tunde.O',
    task: 'Fix my laptop screen',
    message: 'What model is your Laptop?',
    time: '2m ago',
    avatar: require('@/assets/images/chats/chat-2.jpg'),
  },
  {
    name: 'Dapo. A',
    task: 'Fix my laptop screen',
    message: 'Have you tried restarting it?',
    time: '1m ago',
    avatar: require('@/assets/images/chats/chat-3.jpg'),
  },
];

// Total unread across all conversations — drives the bottom-nav Messages badge.
export const MESSAGES_UNREAD_COUNT = CHATS.reduce((sum, c) => sum + (c.unread ?? 0), 0);

function ChatRow({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  return (
    <Pressable style={styles.chat} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Image source={chat.avatar} style={styles.avatar} contentFit="cover" />
      </View>

      <View style={styles.messageContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={styles.task} numberOfLines={1}>
            {chat.task}
          </Text>
          <Text style={styles.preview} numberOfLines={1}>
            {chat.message}
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{chat.time}</Text>
          {chat.unread ? (
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Messages</Text>
          <Pressable
            style={styles.bell}
            hitSlop={8}
            onPress={() => router.push('/notifications')}>
            <Bell width={20} height={20} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.placeholder} />
          <Text style={styles.searchText}>Search Conversations...</Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {CHATS.map((chat, i) => (
          <ChatRow
            key={`${chat.name}-${i}`}
            chat={chat}
            onPress={() => router.push({ pathname: '/chat', params: { name: chat.name } })}
          />
        ))}
      </ScrollView>
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
    width: 24,
    height: 24,
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
});
