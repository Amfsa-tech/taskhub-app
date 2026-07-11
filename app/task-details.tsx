import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowLeft from '@/assets/icons/arrow-left.svg';
import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import RatingDot from '@/assets/icons/rating-dot.svg';
import Shield from '@/assets/icons/shield.svg';
import Star from '@/assets/icons/star.svg';
import { InviteToBidModal } from '@/components/taskhub/invite-to-bid-modal';
import { ReadyToHireModal } from '@/components/taskhub/ready-to-hire-modal';
import { TaskActionsModal } from '@/components/taskhub/task-actions-modal';
import { ApiError } from '@/lib/api/client';
import { acceptBid, inviteTasker, sendHireRequest } from '@/lib/api/bids';
import { createOrGetConversation } from '@/lib/api/chat';
import { useTask, useTaskMatches } from '@/lib/api/queries';
import {
  changeTaskStatus,
  formatNaira,
  formatShortDate,
  locationLabel,
  statusLabel,
  type TaskBid,
  type TaskerMatch,
  type TaskStatus,
} from '@/lib/api/tasks';

type HireContext =
  | { kind: 'accept'; bidId: string; name: string; avatar: string; price: string }
  | { kind: 'hire'; taskerId: string; name: string; avatar: string; price: string; amount: number };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandStrong: '#4621c0',
  pillBg: '#f3eeff',
  successBg: '#edfaf3',
  successText: '#0d6639',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  open: { bg: '#edfaf3', text: '#0d6639' },
  assigned: { bg: '#eff6ff', text: '#1d4ed8' },
  'in-progress': { bg: '#eff6ff', text: '#1d4ed8' },
  completed: { bg: '#edfaf3', text: '#0d6639' },
  cancelled: { bg: '#fff1f1', text: '#b01515' },
};

type Match = {
  id: string;
  name: string;
  rating: string;
  jobs: string;
  distance: string;
  tags: string[];
  avatar: string;
};

type BidView = {
  id: string;
  name: string;
  price: string;
  rating: string;
  message: string;
  avatar: string;
};

/** `Chioma`, `Amara` -> `Chioma A.` */
function shortName(first?: string, last?: string): string {
  const f = first?.trim() ?? '';
  const li = last?.trim()?.[0];
  return [f, li ? `${li}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

function matchToView(m: TaskerMatch): Match {
  return {
    id: m._id,
    name: shortName(m.firstName, m.lastName),
    rating: m.averageRating != null ? m.averageRating.toFixed(1) : '',
    jobs: m.completedJobs ? `${m.completedJobs} Jobs` : '',
    distance: m.distance != null ? `${m.distance}km` : '',
    tags: m.primaryCategory ? [m.primaryCategory] : [],
    avatar: m.profilePicture || '',
  };
}

function bidToView(b: TaskBid): BidView {
  return {
    id: b._id,
    name: shortName(b.tasker.firstName, b.tasker.lastName),
    price: formatNaira(b.amount),
    rating: b.tasker.averageRating != null ? b.tasker.averageRating.toFixed(1) : '',
    message: b.message || '',
    avatar: b.tasker.profilePicture || '',
  };
}

function Dot() {
  return <RatingDot width={6} height={6} />;
}

function Avatar({ uri }: { uri: string }) {
  return (
    <View style={styles.avatarWrap}>
      {uri ? <Image source={{ uri }} style={styles.avatar} contentFit="cover" /> : null}
    </View>
  );
}

function MatchedCard({
  match,
  onInvite,
  onHire,
}: {
  match: Match;
  onInvite: () => void;
  onHire: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={match.avatar} />

        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{match.name}</Text>
          </View>

          <View style={styles.ratingRow}>
            {match.rating ? (
              <View style={styles.ratingItem}>
                <Star width={18} height={18} />
                <Text style={styles.metaText}>{match.rating}</Text>
              </View>
            ) : null}
            {match.jobs ? (
              <>
                <Dot />
                <Text style={styles.metaText}>{match.jobs}</Text>
              </>
            ) : null}
            {match.distance ? (
              <>
                <Dot />
                <Text style={styles.metaText}>{match.distance}</Text>
              </>
            ) : null}
          </View>

          {match.tags.length > 0 ? (
            <View style={styles.tags}>
              {match.tags.map((tag) => (
                <View key={tag} style={styles.pill}>
                  <Text style={styles.pillText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onInvite}>
          <Text style={styles.secondaryLabel}>Invite to Bid</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={onHire}>
          <Text style={styles.primaryLabel}>Hire Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BidCard({
  bid,
  onAccept,
  onChat,
}: {
  bid: BidView;
  onAccept: () => void;
  onChat: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={bid.avatar} />

        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{bid.name}</Text>
            <Text style={styles.name}>{bid.price}</Text>
          </View>

          {bid.rating ? (
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Star width={18} height={18} />
                <Text style={styles.metaText}>{bid.rating}</Text>
              </View>
            </View>
          ) : null}

          {bid.message ? <Text style={styles.bidMessage}>{bid.message}</Text> : null}
        </View>
      </View>

      <View style={styles.bidActions}>
        <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onChat}>
          <Text style={styles.secondaryLabel} numberOfLines={1}>
            Chat
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.tertiaryButton]} onPress={() => router.push({ pathname: '/tasker-profile', params: { name: bid.name } })}>
          <Text style={styles.tertiaryLabel} numberOfLines={1}>
            Profile
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={onAccept} >
          <Text style={styles.primaryLabel} numberOfLines={1}>
            Accept Bid
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TaskDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const taskQ = useTask(id);
  const matchesQ = useTaskMatches(id);
  const task = taskQ.data?.task;

  const queryClient = useQueryClient();
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<'matches' | 'bids'>('matches');
  const [invite, setInvite] = useState<{ taskerId: string; name: string } | null>(null);
  const [hire, setHire] = useState<HireContext | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);

  const matches = (matchesQ.data?.matches ?? []).map(matchToView);
  const bids = (task?.bids ?? []).map(bidToView);
  const budgetText = task ? formatNaira(task.budget) : '';
  const statusColor = task ? STATUS_COLORS[task.status] : STATUS_COLORS.open;

  const inviteMutation = useMutation({
    mutationFn: (taskerId: string) => inviteTasker({ taskId: id as string, taskerId }),
    onSuccess: () => {
      setInvite(null);
      Alert.alert('Invite sent', 'The tasker has been invited to bid on your task.');
    },
    onError: (err) => Alert.alert('Could not send invite', errorMessage(err)),
  });

  const acceptMutation = useMutation({
    mutationFn: (bidId: string) => acceptBid(bidId),
    onSuccess: () => {
      setHire(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Bid accepted', 'Payment is held in escrow until the task is completed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      // A short wallet balance returns 402 — offer to top up.
      if (err instanceof ApiError && err.status === 402) {
        setHire(null);
        Alert.alert('Insufficient balance', errorMessage(err), [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund wallet', onPress: () => router.push('/wallet') },
        ]);
        return;
      }
      Alert.alert('Could not accept bid', errorMessage(err));
    },
  });

  const hireMutation = useMutation({
    mutationFn: (v: { taskerId: string; amount: number }) =>
      sendHireRequest({ taskId: id as string, taskerId: v.taskerId, amount: v.amount }),
    onSuccess: () => {
      setHire(null);
      Alert.alert('Hire request sent', 'We’ll let you know when the tasker responds.');
    },
    onError: (err) => Alert.alert('Could not send hire request', errorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => changeTaskStatus(id as string, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Task cancelled', 'Your task has been cancelled.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err) => Alert.alert('Could not cancel task', errorMessage(err)),
  });

  const confirmCancel = () =>
    Alert.alert('Cancel Task', 'Are you sure you want to cancel this task?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);

  const openChatMutation = useMutation({
    mutationFn: (bidId: string) => createOrGetConversation({ taskId: id as string, bidId }),
    onSuccess: (res) => {
      const conv = res.conversation;
      const chatName =
        [conv.tasker?.firstName, conv.tasker?.lastName].filter(Boolean).join(' ') || 'Tasker';
      router.push({ pathname: '/chat', params: { id: conv._id, name: chatName } });
    },
    onError: (err) => Alert.alert('Could not open chat', errorMessage(err)),
  });

  const goTab = (next: 'matches' | 'bids') => {
    setTab(next);
    pagerRef.current?.scrollTo({ x: next === 'bids' ? SCREEN_WIDTH : 0, animated: true });
  };

  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const next = idx === 1 ? 'bids' : 'matches';
    if (next !== tab) setTab(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft width={22} height={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Task Details</Text>
          <Pressable hitSlop={8} onPress={() => setActionsVisible(true)} disabled={!task}>
            <Text style={[styles.actionsLink, !task && styles.actionsLinkDisabled]}>Actions</Text>
          </Pressable>
        </View>
      </View>

      {taskQ.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : !task ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Couldn’t load this task.</Text>
          <Pressable hitSlop={8} onPress={() => taskQ.refetch()}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Header (fixed above the swipeable pages) */}
          <View style={styles.header}>
            <View style={[styles.badge, styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.badgeText, { color: statusColor.text }]}>
                {statusLabel(task.status)}
              </Text>
            </View>

            <Text style={styles.title}>{task.title}</Text>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <MapPin width={16} height={16} />
                <Text style={styles.metaText}>{locationLabel(task)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock width={16} height={16} />
                <Text style={styles.metaText}>
                  {formatShortDate(task.deadline || task.createdAt)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Shield width={16} height={16} />
                <Text style={styles.metaText}>Safe</Text>
              </View>
            </View>

            {/* Budget */}
            <View style={styles.tabBudget}>
              <Text style={styles.budgetText}>Budget</Text>
              <Text style={styles.priceText}>{budgetText}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, tab === 'matches' && styles.tabActive]}
                onPress={() => goTab('matches')}>
                <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>
                  Smart Matches ({matches.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, tab === 'bids' && styles.tabActive]}
                onPress={() => goTab('bids')}>
                <Text style={[styles.tabText, tab === 'bids' && styles.tabTextActive]}>
                  Bids ({bids.length})
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Swipeable pages */}
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPagerScroll}
            style={styles.flex}>
            <ScrollView
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}>
              {matchesQ.isLoading ? (
                <View style={styles.pageState}>
                  <ActivityIndicator color={COLORS.brand} />
                </View>
              ) : matches.length === 0 ? (
                <View style={styles.pageState}>
                  <Text style={styles.stateText}>No matches yet.</Text>
                </View>
              ) : (
                matches.map((m) => (
                  <MatchedCard
                    key={m.id}
                    match={m}
                    onInvite={() => setInvite({ taskerId: m.id, name: m.name })}
                    onHire={() =>
                      setHire({
                        kind: 'hire',
                        taskerId: m.id,
                        name: m.name,
                        avatar: m.avatar,
                        price: budgetText,
                        amount: task.budget,
                      })
                    }
                  />
                ))
              )}
            </ScrollView>

            <ScrollView
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}>
              {bids.length === 0 ? (
                <View style={styles.pageState}>
                  <Text style={styles.stateText}>No bids yet.</Text>
                </View>
              ) : (
                bids.map((b) => (
                  <BidCard
                    key={b.id}
                    bid={b}
                    onChat={() => openChatMutation.mutate(b.id)}
                    onAccept={() =>
                      setHire({
                        kind: 'accept',
                        bidId: b.id,
                        name: b.name,
                        avatar: b.avatar,
                        price: b.price,
                      })
                    }
                  />
                ))
              )}
            </ScrollView>
          </ScrollView>

          <InviteToBidModal
            visible={invite !== null}
            taskerName={invite?.name ?? ''}
            onClose={() => setInvite(null)}
            onSend={() => {
              if (invite) inviteMutation.mutate(invite.taskerId);
            }}
          />
          <ReadyToHireModal
            visible={hire !== null}
            taskerName={hire?.name ?? ''}
            taskerAvatar={hire?.avatar ? { uri: hire.avatar } : null}
            taskerPrice={hire?.price ?? null}
            confirmLabel={hire?.kind === 'accept' ? 'Confirm & Pay' : 'Send Hire Request'}
            pending={acceptMutation.isPending || hireMutation.isPending}
            onConfirm={() => {
              if (!hire) return;
              if (hire.kind === 'accept') acceptMutation.mutate(hire.bidId);
              else hireMutation.mutate({ taskerId: hire.taskerId, amount: hire.amount });
            }}
            onClose={() => setHire(null)}
          />
          <TaskActionsModal
            visible={actionsVisible}
            onClose={() => setActionsVisible(false)}
            onEdit={() => Alert.alert('Edit Task', 'Edit task functionality goes here.')}
            onBoost={() => Alert.alert('Boost Task', 'Task boosted successfully!')}
            onCancel={confirmCancel}
            onReport={() => router.push('/report-issue')}
          />
        </>
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
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  actionsLink: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brandStrong,
  },
  actionsLinkDisabled: {
    opacity: 0.4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pageState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  page: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  title: {
    marginTop: 16,
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  meta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  tabBudget: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  budgetText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  priceText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  tabs: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.pillBg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    gap: 8,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  pill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.brandStrong,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bidActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.sunken,
  },
  secondaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
  },
  primaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.surface,
  },
  tertiaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  tertiaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  bidMessage: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
