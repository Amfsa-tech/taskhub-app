import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatCircle from '@/assets/icons/chat-circle.svg';
import Checks from '@/assets/icons/checks.svg';
import Gavel from '@/assets/icons/gavel.svg';
import LightningAmber from '@/assets/icons/lightning-amber.svg';
import StarAmber from '@/assets/icons/star-amber.svg';
import WarningCircle from '@/assets/icons/warning-circle.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  brandSubtle: '#f3eeff',
  brandStrong: '#4621c0',
  dot: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  purple100: '#e4d6ff',
  infoBg: '#eff6ff',
  warningBg: '#fffbea',
  errorBg: '#fff1f1',
};

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  iconBg: string;
  icon: React.ReactNode;
  unread: boolean;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: 'bid-received',
    title: 'New Bid Received',
    message: 'Tunde A. Placed a ₦1,500 bid on your Printing Task',
    time: '2m ago',
    iconBg: COLORS.purple100,
    icon: <Gavel width={22} height={22} />,
    unread: true,
  },
  {
    id: 'new-message',
    title: 'New Message',
    message: 'Ngozi: “ I am on my way to your location now”',
    time: '15m ago',
    iconBg: COLORS.infoBg,
    icon: <ChatCircle width={22} height={22} />,
    unread: true,
  },
  {
    id: 'new-review',
    title: 'New Review',
    message: 'Chidi.O. left you a 5 star review on Grocery Errand',
    time: '1h ago',
    iconBg: COLORS.warningBg,
    icon: <StarAmber width={22} height={22} />,
    unread: true,
  },
  {
    id: 'task-boosted',
    title: 'Task boosted',
    message: 'Your task “Laundry Help” is now boosted and Visible to more Taskers',
    time: '1h ago',
    iconBg: COLORS.warningBg,
    icon: <LightningAmber width={22} height={22} />,
    unread: false,
  },
  {
    id: 'task-expiring',
    title: 'Task Expiring Soon',
    message: 'Your Task “ Airport pick up” Expires in 2 hours',
    time: '1h ago',
    iconBg: COLORS.errorBg,
    icon: <WarningCircle width={22} height={22} />,
    unread: false,
  },
  {
    id: 'bid-accepted',
    title: 'Bid Accepted',
    message: 'Your Bid on “Document scanning”  was Accepted',
    time: '1h ago',
    iconBg: COLORS.purple100,
    icon: <Gavel width={22} height={22} />,
    unread: false,
  },
];

function NotificationRow({ item, onPress }: { item: Notification; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        item.unread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}>
      <View style={[styles.iconTile, { backgroundColor: item.iconBg }]}>{item.icon}</View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.timeInfo}>
            <Text style={styles.time}>{item.time}</Text>
            {item.unread ? <View style={styles.dot} /> : null}
          </View>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState(NOTIFICATIONS);

  const readAll = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const handlePress = (item: Notification) => {
    // Mark as read
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    // Navigate to details
    router.push({
      pathname: '/notification-details',
      params: {
        title: item.title,
        message: item.message,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Notification"
        right={
          <Pressable style={styles.readAll} hitSlop={8} onPress={readAll}>
            <Checks width={18} height={8} />
            <Text style={styles.readAllText}>Read all</Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            onPress={() => handlePress(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  readAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readAllText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brandStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowUnread: {
    backgroundColor: COLORS.brandSubtle,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.dot,
  },
  message: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
});
