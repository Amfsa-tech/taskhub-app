import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CaretRight from '@/assets/icons/caret-right.svg';
import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import NavPlus from '@/assets/icons/nav-plus.svg';
import StarAmber from '@/assets/icons/star-amber.svg';
import { HireAgainModal } from '@/components/taskhub/hire-again-modal';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import {
  CompletedTaskCard,
  InProgressTaskCard,
  TaskCard,
} from '@/components/taskhub/task-card';
import { useUserTasks, useUserTasksByStatuses } from '@/lib/api/queries';
import { rateTask, taskToCard, taskToCompletedCard, taskToInProgressCard } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  error: '#dc2626',
};

const SHIELD_IMAGE = require('@/assets/images/3d-shield.png');

type TaskTab = 'posted' | 'in_progress' | 'completed';

type StateViewProps = {
  mode: 'loading' | 'error' | 'empty';
  emptyText?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

function StateView({ mode, emptyText, onRetry, isRetrying }: StateViewProps) {
  if (mode === 'loading') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }
  if (mode === 'error') {
    return (
      <View style={styles.state}>
        <Text style={styles.errorText}>Couldn’t load your tasks.</Text>
        <Pressable hitSlop={8} onPress={onRetry} disabled={isRetrying}>
          <Text style={styles.retry}>{isRetrying ? 'Retrying…' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pagerRef = useRef<ScrollView>(null);
  const { accountType } = useAuth();
  const [tab, setTab] = useState<TaskTab>('posted');

  const isTasker = accountType === 'tasker';

  const queryClient = useQueryClient();
  const posted = useUserTasks({ status: 'open' });
  const inProgress = useUserTasksByStatuses(['assigned', 'in-progress']);
  const completed = useUserTasks({ status: 'completed' });

  const postedTasks = posted.data?.tasks ?? [];
  const completedTasks = completed.data?.tasks ?? [];

  // The review sheet needs the tasker's identity as well as the task's, so the
  // whole target is captured when the card is tapped.
  const [reviewTask, setReviewTask] = useState<{
    id: string;
    taskerName: string;
    taskerAvatar: string;
  } | null>(null);
  const [hireTaskerName, setHireTaskerName] = useState<string | null>(null);

  const rateMutation = useMutation({
    mutationFn: (v: { id: string; rating: number; reviewText: string }) =>
      rateTask(v.id, { rating: v.rating, reviewText: v.reviewText || undefined }),
    onSuccess: () => {
      setReviewTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Thanks!', 'Your review has been submitted.');
    },
    onError: (err) =>
      Alert.alert(
        'Could not submit review',
        err instanceof Error ? err.message : 'Please try again.',
      ),
  });

  const openTask = (id: string) =>
    router.push({ pathname: '/task-details', params: { id } });

  const goTab = (next: TaskTab) => {
    setTab(next);
    const idx = next === 'posted' ? 0 : next === 'in_progress' ? 1 : 2;
    pagerRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const next: TaskTab = idx === 0 ? 'posted' : idx === 1 ? 'in_progress' : 'completed';
    if (next !== tab) setTab(next);
  };

  // Each page pulls only its own query, so the spinner tracks the list you're
  // actually looking at.
  const refreshControl = (onRefresh: () => void, isRefreshing: boolean) => (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={COLORS.brand}
      colors={[COLORS.brand]}
    />
  );

  if (isTasker) {
    return <TaskerJobsView insets={insets} router={router} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>My Task</Text>
          <Pressable style={styles.plus} hitSlop={8} onPress={() => router.push('/post')}>
            <NavPlus width={20} height={20} />
          </Pressable>
        </View>

        {/* Posted / In progress / Completed tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'posted' && styles.tabActive]}
            onPress={() => goTab('posted')}>
            <Text style={[styles.tabText, tab === 'posted' && styles.tabTextActive]}>Posted</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'in_progress' && styles.tabActive]}
            onPress={() => goTab('in_progress')}>
            <Text style={[styles.tabText, tab === 'in_progress' && styles.tabTextActive]}>In progress</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'completed' && styles.tabActive]}
            onPress={() => goTab('completed')}>
            <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
              Completed
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
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl(posted.refetch, posted.isRefetching)}>
          {posted.isLoading ? (
            <StateView mode="loading" />
          ) : posted.isError ? (
            <StateView mode="error" onRetry={posted.refetch} isRetrying={posted.isRefetching} />
          ) : postedTasks.length === 0 ? (
            <StateView mode="empty" emptyText="No posted tasks yet." />
          ) : (
            postedTasks.map((task) => (
              <TaskCard key={task._id} task={taskToCard(task)} onPress={() => openTask(task._id)} />
            ))
          )}
        </ScrollView>

        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl(inProgress.refetch, inProgress.isRefetching)}>
          {inProgress.isLoading ? (
            <StateView mode="loading" />
          ) : inProgress.isError ? (
            <StateView
              mode="error"
              onRetry={inProgress.refetch}
              isRetrying={inProgress.isRefetching}
            />
          ) : inProgress.tasks.length === 0 ? (
            <StateView mode="empty" emptyText="No tasks in progress." />
          ) : (
            inProgress.tasks.map((task) => (
              <InProgressTaskCard
                key={task._id}
                task={taskToInProgressCard(task)}
                onPress={() => router.push({ pathname: '/track-task', params: { id: task._id } })}
              />
            ))
          )}
        </ScrollView>

        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl(completed.refetch, completed.isRefetching)}>
          {completed.isLoading ? (
            <StateView mode="loading" />
          ) : completed.isError ? (
            <StateView
              mode="error"
              onRetry={completed.refetch}
              isRetrying={completed.isRefetching}
            />
          ) : completedTasks.length === 0 ? (
            <StateView mode="empty" emptyText="No completed tasks yet." />
          ) : (
            completedTasks.map((task) => {
              const card = taskToCompletedCard(task);
              return (
                <CompletedTaskCard
                  key={task._id}
                  task={card}
                  onPress={() => openTask(task._id)}
                  onHireAgain={() => setHireTaskerName(card.tasker.name)}
                  onLeaveReview={() =>
                    setReviewTask({
                      id: task._id,
                      taskerName: card.tasker.name,
                      taskerAvatar: card.tasker.avatar,
                    })
                  }
                  onReceipt={() =>
                    router.push({ pathname: '/receipt', params: { id: task._id } })
                  }
                />
              );
            })
          )}
        </ScrollView>
      </ScrollView>

      <HireAgainModal
        visible={hireTaskerName !== null}
        onClose={() => setHireTaskerName(null)}
        taskerName={hireTaskerName ?? ''}
      />

      <RateTaskerModal
        visible={reviewTask !== null}
        onClose={() => setReviewTask(null)}
        taskerName={reviewTask?.taskerName ?? ''}
        taskerAvatar={reviewTask?.taskerAvatar ?? ''}
        pending={rateMutation.isPending}
        onSubmit={(rating, comment) => {
          if (reviewTask) {
            rateMutation.mutate({ id: reviewTask.id, rating, reviewText: comment });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  flex: {
    flex: 1,
  },
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
  plus: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  state: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  // Tasker Jobs list styles
  taskerContainer: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  taskerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taskerHeading: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  taskerPillsWrapper: {
    paddingVertical: 8,
  },
  taskerPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  taskerPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#eff0f3',
  },
  taskerPillActive: {
    backgroundColor: COLORS.brand,
  },
  taskerPillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  taskerPillTextActive: {
    color: '#ffffff',
  },
  taskerListScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0ea',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  jobCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  jobCardPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  jobCardPriceGreen: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: '#0d6639',
  },
  jobCardClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobCardClient: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  jobCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  jobCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobCardMetaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagRemote: {
    backgroundColor: '#edfaf3',
  },
  tagRemoteText: {
    color: '#0d6639',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagPending: {
    backgroundColor: '#fffbea',
  },
  tagPendingText: {
    color: '#b45309',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagCompleted: {
    backgroundColor: '#edfaf3',
    alignSelf: 'flex-start',
  },
  tagCompletedText: {
    color: '#0d6639',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  statusBannerOrange: {
    backgroundColor: '#fffbea',
    borderWidth: 1,
    borderColor: '#ffeeb2',
  },
  statusBannerRed: {
    backgroundColor: '#fff1f1',
    borderWidth: 1,
    borderColor: '#ffccd1',
  },
  statusBannerTextOrange: {
    color: '#b45309',
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    flex: 1,
  },
  statusBannerTextRed: {
    color: '#dc2626',
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    flex: 1,
  },
  statusBannerTextBold: {
    fontFamily: 'Geist_600SemiBold',
  },
  statusBannerSubText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  textBox: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    padding: 12,
  },
  textBoxText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: COLORS.brand,
  },
  btnPrimaryText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#ffffff',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  btnSecondaryText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.brand,
  },
  btnMutedPurple: {
    backgroundColor: '#f3eeff',
  },
  btnMutedPurpleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.brand,
  },
  btnMutedRed: {
    backgroundColor: '#fff1f1',
  },
  btnMutedRedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#dc2626',
  },
  btnReceipt: {
    backgroundColor: '#eff0f3',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReceiptText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  segmentBar: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 999,
  },
  // Tasker Nudge Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reminderModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  reminderIconOuter: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f3eeff',
    alignItems: 'center',
    justifyContent: 'center',
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
  shield3d: {
    width: 80,
    height: 80,
  },
  // Tasker Bottom Sheets and Dialog styles
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
  sheetJobCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  sheetJobTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#5a5a70',
  },
  sheetJobPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: '#111122',
  },
  checklist: {
    gap: 16,
    marginVertical: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#5a5a70',
  },
  checkTextActive: {
    color: '#6c3bff',
    fontFamily: 'Geist_600SemiBold',
  },
  checkTextDisabled: {
    color: '#a0a0ba',
  },
  circleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCheckActive: {
    backgroundColor: '#6c3bff',
  },
  circleSelect: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelectActive: {
    borderColor: '#6c3bff',
    backgroundColor: '#ffffff',
  },
  circleInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6c3bff',
  },
  circleSelectDisabled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0ea',
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
  btnNotYet: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnNotYetText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#6c3bff',
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
});

type TaskerJob = {
  id: string;
  title: string;
  price: string;
  clientName: string;
  status: 'active' | 'bid_sent' | 'invitation_received' | 'escrow_pending' | 'completed_reviewed' | 'completed' | 'cancelled';
  category?: 'Remote' | 'Local' | 'Errand';
  timeAgo?: string;
  progressSegments?: { total: number; active: number };
  bidText?: string;
  invitationText?: string;
  customerRating?: number;
  reviewText?: string;
  date?: string;
  cancelReason?: string;
};

const JOBS_FILTER_PILLS = ['All', 'Active', 'Invitations', 'Bids sent', 'Completed', 'Cancelled'];

function TaskerJobsView({ insets, router }: { insets: any; router: any }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<TaskerJob | null>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [completionSheetVisible, setCompletionSheetVisible] = useState(false);
  const [requestSentVisible, setRequestSentVisible] = useState(false);
  const [acceptSheetVisible, setAcceptSheetVisible] = useState(false);
  const [declineSheetVisible, setDeclineSheetVisible] = useState(false);
  const [acceptedSuccessVisible, setAcceptedSuccessVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [jobs, setJobs] = useState<TaskerJob[]>([
    {
      id: '1',
      title: 'Design Flyer for an event',
      price: '₦1,500',
      clientName: 'Sarah K.',
      status: 'active',
      progressSegments: { total: 4, active: 2 },
    },
    {
      id: '2',
      title: 'Design a flyer for event',
      price: '₦1,500',
      clientName: 'Sarah K.',
      status: 'bid_sent',
      category: 'Remote',
      timeAgo: '2mins ago',
      bidText: 'Will deliver 3 design concepts within 24 hours.',
    },
    {
      id: '3',
      title: 'Build a Landing page',
      price: '₦500,000',
      clientName: 'Sarah K.',
      status: 'invitation_received',
      invitationText: 'I loved your portfolio! Can you build this for me?',
    },
    {
      id: '4',
      title: 'Build a Landing page',
      price: '₦500,000',
      clientName: 'Sarah K.',
      status: 'escrow_pending',
      progressSegments: { total: 4, active: 3 },
    },
    {
      id: '5',
      title: 'Print My Assignment',
      price: '+₦1,000',
      clientName: 'Sarah K.',
      status: 'completed_reviewed',
      date: 'May 10, 2026',
      customerRating: 5,
      reviewText: 'Decent job, but slightly late.',
    },
    {
      id: '6',
      title: 'Print My Assignment',
      price: '+₦1,000',
      clientName: 'Sarah K.',
      status: 'completed',
      date: 'May 10, 2026',
    },
    {
      id: '7',
      title: 'Print My Assignment',
      price: '₦1,000',
      clientName: 'Sarah K.',
      status: 'cancelled',
      category: 'Remote',
      date: 'May 12, 2026',
      cancelReason: 'Found someone closer',
    },
  ]);

  const filteredJobs = jobs.filter((job) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return job.status === 'active' || job.status === 'escrow_pending';
    if (activeFilter === 'Invitations') return job.status === 'invitation_received';
    if (activeFilter === 'Bids sent') return job.status === 'bid_sent';
    if (activeFilter === 'Completed') return job.status === 'completed' || job.status === 'completed_reviewed';
    if (activeFilter === 'Cancelled') return job.status === 'cancelled';
    return true;
  });

  const handleDeclineInvitation = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setDeclineSheetVisible(true);
    }
  };

  const handleAcceptInvitation = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setAcceptSheetVisible(true);
    }
  };

  const handleWithdrawBid = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setWithdrawModalVisible(true);
    }
  };

  const handleNudge = () => {
    setReminderModalVisible(true);
    setTimeout(() => {
      setReminderModalVisible(false);
    }, 2500);
  };

  const renderJobCardContent = (job: TaskerJob) => {
    switch (job.status) {
      case 'active':
        return (
          <>
            <View style={styles.jobCardHeader}>
              <View style={styles.jobCardTitleRow}>
                <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
                <CaretRight width={8} height={12} />
              </View>
              <Text style={styles.jobCardPrice}>{job.price}</Text>
            </View>
            <View style={styles.jobCardClientRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.jobCardClient}>{job.clientName}</Text>
            </View>
            {job.progressSegments && (
              <View style={styles.segmentBar}>
                {Array.from({ length: job.progressSegments.total }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.segment,
                      { backgroundColor: i < (job.progressSegments?.active ?? 0) ? COLORS.brand : '#e0e0ea' }
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/chat')}>
                <Text style={styles.btnSecondaryText}>Chat</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => {
                  setSelectedJob(job);
                  setStatusSheetVisible(true);
                }}>
                <Text style={styles.btnPrimaryText}>Update</Text>
              </Pressable>
            </View>
          </>
        );

      case 'bid_sent':
        return (
          <>
            <View style={styles.jobCardHeader}>
              <View style={styles.jobCardTitleRow}>
                <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
                <CaretRight width={8} height={12} />
              </View>
              <Text style={styles.jobCardPrice}>{job.price}</Text>
            </View>
            <View style={styles.jobCardMetaRow}>
              <View style={styles.jobCardMetaItem}>
                <MapPin width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.jobCardMetaText}>{job.category}</Text>
              </View>
              <View style={styles.jobCardMetaItem}>
                <Clock width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.jobCardMetaText}>{job.timeAgo}</Text>
              </View>
              <View style={[styles.tag, styles.tagPending, { marginLeft: 'auto' }]}>
                <Text style={styles.tagPendingText}>Pending</Text>
              </View>
            </View>
            {job.bidText && (
              <View style={styles.textBox}>
                <Text style={styles.textBoxText}>"{job.bidText}"</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.btn, styles.btnMutedPurple]} onPress={() => Alert.alert('Edit Bid', 'Bid edit modal coming soon.')}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.brand} />
                <Text style={styles.btnMutedPurpleText}>Edit bid</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnMutedRed]} onPress={() => handleWithdrawBid(job.id)}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#dc2626" />
                <Text style={styles.btnMutedRedText}>Withdraw Bid</Text>
              </Pressable>
            </View>
          </>
        );

      case 'invitation_received':
        return (
          <>
            <View style={styles.jobCardHeader}>
              <View style={styles.jobCardTitleRow}>
                <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
                <CaretRight width={8} height={12} />
              </View>
              <Text style={styles.jobCardPrice}>{job.price}</Text>
            </View>
            <View style={styles.jobCardClientRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.jobCardClient}>{job.clientName}</Text>
            </View>
            {job.invitationText && (
              <View style={styles.textBox}>
                <Text style={styles.textBoxText}>"{job.invitationText}"</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.btn, styles.btnMutedPurple]} onPress={() => handleDeclineInvitation(job.id)}>
                <MaterialCommunityIcons name="close" size={16} color={COLORS.brand} />
                <Text style={styles.btnMutedPurpleText}>Decline</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => handleAcceptInvitation(job.id)}>
                <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                <Text style={styles.btnPrimaryText}>Accept</Text>
              </Pressable>
            </View>
          </>
        );

      case 'escrow_pending':
        return (
          <>
            <View style={styles.jobCardHeader}>
              <View style={styles.jobCardTitleRow}>
                <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
                <CaretRight width={8} height={12} />
              </View>
              <Text style={styles.jobCardPrice}>{job.price}</Text>
            </View>
            <View style={styles.jobCardClientRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.jobCardClient}>{job.clientName}</Text>
            </View>
            <View style={[styles.statusBanner, styles.statusBannerOrange]}>
              <MaterialCommunityIcons name="lock-outline" size={16} color="#b45309" />
              <Text style={styles.statusBannerTextOrange}>Waiting for customer to fund escrow</Text>
            </View>
            {job.progressSegments && (
              <View style={styles.segmentBar}>
                {Array.from({ length: job.progressSegments.total }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.segment,
                      { backgroundColor: i < (job.progressSegments?.active ?? 0) ? COLORS.brand : '#e0e0ea' }
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/chat')}>
                <MaterialCommunityIcons name="chat-outline" size={16} color={COLORS.brand} />
                <Text style={styles.btnSecondaryText}>Open chat</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnMutedPurple]} onPress={handleNudge}>
                <MaterialCommunityIcons name="bell-outline" size={16} color={COLORS.brand} />
                <Text style={styles.btnMutedPurpleText}>Nudge customer</Text>
              </Pressable>
            </View>
          </>
        );

      case 'completed_reviewed':
        return (
          <>
            <View style={[styles.tag, styles.tagCompleted]}>
              <Text style={styles.tagCompletedText}>Completed · {job.date}</Text>
            </View>
            <View style={styles.jobCardHeader}>
              <Text style={styles.jobCardTitle}>{job.title}</Text>
              <Text style={styles.jobCardPriceGreen}>{job.price}</Text>
            </View>
            <View style={styles.jobCardClientRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.jobCardClient}>{job.clientName}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarAmber key={i} width={14} height={14} />
                ))}
              </View>
              <Text style={styles.ratingLabel}>Customer Rating</Text>
            </View>
            {job.reviewText && (
              <View style={styles.textBox}>
                <Text style={styles.textBoxText}>"{job.reviewText}"</Text>
              </View>
            )}
            <Pressable style={styles.btnReceipt} onPress={() => router.push('/receipt')}>
              <Text style={styles.btnReceiptText}>View Receipt</Text>
            </Pressable>
          </>
        );

      case 'completed':
        return (
          <>
            <View style={[styles.tag, styles.tagCompleted]}>
              <Text style={styles.tagCompletedText}>Completed · {job.date}</Text>
            </View>
            <View style={styles.jobCardHeader}>
              <Text style={styles.jobCardTitle}>{job.title}</Text>
              <Text style={styles.jobCardPriceGreen}>{job.price}</Text>
            </View>
            <View style={styles.jobCardClientRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.jobCardClient}>{job.clientName}</Text>
            </View>
            <Pressable style={styles.btnReceipt} onPress={() => router.push('/receipt')}>
              <Text style={styles.btnReceiptText}>View Receipt</Text>
            </Pressable>
          </>
        );

      case 'cancelled':
        return (
          <>
            <View style={styles.jobCardHeader}>
              <Text style={[styles.jobCardTitle, { textDecorationLine: 'line-through', color: COLORS.textSecondary }]}>
                {job.title}
              </Text>
              <Text style={[styles.jobCardPrice, { textDecorationLine: 'line-through', color: COLORS.textSecondary }]}>
                {job.price}
              </Text>
            </View>
            <View style={styles.jobCardMetaRow}>
              <View style={styles.jobCardMetaItem}>
                <MapPin width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.jobCardMetaText}>{job.category}</Text>
              </View>
              <View style={styles.jobCardMetaItem}>
                <Clock width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.jobCardMetaText}>{job.date}</Text>
              </View>
            </View>
            <View style={[styles.statusBanner, styles.statusBannerRed]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusBannerTextRed}>
                  <Text style={styles.statusBannerTextBold}>Cancelled by customer</Text>
                </Text>
                <Text style={styles.statusBannerSubText}>{job.cancelReason}</Text>
              </View>
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.taskerContainer}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.taskerHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.taskerHeading}>Jobs</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.taskerPillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.taskerPillsScroll}>
          {JOBS_FILTER_PILLS.map((pill) => {
            const active = pill === activeFilter;
            return (
              <Pressable
                key={pill}
                onPress={() => setActiveFilter(pill)}
                style={[styles.taskerPill, active && styles.taskerPillActive]}>
                <Text style={[styles.taskerPillText, active && styles.taskerPillTextActive]}>
                  {pill}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Jobs Feed List */}
      <FlatList<TaskerJob>
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.taskerListScroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={styles.jobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: item.id } })}>
            {renderJobCardContent(item)}
          </Pressable>
        )}
      />
      {/* Reminder Sent Modal (Tasker Only) */}
      <Modal visible={reminderModalVisible} transparent animationType="fade" onRequestClose={() => setReminderModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setReminderModalVisible(false)}>
          <View style={styles.reminderModalBox}>
            <View style={{ position: 'relative', width: 80, height: 80 }}>
              <Image source={SHIELD_IMAGE} style={styles.shield3d} contentFit="contain" />
              <View style={styles.reminderBadge}>
                <Ionicons name="checkmark-sharp" size={12} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.reminderTitle}>Reminder Sent</Text>
            <Text style={styles.reminderSubtitle}>
              We've notified Sarah K.. You'll receive a notification when they respond.
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* Update Job Status Bottom Sheet (Tasker Only) */}
      <Modal visible={statusSheetVisible && selectedJob !== null} transparent animationType="slide" onRequestClose={() => setStatusSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setStatusSheetVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => { }}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Job Status</Text>

            {/* Job Details Card inside Sheet */}
            <View style={styles.sheetJobCard}>
              <Text style={styles.sheetJobTitle}>{selectedJob?.title}</Text>
              <Text style={styles.sheetJobPrice}>{selectedJob?.price}</Text>
            </View>

            {/* Checklist Items */}
            <View style={styles.checklist}>
              {/* Step 1: Accepted */}
              <View style={styles.checkRow}>
                <View style={[styles.circleCheck, styles.circleCheckActive]}>
                  <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                </View>
                <Text style={styles.checkText}>Accepted</Text>
              </View>

              {/* Step 2: Escrow Funded */}
              <View style={styles.checkRow}>
                <View style={[styles.circleCheck, styles.circleCheckActive]}>
                  <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                </View>
                <Text style={styles.checkText}>Escrow Funded</Text>
              </View>

              {/* Step 3: Start Task / Task Started */}
              <View style={styles.checkRow}>
                {(selectedJob?.progressSegments?.active ?? 2) > 2 ? (
                  <View style={[styles.circleCheck, styles.circleCheckActive]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                  </View>
                ) : (
                  <View style={[styles.circleSelect, styles.circleSelectActive]}>
                    <View style={styles.circleInnerDot} />
                  </View>
                )}
                <Text style={[styles.checkText, (selectedJob?.progressSegments?.active ?? 2) === 2 && styles.checkTextActive]}>
                  {(selectedJob?.progressSegments?.active ?? 2) > 2 ? 'Task Started' : 'Start task'}
                </Text>
              </View>

              {/* Step 4: Mark as completed */}
              <View style={styles.checkRow}>
                {(selectedJob?.progressSegments?.active ?? 2) === 4 ? (
                  <View style={[styles.circleCheck, styles.circleCheckActive]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                  </View>
                ) : (selectedJob?.progressSegments?.active ?? 2) === 3 ? (
                  <View style={[styles.circleSelect, styles.circleSelectActive]}>
                    <View style={styles.circleInnerDot} />
                  </View>
                ) : (
                  <View style={styles.circleSelectDisabled} />
                )}
                <Text style={[
                  styles.checkText,
                  (selectedJob?.progressSegments?.active ?? 2) === 4 && styles.checkTextActive,
                  (selectedJob?.progressSegments?.active ?? 2) === 2 && styles.checkTextDisabled
                ]}>
                  Mark as completed
                </Text>
              </View>
            </View>

            {/* Bottom Button in Sheet */}
            {(selectedJob?.progressSegments?.active ?? 2) === 2 ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                onPress={() => {
                  if (selectedJob) {
                    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, progressSegments: { ...j.progressSegments!, active: 3 } } : j));
                    setSelectedJob(prev => prev ? { ...prev, progressSegments: { ...prev.progressSegments!, active: 3 } } : null);
                  }
                }}>
                <Text style={styles.sheetButtonText}>Start Task</Text>
              </Pressable>
            ) : (selectedJob?.progressSegments?.active ?? 2) === 3 ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639' }]}
                onPress={() => {
                  setStatusSheetVisible(false);
                  setCompletionSheetVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Task Started</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639', opacity: 0.6 }]}
                disabled>
                <Text style={styles.sheetButtonText}>Task Completed</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Update Completion Bottom Sheet (Tasker Only) */}
      <Modal visible={completionSheetVisible && selectedJob !== null} transparent animationType="slide" onRequestClose={() => setCompletionSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCompletionSheetVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => { }}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Completion</Text>
            <Text style={styles.sheetSubtitle}>
              Once you request completion, the customer will be notified to review and confirm the work. Payment will be released from escrow after confirmation.
            </Text>

            {/* Job Details Card inside Sheet */}
            <View style={styles.sheetJobCard}>
              <Text style={styles.sheetJobTitle}>{selectedJob?.title}</Text>
              <Text style={styles.sheetJobPrice}>{selectedJob?.price}</Text>
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
                if (selectedJob) {
                  setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'completed', progressSegments: { ...j.progressSegments!, active: 4 } } : j));
                }
                setRequestSentVisible(false);
              }}>
              <Text style={styles.dialogButtonText}>Okay</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Decline Invitation Modal */}
      <Modal visible={declineSheetVisible && selectedJob !== null} transparent animationType="fade" onRequestClose={() => setDeclineSheetVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDeclineSheetVisible(false)}>
          <View style={styles.successDialog}>
            <Text style={styles.dialogTitle}>Decline Invitation?</Text>
            <Text style={styles.dialogSubtitle}>
              Are you sure you want to decline "{selectedJob?.title}" from Musa K.? This can't be undone.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
              onPress={() => {
                if (selectedJob) {
                  setJobs((prev) => prev.filter((job) => job.id !== selectedJob.id));
                }
                setDeclineSheetVisible(false);
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
      <Modal visible={acceptSheetVisible && selectedJob !== null} transparent animationType="fade" onRequestClose={() => setAcceptSheetVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAcceptSheetVisible(false)}>
          <View style={styles.successDialog}>
            <Text style={styles.dialogTitle}>Accept Invitation?</Text>
            <Text style={styles.dialogSubtitle}>
              You'll be hired for "Build a landing page" by Sarah K.. You can start chatting immediately after.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#18A962' }]}
              onPress={() => {
                if (selectedJob) {
                  setJobs((prev) =>
                    prev.map((job) =>
                      job.id === selectedJob.id ? { ...job, status: 'escrow_pending', progressSegments: { total: 4, active: 3 } } : job
                    )
                  );
                }
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
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => { }}>
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
                setActiveFilter('Active');
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

      {/* Withdraw Bid Modal */}
      <Modal visible={withdrawModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setWithdrawModalVisible(false)}>
          <View style={styles.successDialog}>
            <Text style={styles.dialogTitle}>Withdraw Bid?</Text>
            <Text style={styles.dialogSubtitle}>
              Are you sure you want to withdraw your bid for "{selectedJob?.title || 'Print my assignment'}"? You can't undo this.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
              onPress={() => {
                if (selectedJob) {
                  setJobs((prev) => prev.filter((job) => job.id !== selectedJob.id));
                }
                setWithdrawModalVisible(false);
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
    </View>
  );
}

