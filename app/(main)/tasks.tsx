import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
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

import NavPlus from '@/assets/icons/nav-plus.svg';
import { HireAgainModal } from '@/components/taskhub/hire-again-modal';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import {
  CompletedTaskCard,
  InProgressTaskCard,
  SAMPLE_COMPLETED_TASKS,
  SAMPLE_IN_PROGRESS_TASKS,
  TaskCard,
} from '@/components/taskhub/task-card';
import { useTasks } from '@/context/TaskContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

type TaskTab = 'posted' | 'in_progress' | 'completed';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<TaskTab>('posted');
  const { tasks } = useTasks();
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [selectedTaskerName, setSelectedTaskerName] = useState('');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedTaskerAvatar, setSelectedTaskerAvatar] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedTasks, setCompletedTasks] = useState(SAMPLE_COMPLETED_TASKS);

  const handleReviewSubmit = (rating: number, comment: string) => {
    setCompletedTasks((prev) =>
      prev.map((t) => (t.id === selectedTaskId ? { ...t, reviewStatus: 'reviewed' } : t))
    );
    setRateModalVisible(false);
  };

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
          showsVerticalScrollIndicator={false}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => router.push({ pathname: '/task-details', params: { taskId: task.id } })}
            />
          ))}
        </ScrollView>

        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}>
          {SAMPLE_IN_PROGRESS_TASKS.length > 0 ? (
            SAMPLE_IN_PROGRESS_TASKS.map((task) => (
              <InProgressTaskCard
                key={task.id}
                task={task}
                onPress={() => router.push({ pathname: '/track-task', params: { taskId: task.id } })}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tasks in progress.</Text>
            </View>
          )}
        </ScrollView>

        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}>
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onPress={() => router.push({ pathname: '/task-details', params: { taskId: task.id } })}
                onHireAgain={() => {
                  setSelectedTaskerName(task.tasker.name);
                  setHireModalVisible(true);
                }}
                onLeaveReview={() => {
                  setSelectedTaskId(task.id);
                  setSelectedTaskerName(task.tasker.name);
                  setSelectedTaskerAvatar(task.tasker.avatar);
                  setRateModalVisible(true);
                }}
                onReceipt={() => {
                  // Mock receipt action
                }}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No completed tasks yet.</Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>

      <HireAgainModal
        visible={hireModalVisible}
        onClose={() => setHireModalVisible(false)}
        taskerName={selectedTaskerName}
      />

      <RateTaskerModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        taskerName={selectedTaskerName}
        taskerAvatar={selectedTaskerAvatar}
        onSubmit={handleReviewSubmit}
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
  empty: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
});
