import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatCircle from '@/assets/icons/chat-circle.svg';
import Checks from '@/assets/icons/checks.svg';
import Gavel from '@/assets/icons/gavel.svg';
import LightningAmber from '@/assets/icons/lightning-amber.svg';
import StarAmber from '@/assets/icons/star-amber.svg';
import WarningCircle from '@/assets/icons/warning-circle.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useNotifications } from '@/lib/api/queries';
import {
  formatRelativeTime,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/lib/api/notifications';

const COLORS = {
  canvas: '#f9f9fb',
  brandSubtle: '#f3eeff',
  brandStrong: '#4621c0',
  brand: '#6c3bff',
  dot: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  purple100: '#e4d6ff',
  infoBg: '#eff6ff',
  warningBg: '#fffbea',
  errorBg: '#fff1f1',
  error: '#dc2626',
};

/** Pick an icon treatment from the notification's type/title keywords. */
function iconFor(n: AppNotification): { icon: React.ReactNode; bg: string } {
  const s = `${n.type ?? ''} ${n.title ?? ''}`.toLowerCase();
  if (/rat|review|star/.test(s)) return { icon: <StarAmber width={22} height={22} />, bg: COLORS.warningBg };
  if (/cancel|expir|refund|fail|warn|reject/.test(s)) {
    return { icon: <WarningCircle width={22} height={22} />, bg: COLORS.errorBg };
  }
  if (/payout|escrow|payment|wallet|fund|boost/.test(s)) {
    return { icon: <LightningAmber width={22} height={22} />, bg: COLORS.warningBg };
  }
  if (/message|chat/.test(s)) return { icon: <ChatCircle width={22} height={22} />, bg: COLORS.infoBg };
  return { icon: <Gavel width={22} height={22} />, bg: COLORS.purple100 };
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { icon, bg } = iconFor(item);
  const unread = !item.read;
  return (
    <Pressable style={[styles.row, unread && styles.rowUnread]} onPress={onPress}>
      <View style={[styles.iconTile, { backgroundColor: bg }]}>{icon}</View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || 'Notification'}
          </Text>
          <View style={styles.timeInfo}>
            <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
            {unread ? <View style={styles.dot} /> : null}
          </View>
        </View>
        {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();

  const notifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const onPressRow = (n: AppNotification) => {
    if (!n.read) readOneMutation.mutate(n._id);
    const taskId = n.metadata?.taskId;
    if (taskId) router.push({ pathname: '/task-details', params: { id: taskId } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Notification"
        right={
          unreadCount > 0 ? (
            <Pressable
              style={styles.readAll}
              hitSlop={8}
              onPress={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}>
              <Checks width={18} height={8} />
              <Text style={styles.readAllText}>
                {readAllMutation.isPending ? 'Reading…' : 'Read all'}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : isError ? (
        <View style={styles.state}>
          <Text style={styles.errorText}>Couldn’t load notifications.</Text>
          <Pressable hitSlop={8} onPress={() => refetch()} disabled={isRefetching}>
            <Text style={styles.retry}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.emptyText}>You’re all caught up. No notifications yet.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}>
          {notifications.map((item) => (
            <NotificationRow key={item._id} item={item} onPress={() => onPressRow(item)} />
          ))}
        </ScrollView>
      )}
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
