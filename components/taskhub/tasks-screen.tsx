import { taskIsAvailable } from '@/lib/task-deadline';
import { TaskFilters } from '@/components/taskhub/task-filters';
import { emptyTaskFilters, filterTask, hasTaskFilters, historyStatus, HISTORY_STATUSES, matchesTaskFilters, taskCategoryOptions, type FilterTask } from '@/lib/task-filters';
import { taskCategoryLabel } from '@/lib/task-presentation';
import { uniqueTaskerOffers, isHireInvitation, confirmHireInData } from '@/lib/task-lifecycle';
import { nudgeCustomer } from '@/lib/api/task-nudge';
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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CaretRight from '@/assets/icons/caret-right.svg';
import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import NavPlus from '@/assets/icons/nav-plus.svg';
import StarAmber from '@/assets/icons/star-amber.svg';
import { HireAgainModal } from '@/components/taskhub/hire-again-modal';
import { useNewPost } from '@/hooks/use-new-post';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import {
  CompletedTaskCard,
  InProgressTaskCard,
  TaskCard,
} from '@/components/taskhub/task-card';
import {
  queryKeys,
  useTaskerBids,
  useTaskerTasks,
  useUserTasks,
  useUserTasksByStatuses,
} from '@/lib/api/queries';
import { deleteBid, respondToHireRequest, updateBid, type TaskerBid } from '@/lib/api/bids';
import { createOrGetConversation } from '@/lib/api/chat';
import {
  submitTaskerCompletion,
  formatNaira,
  formatRelativeTime,
  formatShortDate,
  formatLongDate,
  rateClient,
  rateTask,
  startTaskerTask,
  taskToCard,
  taskToCompletedCard,
  taskToInProgressCard,
  type Task,
} from '@/lib/api/tasks';
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

export default function TasksScreen({ history = false }: { history?: boolean } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startNewPost = useNewPost();
  const { accountType } = useAuth();
  const isTasker = accountType === 'tasker';
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<'posted' | 'in_progress'>('posted');
  const [filters, setFilters] = useState(emptyTaskFilters);
  const queryClient = useQueryClient();
  const posted = useUserTasks({ status: 'open' }, !isTasker && !history);
  const inProgress = useUserTasksByStatuses(['assigned', 'in-progress', 'awaiting-confirmation'], !isTasker && !history);
  const completed = useUserTasks({ status: 'completed' }, !isTasker && history);
  const closed = useUserTasks({ status: 'closed' }, !isTasker && history);
  const cancelled = useUserTasks({ status: 'cancelled', limit: 100 }, !isTasker && history);
  const historyTasks = [...new Map([...(completed.data?.tasks ?? []), ...(closed.data?.tasks ?? []), ...(cancelled.data?.tasks ?? [])].map(task => [task._id, task])).values()].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filteredHistory = historyTasks.filter(task => matchesTaskFilters(task, filters));
  const [reviewTask, setReviewTask] = useState<{ id: string; taskerName: string; taskerAvatar: string } | null>(null);
  const [hireTaskerName, setHireTaskerName] = useState<string | null>(null);
  const rateMutation = useMutation({
    mutationFn: (v: { id: string; rating: number; reviewText: string }) => rateTask(v.id, { rating: v.rating, reviewText: v.reviewText || undefined }),
    onSuccess: () => { setReviewTask(null); queryClient.invalidateQueries({ queryKey: ['tasks'] }); Alert.alert('Thanks!', 'Your review has been submitted.'); },
    onError: (err) => Alert.alert('Could not submit review', err instanceof Error ? err.message : 'Please try again.'),
  });
  const openTask = (id: string) => router.push({ pathname: '/task-details', params: { id } });
  const goTab = (next: 'posted' | 'in_progress') => { setTab(next); pagerRef.current?.scrollTo({ x: next === 'posted' ? 0 : SCREEN_WIDTH, animated: true }); };
  const refreshControl = (onRefresh: () => void, refreshing: boolean) => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} colors={[COLORS.brand]} />;
  const historyQueries = [completed, closed, cancelled];
  const refreshHistory = () => { historyQueries.forEach(query => { void query.refetch(); }); };
  if (isTasker) return <TaskerJobsView key={history ? 'history' : 'current'} history={history} insets={insets} router={router} />;
  return <View style={styles.container}>
    <StatusBar style="dark" />
    <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        {history && <Pressable accessibilityRole="button" accessibilityLabel="Back to My Tasks" hitSlop={8} onPress={() => router.canGoBack() ? router.back() : router.replace('/tasks')} style={{ paddingRight: 12 }}><Ionicons name="arrow-back" size={23} color={COLORS.textPrimary} /></Pressable>}
        <Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{history ? 'Task history' : 'My Tasks'}</Text>
        {!history && <Pressable accessibilityRole="button" accessibilityLabel="Post a task" style={styles.plus} hitSlop={8} onPress={() => startNewPost()}><NavPlus width={20} height={20} /></Pressable>}
      </View>
      {!history && <>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(['posted','in_progress'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} style={[styles.tab, tab === value && styles.tabActive]} onPress={() => goTab(value)}><Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === 'posted' ? 'Posted' : 'In progress'}</Text></Pressable>)}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/task-history')} style={filterStyles.historyLink}><Ionicons name="time-outline" size={18} color={COLORS.brand} /><Text style={filterStyles.historyText}>Task history</Text><Ionicons name="arrow-forward" size={17} color={COLORS.brand} /></Pressable>
      </>}
    </View>
    {history ? <>
      <TaskFilters value={filters} onChange={setFilters} categories={taskCategoryOptions(historyTasks)} statuses={HISTORY_STATUSES} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} refreshControl={refreshControl(refreshHistory, historyQueries.some(query => query.isRefetching))}>
        {historyQueries.some(query => query.isError) && historyTasks.length > 0 && <Pressable onPress={refreshHistory}><Text style={styles.errorText}>Could not refresh all history. Tap to retry.</Text></Pressable>}
        {historyQueries.some(query => query.isLoading) && !historyTasks.length ? <StateView mode="loading" /> : historyQueries.some(query => query.isError) && !historyTasks.length ? <StateView mode="error" onRetry={refreshHistory} /> : !filteredHistory.length ? <StateView mode="empty" emptyText={hasTaskFilters(filters) ? 'No tasks match these filters. Clear filters to see your history.' : 'Completed, closed and cancelled tasks will appear here.'} /> : filteredHistory.map(task => {
          if (task.status === 'completed') {
            const card = taskToCompletedCard(task);
            return <CompletedTaskCard key={task._id} task={card} onPress={() => openTask(task._id)} onHireAgain={() => setHireTaskerName(card.tasker.name)} onLeaveReview={() => setReviewTask({ id: task._id, taskerName: card.tasker.name, taskerAvatar: card.tasker.avatar })} onReceipt={() => router.push({ pathname: '/receipt', params: { id: task._id } })} />;
          }
          return <View key={task._id} style={{ gap: 6 }}><Text style={task.status === 'cancelled' ? styles.cancelledBadge : filterStyles.closedLabel}>{task.status === 'cancelled' ? 'Cancelled' : 'Closed'}</Text><TaskCard task={taskToCard(task)} onPress={() => openTask(task._id)} />{task.status === 'cancelled' && <Text style={styles.cancelledReason}>Reason: {task.cancellationReason?.trim() || 'No reason provided'}</Text>}</View>;
        })}
      </ScrollView>
    </> : <ScrollView ref={pagerRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={event => setTab(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH) === 0 ? 'posted' : 'in_progress')} style={styles.flex}>
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 180 }]} refreshControl={refreshControl(posted.refetch, posted.isRefetching)}>
        {posted.isLoading ? <StateView mode="loading" /> : posted.isError ? <StateView mode="error" onRetry={posted.refetch} /> : !(posted.data?.tasks ?? []).length ? <StateView mode="empty" emptyText="No posted tasks yet." /> : (posted.data?.tasks ?? []).map(task => <TaskCard key={task._id} task={taskToCard(task)} onPress={() => openTask(task._id)} />)}
      </ScrollView>
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 180 }]} refreshControl={refreshControl(() => { void inProgress.refetch(); }, inProgress.isRefetching)}>
        {inProgress.isLoading ? <StateView mode="loading" /> : inProgress.isError ? <StateView mode="error" onRetry={inProgress.refetch} /> : !inProgress.tasks.length ? <StateView mode="empty" emptyText="No tasks in progress." /> : inProgress.tasks.map(task => <InProgressTaskCard key={task._id} task={taskToInProgressCard(task)} onPress={() => router.push({ pathname: '/track-task', params: { id: task._id } })} />)}
      </ScrollView>
    </ScrollView>}
    <HireAgainModal visible={hireTaskerName !== null} onClose={() => setHireTaskerName(null)} taskerName={hireTaskerName ?? ''} />
    <RateTaskerModal visible={reviewTask !== null} onClose={() => setReviewTask(null)} taskerName={reviewTask?.taskerName ?? ''} taskerAvatar={reviewTask?.taskerAvatar ?? ''} pending={rateMutation.isPending} onSubmit={(rating, comment) => { if (reviewTask) rateMutation.mutate({ id: reviewTask.id, rating, reviewText: comment }); }} />
  </View>;
}
const filterStyles = StyleSheet.create({
  historyLink: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 14 }, historyText: { flex: 1, color: '#6c3bff', fontFamily: 'Geist_500Medium', fontSize: 14 }, closedLabel: { color: '#5a5a70', fontFamily: 'Geist_600SemiBold', fontSize: 12 },
});

const styles = StyleSheet.create({
  cancelledCard: {
    backgroundColor: COLORS.surface,
    borderColor: '#e0e0ea',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cancelledCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelledBadge: {
    backgroundColor: '#fff1f1',
    color: COLORS.error,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelledBudget: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.textPrimary },
  cancelledTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.textPrimary },
  cancelledReason: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.textSecondary },
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
    gap: 0,
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    paddingHorizontal: 4,
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
    fontSize: 11,
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
  codeInput: {
    borderWidth: 1,
    borderColor: '#e0e0ea',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
    color: '#111122',
  },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#5a5a70',
    marginTop: 14,
    marginBottom: 6,
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#e0e0ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: '#111122',
  },
  sheetInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  jobsEmpty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
    gap: 6,
  },
  jobsEmptyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#111122',
  },
  jobsEmptySubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#5a5a70',
    textAlign: 'center',
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
  /** The underlying task — present on assigned/completed jobs and on bids whose task survived. */
  taskId?: string;
  /** Set on `bid_sent` / `invitation_received` rows; the target of bid mutations. */
  bidId?: string;
  title: string;
  price: string;
  clientName: string;
  status: 'active' | 'bid_sent' | 'invitation_received' | 'escrow_pending' | 'completed_reviewed' | 'completed' | 'cancelled' | 'closed' | 'not_selected' | 'expired';
  category?: string;
  timeAgo?: string;
  progressSegments?: { total: number; active: number };
  bidText?: string;
  invitationText?: string;
  customerRating?: number;
  reviewText?: string;
  date?: string;
  cancelReason?: string;
  /** Raw amount, for pre-filling the edit-bid field. */
  amount?: number;
  clientAvatar?: string;
  /** True once this tasker has rated the client on a completed job. */
  clientRated?: boolean;
  taskStatus?: Task['status'];
  filterTask: FilterTask;
};

function clientNameOf(task?: Task | null): string {
  if (!task || !task.user || typeof task.user === 'string') return 'Client';
  return task.user.fullName || 'Client';
}

/**
 * Progress across the four-step checklist the sheet renders:
 * 1 accepted · 2 escrow funded · 3 task started · 4 completed.
 *
 * A task only reaches the tasker's list once it's `assigned`, and assignment is
 * the same atomic call that funds escrow — so a fresh job is already at step 2.
 */
function segmentsFor(status: Task['status']): { total: number; active: number } {
  if (status === 'completed') return { total: 4, active: 4 };
  if (status === 'awaiting-confirmation') return { total: 4, active: 4 };
  if (status === 'in-progress') return { total: 4, active: 3 };
  return { total: 4, active: 2 };
}

/** Assigned/completed/cancelled work → job cards. */
function taskToJob(task: Task): TaskerJob {
  const base = {
    id: `task-${task._id}`,
    filterTask: task,
    category: taskCategoryLabel(task),
    taskId: task._id,
    title: task.title,
    clientName: clientNameOf(task),
    clientAvatar:
      task.user && typeof task.user !== 'string' ? task.user.profilePicture : undefined,
    amount: task.budget,
    taskStatus: task.status,
  };

  if (task.status === 'completed') {
    return {
      ...base,
      // Credit framing: completion is when escrow is released to the tasker.
      price: `+${formatNaira(task.budget)}`,
      status: task.rating ? 'completed_reviewed' : 'completed',
      date: formatLongDate(task.completedAt ?? task.updatedAt),
      customerRating: task.rating ?? undefined,
      reviewText: task.reviewText ?? undefined,
      clientRated: Boolean(task.clientRating),
      progressSegments: segmentsFor(task.status),
    };
  }

  if (task.status === 'cancelled' || task.status === 'closed') {
    return {
      ...base,
      price: formatNaira(task.budget),
      status: task.status,
      date: formatLongDate(task.updatedAt),
      // The backend stores no cancellation reason, so the card omits it rather
      // than inventing one.
    };
  }

  return {
    ...base,
    price: formatNaira(task.budget),
    status: 'active',
    progressSegments: segmentsFor(task.status),
  };
}

/** Pending bids → "bids sent" and "invitations" cards. */
function bidToJob(bid: TaskerBid): TaskerJob | null {
  if (!bid.task) return null;
  const invitation = isHireInvitation(bid);
  return {
    id: `bid-${bid._id}`,
    filterTask: bid,
    category: taskCategoryLabel(bid.task),
    date: formatLongDate(bid.createdAt),
    bidId: bid._id,
    taskId: bid.task._id,
    title: bid.task.title,
    price: formatNaira(bid.amount),
    clientName: 'Client',
    status: historyStatus(bid) === 'expired' ? 'expired' : historyStatus(bid) === 'not-selected' ? 'not_selected' : historyStatus(bid) === 'closed' ? 'closed' : historyStatus(bid) === 'cancelled' ? 'cancelled' : historyStatus(bid) === 'completed' ? 'completed' : invitation ? bid.taskerConfirmed ? 'escrow_pending' : 'invitation_received' : 'bid_sent',
    timeAgo: formatRelativeTime(bid.createdAt),
    bidText: invitation ? undefined : bid.message || undefined,
    invitationText: invitation ? bid.message || 'You have been invited to this task.' : undefined,
    amount: bid.amount,
  };
}


function TaskerJobsView({ insets, router, history }: { insets: any; router: any; history: boolean }) {
  const [tab, setTab] = useState<'pending' | 'in_progress'>('pending');
  const [filters, setFilters] = useState(emptyTaskFilters);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<TaskerJob | null>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [completionSheetVisible, setCompletionSheetVisible] = useState(false);
  const [requestSentVisible, setRequestSentVisible] = useState(false);
  const [acceptSheetVisible, setAcceptSheetVisible] = useState(false);
  const [declineSheetVisible, setDeclineSheetVisible] = useState(false);
  const [acceptedSuccessVisible, setAcceptedSuccessVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [editBidVisible, setEditBidVisible] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [completionNote, setCompletionNote] = useState('');

  const queryClient = useQueryClient();
  const assigned = useTaskerTasks();
  const bids = useTaskerBids(history ? undefined : 'pending');

  const jobs: TaskerJob[] = [
    ...(assigned.data?.tasks ?? []).map(taskToJob),
    ...uniqueTaskerOffers(bids.data?.bids ?? []).filter((bid) => !(assigned.data?.tasks ?? []).some((task) => task._id === bid.task?._id)).map(bidToJob).filter((j): j is TaskerJob => j !== null),
  ];

  const loading = assigned.isLoading || bids.isLoading;
  const failed = assigned.isError || bids.isError;

  /** Both lists back this screen, so every mutation refreshes both. */
  const refreshJobs = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'tasker'] });
    queryClient.invalidateQueries({ queryKey: ['bids', 'tasker'] });
  };

  const onRefresh = () => {
    assigned.refetch();
    bids.refetch();
  };

  const showError = (e: unknown, fallback: string) =>
    Alert.alert('Something went wrong', e instanceof Error ? e.message : fallback);

  const startMutation = useMutation({
    mutationFn: (taskId: string) => startTaskerTask(taskId),
    onSuccess: () => {
      refreshJobs();
      Alert.alert(
        'Task started',
        'Submit the finished work when it is ready. Payment remains in escrow until the customer confirms completion.',
      );
    },
    onError: (e) => showError(e, 'Could not start the task.'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ taskId, note }: { taskId: string; note: string }) =>
      submitTaskerCompletion(taskId, note),
    onSuccess: () => {
      refreshJobs();
      queryClient.invalidateQueries({ queryKey: queryKeys.taskerBalance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskerTransactions() });
      setCompletionSheetVisible(false);
      setCompletionNote('');
      setRequestSentVisible(true);
    },
    onError: (e) => showError(e, 'Could not submit the completed work.'),
  });

  const hireResponseMutation = useMutation({
    mutationFn: ({ bidId, action }: { bidId: string; action: 'accept' | 'decline' }) =>
      respondToHireRequest(bidId, action),
    onSuccess: (_data, variables) => {
      if (variables.action === 'accept') {
        const taskId = jobs.find((job) => job.bidId === variables.bidId)?.taskId;
        queryClient.setQueriesData({ queryKey: ['bids', 'tasker'] }, (data: unknown) => confirmHireInData(data, variables.bidId, taskId));
      }
      refreshJobs();
      setAcceptSheetVisible(false);
      setDeclineSheetVisible(false);
      if (variables.action === 'accept') setAcceptedSuccessVisible(true);
    },
    onError: (e) => showError(e, 'Could not respond to the hire request.'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (bidId: string) => deleteBid(bidId),
    onSuccess: () => {
      refreshJobs();
      setWithdrawModalVisible(false);
    },
    onError: (e) => showError(e, 'Could not withdraw the bid.'),
  });

  const editBidMutation = useMutation({
    mutationFn: ({ bidId, amount, message }: { bidId: string; amount?: number; message?: string }) =>
      updateBid(bidId, { amount, message }),
    onSuccess: () => {
      refreshJobs();
      setEditBidVisible(false);
    },
    onError: (e) => showError(e, 'Could not update the bid.'),
  });

  const openChatMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string; clientName: string }) =>
      createOrGetConversation({ taskId }),
    onSuccess: (res, variables) => {
      const conv = res.conversation;
      const chatName = conv.user?.fullName || variables.clientName || 'Client';
      router.push({ pathname: '/chat', params: { id: conv._id, name: chatName } });
    },
    onError: (e) => showError(e, 'Could not open the chat.'),
  });

  const openChat = (job: TaskerJob) => {
    if (!job.taskId) {
      showError(new Error('This job is no longer linked to a task.'), 'Could not open the chat.');
      return;
    }
    openChatMutation.mutate({ taskId: job.taskId, clientName: job.clientName });
  };

  const [rateClientJob, setRateClientJob] = useState<TaskerJob | null>(null);

  const rateClientMutation = useMutation({
    mutationFn: ({ taskId, rating, reviewText }: { taskId: string; rating: number; reviewText?: string }) =>
      rateClient(taskId, { rating, reviewText }),
    onSuccess: () => {
      setRateClientJob(null);
      refreshJobs();
      Alert.alert('Thanks!', 'Your review of the client has been submitted.');
    },
    onError: (e) => showError(e, 'Could not submit the review.'),
  });


  const relevantJobs = jobs.filter(job => history ? !!historyStatus(job.filterTask) : !historyStatus(job.filterTask) && (tab === 'in_progress' ? job.status === 'active' : ['bid_sent','invitation_received','escrow_pending'].includes(job.status)));
  const filteredJobs = relevantJobs.filter(job => matchesTaskFilters(job.filterTask, filters));

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

  const handleEditBid = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setEditAmount(job.amount != null ? String(job.amount) : '');
      setEditMessage(job.bidText ?? '');
      setEditBidVisible(true);
    }
  };

  const nudge = useMutation({
    mutationFn: (taskId: string) => nudgeCustomer(taskId),
    onSuccess: () => { setReminderModalVisible(true); queryClient.invalidateQueries({ queryKey: ['chat'] }); },
    onError: (error) => showError(error, 'Could not send the reminder.'),
  });
  const handleNudge = (job: TaskerJob) => {
    if (!job.taskId || nudge.isPending) return;
    nudge.mutate(job.taskId);
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
            {job.taskStatus === 'awaiting-confirmation' ? <Text style={styles.jobCardClient}>Work submitted. Awaiting customer review.</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => openChat(job)}>
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
                <Text style={styles.tagPendingText}>{filterTask(job.filterTask).biddingClosed ? 'Bidding ended' : 'Pending'}</Text>
              </View>
            </View>
            {job.bidText && (
              <View style={styles.textBox}>
                <Text style={styles.textBoxText}>&ldquo;{job.bidText}&rdquo;</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable disabled={!taskIsAvailable({ ...filterTask(job.filterTask), status: filterTask(job.filterTask).status || '' })} style={[styles.btn, styles.btnMutedPurple]} onPress={() => handleEditBid(job.id)}>
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
        if (!taskIsAvailable({ ...filterTask(job.filterTask), status: filterTask(job.filterTask).status || '' })) return <View style={{ gap: 8 }}><Text style={styles.jobCardTitle}>{job.title}</Text><Text style={styles.jobCardPrice}>{job.price}</Text><Text style={styles.textBoxText}>Bidding ended. This invitation can no longer be accepted.</Text></View>;
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
                <Text style={styles.textBoxText}>&ldquo;{job.invitationText}&rdquo;</Text>
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
              <Text style={styles.statusBannerTextOrange}>Hire request accepted. Awaiting customer confirmation</Text>
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
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => openChat(job)}>
                <MaterialCommunityIcons name="chat-outline" size={16} color={COLORS.brand} />
                <Text style={styles.btnSecondaryText}>Open chat</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnMutedPurple]} onPress={() => handleNudge(job)} disabled={nudge.isPending}>
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
                <Text style={styles.textBoxText}>&ldquo;{job.reviewText}&rdquo;</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              {!job.clientRated && (
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => setRateClientJob(job)}>
                  <Text style={styles.btnSecondaryText}>Rate client</Text>
                </Pressable>
              )}
              <Pressable style={[styles.btn, styles.btnReceipt]} onPress={() => router.push({ pathname: '/receipt', params: { id: job.taskId } })}>
                <Text style={styles.btnReceiptText}>View Receipt</Text>
              </Pressable>
            </View>
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
            <View style={styles.buttonRow}>
              {!job.clientRated && (
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => setRateClientJob(job)}>
                  <Text style={styles.btnSecondaryText}>Rate client</Text>
                </Pressable>
              )}
              <Pressable style={[styles.btn, styles.btnReceipt]} onPress={() => router.push({ pathname: '/receipt', params: { id: job.taskId } })}>
                <Text style={styles.btnReceiptText}>View Receipt</Text>
              </Pressable>
            </View>
          </>
        );

      case 'closed':
      case 'expired':
      case 'not_selected':
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
                  <Text style={styles.statusBannerTextBold}>{job.status === 'expired' ? 'Expired' : job.status === 'closed' ? 'Closed' : job.status === 'not_selected' ? 'Not selected' : 'Cancelled'}</Text>
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
      <View style={[styles.taskerHeader, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {history && <Pressable accessibilityRole="button" accessibilityLabel="Back to Jobs" hitSlop={8} onPress={() => router.canGoBack() ? router.back() : router.replace('/tasks')}><Ionicons name="arrow-back" size={23} color={COLORS.textPrimary} /></Pressable>}
          <Text accessibilityRole="header" style={styles.taskerHeading}>{history ? 'Job history' : 'Jobs'}</Text>
        </View>
        {!history && <>
          <View accessibilityRole="tablist" style={[styles.tabs, { marginTop: 16 }]}>{(['pending','in_progress'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => { setTab(value); setFilters(emptyTaskFilters()); }} style={[styles.tab, tab === value && styles.tabActive]}><Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === 'pending' ? 'Pending' : 'In progress'}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/task-history')} style={filterStyles.historyLink}><Ionicons name="time-outline" size={18} color={COLORS.brand} /><Text style={filterStyles.historyText}>Job history</Text><Ionicons name="arrow-forward" size={17} color={COLORS.brand} /></Pressable>
        </>}
      </View>
      {(history || tab === 'pending') && <TaskFilters key={history ? 'history' : 'pending'} value={filters} onChange={setFilters} pending={!history} categories={taskCategoryOptions(relevantJobs.map(job => job.filterTask))} statuses={[...HISTORY_STATUSES, { value: 'not-selected', label: 'Not selected' }, { value: 'expired', label: 'Expired' }]} />}

      {/* Jobs Feed List */}
      <FlatList<TaskerJob>
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.taskerListScroll, { paddingBottom: insets.bottom + (history ? 40 : 180) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={assigned.isRefetching || bids.isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.brand}
            colors={[COLORS.brand]}
          />
        }
        ListHeaderComponent={failed && jobs.length > 0 ? <Pressable onPress={onRefresh} style={{ paddingBottom: 12 }}><Text style={styles.errorText}>Could not refresh all jobs. Tap to retry.</Text></Pressable> : null}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={COLORS.brand} />
          ) : (
            <View style={styles.jobsEmpty}>
              <Text style={styles.jobsEmptyTitle}>
                {failed ? 'Could not load your jobs' : 'Nothing here yet'}
              </Text>
              <Text style={styles.jobsEmptySubtitle}>
                {failed
                  ? 'Pull down to try again.'
                  : hasTaskFilters(filters) ? 'No jobs match these filters. Clear filters to see all results.' : history ? 'Completed, closed and cancelled work will appear here.' : 'Browse Discover to find work and place your first bid.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.jobCard}
            onPress={() =>
              item.taskId && router.push({ pathname: '/task-details', params: { id: item.taskId } })
            }>
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
              Your reminder was sent to the customer in chat.
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
                  {selectedJob?.taskStatus === 'awaiting-confirmation' ? 'Work submitted for review' : 'Submit completed work'}
                </Text>
              </View>
            </View>

            {/* Bottom Button in Sheet */}
            {(selectedJob?.progressSegments?.active ?? 2) === 2 ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                disabled={startMutation.isPending}
                onPress={() => {
                  if (selectedJob?.taskId) {
                    startMutation.mutate(selectedJob.taskId, {
                      onSuccess: () => setStatusSheetVisible(false),
                    });
                  }
                }}>
                {startMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.sheetButtonText}>Start Task</Text>
                )}
              </Pressable>
            ) : selectedJob?.taskStatus === 'in-progress' ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639' }]}
                onPress={() => {
                  setStatusSheetVisible(false);
                  setCompletionSheetVisible(true);
                }}>
                <Text style={styles.sheetButtonText}>Submit Completed Work</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639', opacity: 0.6 }]}
                disabled>
                <Text style={styles.sheetButtonText}>{selectedJob?.taskStatus === 'awaiting-confirmation' ? 'Awaiting Customer Confirmation' : 'Task Completed'}</Text>
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
            <Text style={styles.sheetTitle}>Submit Completed Work</Text>
            <Text style={styles.sheetSubtitle}>
              Tell the customer what was completed. They will review it and confirm before escrow
              is released.
            </Text>

            {/* Job Details Card inside Sheet */}
            <View style={styles.sheetJobCard}>
              <Text style={styles.sheetJobTitle}>{selectedJob?.title}</Text>
              <Text style={styles.sheetJobPrice}>{selectedJob?.price}</Text>
            </View>

            <TextInput
              style={styles.codeInput}
              value={completionNote}
              onChangeText={setCompletionNote}
              placeholder="What did you complete?"
              placeholderTextColor="#9a9ab0"
              multiline
              maxLength={1000}
              autoFocus
            />

            {/* Buttons */}
            <Pressable
              style={[
                styles.sheetButton,
                { backgroundColor: COLORS.brand },
                completeMutation.isPending && { opacity: 0.5 },
              ]}
              disabled={completeMutation.isPending}
              onPress={() => {
                if (selectedJob?.taskId) {
                  completeMutation.mutate({ taskId: selectedJob.taskId, note: completionNote });
                }
              }}>
              {completeMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sheetButtonText}>Submit for confirmation</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.btnNotYet}
              onPress={() => {
                setCompletionSheetVisible(false);
                setCompletionNote('');
              }}>
              <Text style={styles.btnNotYetText}>Not Yet</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Request Sent Dialog (Tasker Only) */}
      <Modal visible={requestSentVisible} transparent animationType="fade" onRequestClose={() => setRequestSentVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRequestSentVisible(false)}>
          <View style={styles.successDialog}>
            <Text style={styles.dialogTitle}>Work Submitted</Text>
            <Text style={styles.dialogSubtitle}>
              The customer has been notified. Payment remains in escrow until they confirm the work.
            </Text>
            <Pressable
              style={styles.dialogButton}
              onPress={() => setRequestSentVisible(false)}>
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
              Are you sure you want to decline &ldquo;{selectedJob?.title}&rdquo; from {selectedJob?.clientName}? This can&apos;t be undone.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
              disabled={hireResponseMutation.isPending}
              onPress={() => {
                if (selectedJob?.bidId) {
                  hireResponseMutation.mutate({ bidId: selectedJob.bidId, action: 'decline' });
                }
              }}>
              {hireResponseMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sheetButtonText}>Yes, Decline</Text>
              )}
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
              You&apos;ll agree to do &quot;{selectedJob?.title}&quot; for {selectedJob?.clientName}.
              They still have to pay before the job becomes active.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#18A962' }]}
              disabled={hireResponseMutation.isPending}
              onPress={() => {
                if (selectedJob?.bidId) {
                  hireResponseMutation.mutate({ bidId: selectedJob.bidId, action: 'accept' });
                }
              }}>
              {hireResponseMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sheetButtonText}>Yes, Accept</Text>
              )}
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
              {selectedJob?.title
                ? `"${selectedJob.title}" moves to In progress once ${selectedJob.clientName} confirms the hire.`
                : 'The job moves to In progress once the customer confirms the hire.'}
            </Text>

            {/* Steps Container */}
            <View style={styles.stepsContainer}>
              {/* Step 1 */}
              <View style={styles.stepRow}>
                <View style={[styles.stepIconWrap, { backgroundColor: '#f3eeff' }]}>
                  <Ionicons name="play" size={16} color={COLORS.brand} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>Find it in Pending</Text>
                  <Text style={styles.stepSubtitle}>Your accepted invitation stays in Pending until the customer confirms the hire.</Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.stepRow}>
                <View style={[styles.stepIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="chatbubble" size={16} color="#1d4ed8" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>Chat with {selectedJob?.clientName || 'the customer'}</Text>
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
                  <Text style={styles.stepSubtitle}>Once assigned, open In progress to start work and submit your finished task.</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <Pressable
              style={[styles.sheetButton, { backgroundColor: COLORS.brand, marginTop: 16 }]}
              onPress={() => {
                setAcceptedSuccessVisible(false);
                setTab('pending');
              }}>
              <Text style={styles.sheetButtonText}>View pending jobs</Text>
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
              Are you sure you want to withdraw your bid for &quot;{selectedJob?.title}&quot;? You can&apos;t undo this.
            </Text>

            <Pressable
              style={[styles.dialogButton, { backgroundColor: '#ef4444' }]}
              disabled={withdrawMutation.isPending}
              onPress={() => {
                if (selectedJob?.bidId) withdrawMutation.mutate(selectedJob.bidId);
              }}>
              {withdrawMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sheetButtonText}>Yes, Withdraw Bid</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.btnNotYet, { marginTop: 0 }]}
              onPress={() => setWithdrawModalVisible(false)}>
              <Text style={[styles.btnNotYetText, { color: COLORS.brand }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Bid Sheet */}
      <Modal visible={editBidVisible && selectedJob !== null} transparent animationType="slide" onRequestClose={() => setEditBidVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditBidVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => { }}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Bid</Text>

            <View style={styles.sheetJobCard}>
              <Text style={styles.sheetJobTitle}>{selectedJob?.title}</Text>
            </View>

            <Text style={styles.fieldLabel}>Your price (₦)</Text>
            <TextInput
              style={styles.sheetInput}
              value={editAmount}
              onChangeText={(t) => setEditAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9a9ab0"
            />

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.sheetInput, styles.sheetInputMultiline]}
              value={editMessage}
              onChangeText={setEditMessage}
              placeholder="What will you deliver, and when?"
              placeholderTextColor="#9a9ab0"
              multiline
            />

            <Pressable
              style={[
                styles.sheetButton,
                { backgroundColor: COLORS.brand },
                editBidMutation.isPending && { opacity: 0.5 },
              ]}
              disabled={editBidMutation.isPending}
              onPress={() => {
                if (!selectedJob?.bidId) return;
                const amount = editAmount ? Number(editAmount) : undefined;
                editBidMutation.mutate({
                  bidId: selectedJob.bidId,
                  amount,
                  message: editMessage || undefined,
                });
              }}>
              {editBidMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sheetButtonText}>Save changes</Text>
              )}
            </Pressable>

            <Pressable style={styles.btnNotYet} onPress={() => setEditBidVisible(false)}>
              <Text style={styles.btnNotYetText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rate Client Modal */}
      <RateTaskerModal
        visible={rateClientJob !== null}
        onClose={() => setRateClientJob(null)}
        taskerName={rateClientJob?.clientName ?? ''}
        taskerAvatar={rateClientJob?.clientAvatar ?? ''}
        pending={rateClientMutation.isPending}
        onSubmit={(rating, comment) => {
          if (rateClientJob?.taskId) {
            rateClientMutation.mutate({
              taskId: rateClientJob.taskId,
              rating,
              reviewText: comment || undefined,
            });
          }
        }}
      />
    </View>
  );
}
