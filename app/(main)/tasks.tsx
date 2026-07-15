import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

import NavPlus from '@/assets/icons/nav-plus.svg';
import { HireAgainModal } from '@/components/taskhub/hire-again-modal';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import {
  CompletedTaskCard,
  InProgressTaskCard,
  TaskCard,
} from '@/components/taskhub/task-card';
import { useUserTasks, useUserTasksByStatuses } from '@/lib/api/queries';
import { rateTask, taskToCard, taskToCompletedCard, taskToInProgressCard } from '@/lib/api/tasks';

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
  const [tab, setTab] = useState<TaskTab>('posted');

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
});
