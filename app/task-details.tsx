import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/auth-context';

import ArrowLeft from '@/assets/icons/arrow-left.svg';
import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import RatingDot from '@/assets/icons/rating-dot.svg';
import Shield from '@/assets/icons/shield.svg';
import Star from '@/assets/icons/star.svg';

const SHIELD_IMAGE = require('@/assets/images/3d-shield.png');
const CLIENT_AVATAR = require('@/assets/images/taskers/tasker-1.png');
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
  /** The bidding tasker's id — distinct from the bid's own id. */
  taskerId: string;
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
    taskerId: b.tasker._id,
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
        <Pressable style={[styles.actionButton, styles.tertiaryButton]} onPress={() => router.push({ pathname: '/tasker-profile', params: { name: bid.name, id: bid.taskerId } })}>
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

  const { accountType } = useAuth();
  const isTasker = accountType === 'tasker';
  const [nudgeModalVisible, setNudgeModalVisible] = useState(false);

  const getMockState = () => {
    if (id && id.toString().startsWith('discover-')) {
      return 'open';
    }
    if (id === '1') return 'in_progress';
    if (id === '2') return 'bid_sent';
    if (id === '3') return 'invitation_received';
    if (id === '4') return 'awaiting_confirmation';
    return 'open';
  };

  const [taskerState, setTaskerState] = useState<'open' | 'bid_sent' | 'invitation_received' | 'in_progress' | 'awaiting_confirmation'>(getMockState());
  const [acceptSheetVisible, setAcceptSheetVisible] = useState(false);
  const [declineSheetVisible, setDeclineSheetVisible] = useState(false);
  const [acceptedSuccessVisible, setAcceptedSuccessVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [editBidSheetVisible, setEditBidSheetVisible] = useState(false);
  const [bidUpdatedVisible, setBidUpdatedVisible] = useState(false);
  const [taskerActionsVisible, setTaskerActionsVisible] = useState(false);
  const [bidAmountInput, setBidAmountInput] = useState('1,000');
  const [placeBidVisible, setPlaceBidVisible] = useState(false);
  const [bidMessageInput, setBidMessageInput] = useState('');
  const [completionSheetVisible, setCompletionSheetVisible] = useState(false);
  const [requestSentVisible, setRequestSentVisible] = useState(false);
  const [successDialogType, setSuccessDialogType] = useState<'submitted' | 'updated'>('submitted');

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



  if (isTasker) {
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
            <Pressable hitSlop={8} onPress={() => {
              if (taskerState === 'invitation_received') {
                setDeclineSheetVisible(true);
              } else {
                setTaskerActionsVisible(true);
              }
            }}>
              <Text style={styles.actionsLink}>Actions</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.taskerScrollContent} showsVerticalScrollIndicator={false}>
          {/* Remote tag */}
          <View style={styles.taskerRemoteBadge}>
            <MaterialCommunityIcons name="laptop" size={14} color="#0d6639" />
            <Text style={styles.taskerRemoteBadgeText}>Remote</Text>
          </View>

          {/* Title */}
          <Text style={styles.taskerTitleText}>
            {taskerState === 'bid_sent' ? 'Design a flyer for event' : 'Build a Landing page'}
          </Text>

          {/* Meta items */}
          <View style={styles.taskerMetaRow}>
            <View style={styles.taskerMetaItem}>
              <MapPin width={14} height={14} color="#5a5a70" />
              <Text style={styles.taskerMetaText}>Remote</Text>
            </View>
            <View style={styles.taskerMetaItem}>
              <Clock width={14} height={14} color="#5a5a70" />
              <Text style={styles.taskerMetaText}>18 May</Text>
            </View>
            <View style={styles.taskerMetaItem}>
              <Ionicons name="people-outline" size={14} color="#5a5a70" />
              <Text style={styles.taskerMetaText}>3 Bids</Text>
            </View>
            <View style={styles.taskerMetaItem}>
              <Ionicons name="shield-outline" size={14} color="#5a5a70" />
              <Text style={styles.taskerMetaText}>Safe</Text>
            </View>
          </View>

          {/* Secured Banner or Budget Card */}
          {taskerState === 'in_progress' || taskerState === 'awaiting_confirmation' ? (
            <View style={styles.taskerSecuredBanner}>
              <View style={styles.taskerWalletIconWrap}>
                <Ionicons name="wallet-outline" size={20} color="#0d6639" />
              </View>
              <View style={styles.taskerSecuredInfo}>
                <Text style={styles.taskerSecuredTitle}>Payment Secured</Text>
                <Text style={styles.taskerSecuredSubtitle}>₦500,000 held in escrow</Text>
              </View>
            </View>
          ) : (
            <View style={styles.taskerBudgetCard}>
              <Text style={styles.taskerBudgetLabel}>Budget</Text>
              <Text style={styles.taskerBudgetValue}>₦500,000</Text>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.taskerDetailCard}>
            <Text style={styles.taskerCardSectionTitle}>Description</Text>
            <Text style={styles.taskerDescriptionText}>
              I need someone that can build a luxurious landing page for my startup business
            </Text>
          </View>

          {/* Client Card */}
          <View style={styles.taskerDetailCard}>
            <Text style={styles.taskerCardSectionTitle}>Client</Text>
            <View style={styles.taskerClientRow}>
              <Image source={CLIENT_AVATAR} style={styles.taskerClientAvatar} contentFit="cover" />
              <View style={styles.taskerClientInfo}>
                <Text style={styles.taskerClientName}>Sarah K.</Text>
                <Text style={styles.taskerClientMeta}>Joined 2025 • 4 tasks posted</Text>
              </View>
            </View>
          </View>

          {/* Your Bid Card (Image 2) */}
          {taskerState === 'bid_sent' && (
            <View style={styles.yourBidContainer}>
              <View style={styles.yourBidHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#6c3bff" />
                <Text style={styles.yourBidTitle}>Your Bid</Text>
              </View>
              <View style={styles.yourBidCard}>
                <View style={styles.yourBidCardHeader}>
                  <Text style={styles.yourBidCardTitle}>Design a flyer for event</Text>
                  <Text style={styles.yourBidCardPrice}>₦{bidAmountInput}</Text>
                </View>
                <View style={styles.yourBidCardMetaRow}>
                  <View style={styles.yourBidCardMetaItem}>
                    <MapPin width={12} height={12} color="#5a5a70" />
                    <Text style={styles.yourBidCardMetaText}>Remote</Text>
                  </View>
                  <View style={styles.yourBidCardMetaItem}>
                    <Clock width={12} height={12} color="#5a5a70" />
                    <Text style={styles.yourBidCardMetaText}>2mins ago</Text>
                  </View>
                  <View style={styles.yourBidTagPending}>
                    <Text style={styles.yourBidTagText}>Pending</Text>
                  </View>
                </View>
                <View style={styles.yourBidMessageCard}>
                  <Text style={styles.yourBidMessageText}>
                    {bidMessageInput ? `"${bidMessageInput}"` : '"Will deliver 3 design concepts within 24 hours."'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Timeline Section (Images 1 & 5) */}
          {(taskerState === 'in_progress' || taskerState === 'awaiting_confirmation') && (
            <View style={styles.taskerDetailCard}>
              <Text style={styles.taskerCardSectionTitle}>Task Timeline</Text>
              <View style={styles.taskerTimelineList}>
                {/* 1. Accepted (checked) */}
                <View style={styles.taskerTimelineRow}>
                  <View style={styles.taskerTimelineLeftColumn}>
                    <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotChecked]}>
                      <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                    </View>
                    <View style={styles.taskerTimelineLine} />
                  </View>
                  <View style={styles.taskerTimelineContent}>
                    <Text style={styles.taskerTimelineText}>Accepted</Text>
                    <Text style={styles.taskerTimelineTime}>2:00PM</Text>
                  </View>
                </View>

                {/* 2. Escrow funded (checked) */}
                <View style={styles.taskerTimelineRow}>
                  <View style={styles.taskerTimelineLeftColumn}>
                    <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotChecked]}>
                      <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                    </View>
                    <View style={styles.taskerTimelineLine} />
                  </View>
                  <View style={styles.taskerTimelineContent}>
                    <Text style={styles.taskerTimelineText}>Escrow funded</Text>
                    <Text style={styles.taskerTimelineTime}>2:15PM</Text>
                  </View>
                </View>

                {/* 3. Task Started (checked) */}
                <View style={styles.taskerTimelineRow}>
                  <View style={styles.taskerTimelineLeftColumn}>
                    <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotChecked]}>
                      <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                    </View>
                    <View style={styles.taskerTimelineLine} />
                  </View>
                  <View style={styles.taskerTimelineContent}>
                    <Text style={styles.taskerTimelineText}>Task Started</Text>
                    <Text style={styles.taskerTimelineTime}>2:16PM</Text>
                  </View>
                </View>

                {/* 4. Request confirmation / Awaiting confirmation */}
                <View style={styles.taskerTimelineRow}>
                  <View style={styles.taskerTimelineLeftColumn}>
                    {taskerState === 'awaiting_confirmation' ? (
                      <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotChecked]}>
                        <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                      </View>
                    ) : (
                      <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotActive]}>
                        <View style={styles.taskerTimelineInnerDot} />
                      </View>
                    )}
                    <View style={styles.taskerTimelineLine} />
                  </View>
                  <View style={styles.taskerTimelineContent}>
                    <Text style={[styles.taskerTimelineText, taskerState === 'in_progress' && styles.taskerTimelineTextActive]}>
                      {taskerState === 'awaiting_confirmation' ? 'Awaiting confirmation' : 'Request confirmation'}
                    </Text>
                    <Text style={styles.taskerTimelineTime}>2:00PM</Text>
                  </View>
                </View>

                {/* 5. Completed */}
                <View style={styles.taskerTimelineRow}>
                  <View style={styles.taskerTimelineLeftColumn}>
                    <View style={[styles.taskerTimelineDot, styles.taskerTimelineDotFuture]} />
                  </View>
                  <View style={styles.taskerTimelineContent}>
                    <Text style={[styles.taskerTimelineText, styles.taskerTimelineTextFuture]}>Completed</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Attachments Section */}
          <View style={styles.taskerDetailCard}>
            <Text style={styles.taskerCardSectionTitle}>Image & Attachment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentRow}>
              <Image source={{ uri: 'https://picsum.photos/id/1/200/200' }} style={styles.attachmentImage} />
              <Image source={{ uri: 'https://picsum.photos/id/3/200/200' }} style={styles.attachmentImage} />
              <Image source={{ uri: 'https://picsum.photos/id/48/200/200' }} style={styles.attachmentImage} />
              <Image source={{ uri: 'https://picsum.photos/id/60/200/200' }} style={styles.attachmentImage} />
            </ScrollView>
          </View>
        </ScrollView>

        {/* Bottom Actions for Tasker */}
        <View style={[styles.bottomBarTasker, { paddingBottom: insets.bottom + 16 }]}>
          {taskerState === 'open' && (
            <>
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                onPress={() => {
                  setPlaceBidVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Place Bid</Text>
              </Pressable>
              <Pressable style={styles.btnSecondaryTasker} onPress={() => router.push('/chat')}>
                <Text style={styles.btnSecondaryTextTasker}>Chat (1)</Text>
              </Pressable>
            </>
          )}
          {taskerState === 'in_progress' && (
              <>
                <Pressable
                  style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                  onPress={() => {
                    setCompletionSheetVisible(true);
                  }}>
                  <Text style={styles.sheetButtonText}>Request Completion</Text>
                </Pressable>
                <Pressable style={styles.btnSecondaryTasker} onPress={() => router.push('/chat')}>
                  <Text style={styles.btnSecondaryTextTasker}>Chat</Text>
                </Pressable>
              </>
            )}

            {taskerState === 'awaiting_confirmation' && (
              <>
                <Pressable
                  style={[styles.sheetButton, { backgroundColor: COLORS.brand, flexDirection: 'row', gap: 8 }]}
                  onPress={() => {
                    setNudgeModalVisible(true);
                    setTimeout(() => {
                      setNudgeModalVisible(false);
                    }, 2500);
                  }}>
                  <Ionicons name="notifications-outline" size={18} color="#ffffff" />
                  <Text style={styles.sheetButtonText}>Nudge</Text>
                </Pressable>
                <Pressable style={styles.btnSecondaryTasker} onPress={() => router.push('/chat')}>
                  <Text style={styles.btnSecondaryTextTasker}>Chat</Text>
                </Pressable>
              </>
            )}

            {taskerState === 'bid_sent' && (
              <>
                <Pressable
                  style={[styles.sheetButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => {
                    setWithdrawModalVisible(true);
                  }}>
                  <Text style={styles.sheetButtonText}>Withdraw Bid</Text>
                </Pressable>
                <Pressable style={styles.btnSecondaryTasker} onPress={() => setEditBidSheetVisible(true)}>
                  <Text style={styles.btnSecondaryTextTasker}>Edit Bid</Text>
                </Pressable>
              </>
            )}

            {taskerState === 'invitation_received' && (
              <>
                <Pressable
                  style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                  onPress={() => {
                    setAcceptSheetVisible(true);
                  }}>
                  <Text style={styles.sheetButtonText}>Accept</Text>
                </Pressable>
                <Pressable style={styles.btnSecondaryTasker} onPress={() => router.push('/chat')}>
                  <Text style={styles.btnSecondaryTextTasker}>Chat (1)</Text>
                </Pressable>
              </>
            )}
          </View>

        {/* Reminder Sent Modal (Tasker Only) */}
        <Modal visible={nudgeModalVisible} transparent animationType="fade" onRequestClose={() => setNudgeModalVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setNudgeModalVisible(false)}>
            <View style={styles.reminderModalBox}>
              <View style={{ position: 'relative', width: 80, height: 80 }}>
                <Image source={SHIELD_IMAGE} style={styles.shield3d} contentFit="contain" />
                <View style={styles.reminderBadge}>
                  <Ionicons name="checkmark-sharp" size={12} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.reminderTitle}>Reminder Sent</Text>
              <Text style={styles.reminderSubtitle}>
                We've notified Aisha M.. You'll receive a notification when they respond.
              </Text>
            </View>
          </Pressable>
        </Modal>

        {/* Decline Invitation Modal */}
        <Modal visible={declineSheetVisible} transparent animationType="fade" onRequestClose={() => setDeclineSheetVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDeclineSheetVisible(false)}>
            <View style={styles.successDialog}>
              <Text style={styles.dialogTitle}>Decline Invitation?</Text>
              <Text style={styles.dialogSubtitle}>
                Are you sure you want to decline "Clean my apartment" from Musa K.? This can't be undone.
              </Text>

              <Pressable
                style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
                onPress={() => {
                  setTaskerState('open');
                  setDeclineSheetVisible(false);
                  router.back();
                }}>
                <Text style={styles.sheetButtonText}>Yes, Decline</Text>
              </Pressable>

              <Pressable
                style={[styles.btnNotYet, { marginTop: 0 }]}
                onPress={() => setDeclineSheetVisible(false)}>
                <Text style={[styles.btnNotYetText, { color: COLORS.brand }]}>Keep</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Accept Invitation Modal */}
        <Modal visible={acceptSheetVisible} transparent animationType="fade" onRequestClose={() => setAcceptSheetVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAcceptSheetVisible(false)}>
            <View style={styles.successDialog}>
              <Text style={styles.dialogTitle}>Accept Invitation?</Text>
              <Text style={styles.dialogSubtitle}>
                You'll be hired for "Build a landing page" by Sarah K.. You can start chatting immediately after.
              </Text>

              <Pressable
                style={[styles.dialogButton, { backgroundColor: '#10b981' }]}
                onPress={() => {
                  setTaskerState('in_progress');
                  setAcceptSheetVisible(false);
                  setAcceptedSuccessVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Yes, Accept</Text>
              </Pressable>

              <Pressable
                style={[styles.btnNotYet, { marginTop: 0 }]}
                onPress={() => setAcceptSheetVisible(false)}>
                <Text style={[styles.btnNotYetText, { color: COLORS.brand }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Invitation Accepted Success Sheet */}
        <Modal visible={acceptedSuccessVisible} transparent animationType="slide" onRequestClose={() => setAcceptedSuccessVisible(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setAcceptedSuccessVisible(false)}>
            <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
              <Pressable style={styles.closeButtonX} onPress={() => setAcceptedSuccessVisible(false)}>
                <Ionicons name="close" size={24} color="#5a5a70" />
              </Pressable>

              {/* 3D Shield Icon with check badge */}
              <View style={{ alignSelf: 'center', marginVertical: 16 }}>
                <View style={{ position: 'relative', width: 80, height: 80 }}>
                  <Image source={SHIELD_IMAGE} style={styles.shield3d} contentFit="contain" />
                  <View style={styles.reminderBadge}>
                    <Ionicons name="checkmark-sharp" size={12} color="#ffffff" />
                  </View>
                </View>
              </View>

              <Text style={[styles.sheetTitle, { textAlign: 'center', marginTop: 12 }]}>Invitation Accepted!</Text>
              <Text style={[styles.sheetSubtitle, { textAlign: 'center', color: '#5a5a70', marginBottom: 12 }]}>
                "Build a landing page" is now in your Active Jobs.
              </Text>

              {/* Steps Container */}
              <View style={styles.stepsContainer}>
                {/* Step 1 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepIconWrap, { backgroundColor: '#f3eeff' }]}>
                    <Ionicons name="play" size={16} color={COLORS.brand} />
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>Find it in Active Jobs</Text>
                    <Text style={styles.stepSubtitle}>Go to Current → Active to see your task card and start working.</Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepIconWrap, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="chatbubble" size={16} color="#1d4ed8" />
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>Chat with Sarah K.</Text>
                    <Text style={styles.stepSubtitle}>Coordinate details and confirm the task scope.</Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepIconWrap, { backgroundColor: '#edfaf3' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#0d6639" />
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>Update progress</Text>
                    <Text style={styles.stepSubtitle}>Use the "Update" button on the card to move through task stages.</Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand, marginTop: 16 }]}
                onPress={() => {
                  setAcceptedSuccessVisible(false);
                  router.push('/tasks');
                }}>
                <Text style={styles.sheetButtonText}>Go to Active Jobs</Text>
              </Pressable>

              <Pressable
                style={styles.btnNotYet}
                onPress={() => setAcceptedSuccessVisible(false)}>
                <Text style={[styles.btnNotYetText, { color: '#5a5a70' }]}>Maybe Later</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Task Actions Modal */}
        <TaskActionsModal
          visible={actionsVisible}
          onClose={() => setActionsVisible(false)}
          onEdit={() => Alert.alert('Edit Task', 'Edit task functionality goes here.')}
          onCancel={() => {
            Alert.alert('Cancel Task', 'Are you sure?', [
              { text: 'No' },
              { text: 'Yes', onPress: () => setTaskerState('open') }
            ]);
            setActionsVisible(false);
          }}
          onReport={() => router.push('/report-issue')}
        />

        {/* Withdraw Bid Modal */}
        <Modal visible={withdrawModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawModalVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setWithdrawModalVisible(false)}>
            <View style={styles.successDialog}>
              <Text style={styles.dialogTitle}>Withdraw Bid?</Text>
              <Text style={styles.dialogSubtitle}>
                Are you sure you want to withdraw your bid for "Print my assignment"? You can't undo this.
              </Text>

              <Pressable
                style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
                onPress={() => {
                  setTaskerState('open');
                  setWithdrawModalVisible(false);
                  router.back();
                }}>
                <Text style={styles.sheetButtonText}>Yes, Withdraw Bid</Text>
              </Pressable>

              <Pressable
                style={[styles.btnNotYet, { marginTop: 0 }]}
                onPress={() => setWithdrawModalVisible(false)}>
                <Text style={[styles.btnNotYetText, { color: COLORS.brand }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Edit Your Bid Bottom Sheet */}
        <Modal visible={editBidSheetVisible} transparent animationType="slide" onRequestClose={() => setEditBidSheetVisible(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setEditBidSheetVisible(false)}>
            <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Edit Your Bid</Text>

              <View style={[styles.sheetJobCard, { backgroundColor: '#f2f2f7', marginTop: 8 }]}>
                <Text style={[styles.sheetJobTitle, { color: '#5a5a70' }]}>
                  Design a flyer for event
                </Text>
              </View>

              <View style={{ gap: 8, width: '100%', marginTop: 8 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#111122', paddingHorizontal: 16 }}>Bid Amount (₦)</Text>
                <TextInput
                  style={styles.dialogTextInput}
                  value={bidAmountInput}
                  onChangeText={setBidAmountInput}
                  keyboardType="numeric"
                />
              </View>

              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand, marginTop: 16 }]}
                onPress={() => {
                  setEditBidSheetVisible(false);
                  setSuccessDialogType('updated');
                  setBidUpdatedVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Update bid</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Bid Updated Success Modal */}
        <Modal visible={bidUpdatedVisible} transparent animationType="fade" onRequestClose={() => setBidUpdatedVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setBidUpdatedVisible(false)}>
            <View style={styles.successDialog}>
              <View style={styles.scallopedIconContainer}>
                <View style={styles.scallopedGreenBox}>
                  <Ionicons name="checkmark" size={44} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.dialogTitle}>
                {successDialogType === 'submitted' ? 'Bid Submitted' : 'Bid Updated'}
              </Text>
              <Text style={styles.dialogSubtitle}>
                {successDialogType === 'submitted'
                  ? 'You will be notified when the Client responds'
                  : 'You have successfully updated you bid for the task "Design a flyer for event"'}
              </Text>
              <Pressable
                style={styles.dialogButton}
                onPress={() => {
                  setBidUpdatedVisible(false);
                }}>
                <Text style={styles.dialogButtonText}>Okay</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Tasker Actions Bottom Sheet */}
        <Modal visible={taskerActionsVisible} transparent animationType="slide" onRequestClose={() => setTaskerActionsVisible(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setTaskerActionsVisible(false)}>
            <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Actions</Text>

              <Pressable
                style={styles.actionRowBtn}
                onPress={() => {
                  setTaskerActionsVisible(false);
                  Alert.alert('Share Task', 'Link copied to clipboard!');
                }}>
                <Ionicons name="share-outline" size={22} color="#111122" />
                <Text style={styles.actionRowText}>Share Task</Text>
              </Pressable>

              <Pressable
                style={styles.actionRowBtn}
                onPress={() => {
                  setTaskerActionsVisible(false);
                  router.push('/report-issue');
                }}>
                <Ionicons name="warning-outline" size={22} color="#ef4444" />
                <Text style={[styles.actionRowText, { color: '#ef4444' }]}>Report Task</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Place Your Bid Full-Screen Modal */}
        <Modal visible={placeBidVisible} transparent={false} animationType="slide" onRequestClose={() => setPlaceBidVisible(false)}>
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Custom header matching Image 4 */}
            <View style={styles.topBar}>
              <View style={styles.headerRow}>
                <Pressable hitSlop={8} onPress={() => setPlaceBidVisible(false)}>
                  <ArrowLeft width={22} height={22} />
                </Pressable>
                <Text style={styles.headerTitle}>Bids</Text>
                <View style={{ width: 22 }} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }} style={styles.flex}>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 24, color: '#111122', marginTop: 8 }}>
                Place Your Bid
              </Text>

              {/* Amount input */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111122' }}>
                  Enter your Bid Amount (₦)
                </Text>
                <TextInput
                  style={styles.dialogTextInput}
                  placeholder="e.g 1000"
                  placeholderTextColor="#a0a0ba"
                  value={bidAmountInput}
                  onChangeText={setBidAmountInput}
                  keyboardType="numeric"
                />
              </View>

              {/* Message input */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111122' }}>
                  Message
                </Text>
                <TextInput
                  style={[styles.dialogTextInput, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="Tell the Client why you are best fit..."
                  placeholderTextColor="#a0a0ba"
                  value={bidMessageInput}
                  onChangeText={setBidMessageInput}
                  multiline
                />
              </View>
            </ScrollView>

            {/* Bottom action button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                onPress={() => {
                  setPlaceBidVisible(false);
                  setTaskerState('bid_sent');
                  setSuccessDialogType('submitted');
                  setBidUpdatedVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Submit Bid</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Update Completion Bottom Sheet (Tasker Only) */}
        <Modal visible={completionSheetVisible} transparent animationType="slide" onRequestClose={() => setCompletionSheetVisible(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setCompletionSheetVisible(false)}>
            <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Update Completion</Text>
              <Text style={styles.sheetSubtitle}>
                Once you request completion, the customer will be notified to review and confirm the work. Payment will be released from escrow after confirmation.
              </Text>

              {/* Job Details Card inside Sheet */}
              <View style={styles.sheetJobCard}>
                <Text style={styles.sheetJobTitle}>Build a Landing page</Text>
              </View>

              {/* Buttons */}
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                onPress={() => {
                  setCompletionSheetVisible(false);
                  setRequestSentVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Request completion</Text>
              </Pressable>

              <Pressable
                style={styles.btnNotYet}
                onPress={() => setCompletionSheetVisible(false)}>
                <Text style={styles.btnNotYetText}>Not Yet</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Request Sent Dialog (Tasker Only) */}
        <Modal visible={requestSentVisible} transparent animationType="fade" onRequestClose={() => setRequestSentVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRequestSentVisible(false)}>
            <View style={styles.successDialog}>
              <Text style={styles.dialogTitle}>Request Sent</Text>
              <Text style={styles.dialogSubtitle}>
                The customer will be notified to review and confirm the work.
              </Text>
              <Pressable
                style={styles.dialogButton}
                onPress={() => {
                  setTaskerState('awaiting_confirmation');
                  setRequestSentVisible(false);
                }}>
                <Text style={styles.dialogButtonText}>Okay</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

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
  // Tasker-specific styles
  taskerScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  taskerRemoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#edfaf3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  taskerRemoteBadgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: '#0d6639',
  },
  taskerTitleText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginTop: 4,
  },
  taskerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  taskerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskerMetaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  taskerSecuredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#edfaf3',
    borderColor: '#d2f4e1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  taskerWalletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#d2f4e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskerSecuredInfo: {
    flex: 1,
    gap: 2,
  },
  taskerSecuredTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#0d6639',
  },
  taskerSecuredSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#0d6639',
  },
  taskerBudgetCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0ea',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskerBudgetLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  taskerBudgetValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  taskerDetailCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0ea',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  taskerCardSectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  taskerDescriptionText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  taskerClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskerClientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f2f2f7',
  },
  taskerClientInfo: {
    gap: 4,
  },
  taskerClientName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  taskerClientMeta: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  attachmentImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  bottomBarTasker: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0ea',
    gap: 8,
  },
  sheetButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#ffffff',
  },
  btnSecondaryTasker: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTextTasker: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#6c3bff',
  },
  reminderModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  shield3d: {
    width: 80,
    height: 80,
  },
  reminderBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  reminderTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: '#111122',
    textAlign: 'center',
  },
  reminderSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#5a5a70',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  yourBidContainer: {
    gap: 8,
  },
  yourBidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  yourBidTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#6c3bff',
  },
  yourBidCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0ea',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  yourBidCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourBidCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  yourBidCardPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: '#6c3bff',
  },
  yourBidCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yourBidCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yourBidCardMetaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  yourBidTagPending: {
    backgroundColor: '#fffbea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  yourBidTagText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: '#b45309',
  },
  yourBidMessageCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    padding: 12,
  },
  yourBidMessageText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  taskerTimelineList: {
    paddingLeft: 4,
  },
  taskerTimelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  taskerTimelineLeftColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  taskerTimelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  taskerTimelineDotChecked: {
    backgroundColor: '#6c3bff',
  },
  taskerTimelineDotActive: {
    borderWidth: 2,
    borderColor: '#6c3bff',
    backgroundColor: '#ffffff',
  },
  taskerTimelineInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6c3bff',
  },
  taskerTimelineDotFuture: {
    backgroundColor: '#c8c8d3',
  },
  taskerTimelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -32,
    width: 2,
    backgroundColor: '#6c3bff',
    zIndex: 0,
  },
  taskerTimelineContent: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  taskerTimelineText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  taskerTimelineTextActive: {
    color: '#6c3bff',
  },
  taskerTimelineTextFuture: {
    fontFamily: 'Geist_500Medium',
    color: COLORS.textSecondary,
  },
  taskerTimelineTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0ea',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: '#111122',
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  sheetSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#5a5a70',
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  btnNotYet: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  btnNotYetText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#6c3bff',
  },
  closeButtonX: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  acceptedIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  acceptedPurpleBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  acceptedPersonWrap: {
    position: 'absolute',
  },
  acceptedGreenCheck: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  stepsContainer: {
    backgroundColor: '#f9f9fb',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    width: '100%',
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#111122',
  },
  stepSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#5a5a70',
  },
  successDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  dialogTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: '#111122',
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#5a5a70',
    textAlign: 'center',
  },
  dialogButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6c3bff',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dialogButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#ffffff',
  },
  dialogTextInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0ea',
    paddingHorizontal: 16,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: '#111122',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  scallopedIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  scallopedGreenBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#e6f7f0',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  actionRowText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#111122',
  },
  sheetJobCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    width: '100%',
  },
  sheetJobTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#5a5a70',
  },
});
