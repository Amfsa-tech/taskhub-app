import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { TaskCard } from '@/components/taskhub/task-card';
import { useUserTasks } from '@/lib/api/queries';
import { isActiveTask, taskToCard } from '@/lib/api/tasks';

const COLORS = {
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  error: '#dc2626',
};

export function ActiveTasks({ onTaskPress }: { onTaskPress?: (taskId: string) => void }) {
  const { data, isLoading, isError, refetch, isRefetching } = useUserTasks();

  const activeTasks = (data?.tasks ?? []).filter(isActiveTask);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Active Tasks</Text>
        <Pressable hitSlop={8} onPress={() => {}}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : isError ? (
        <View style={styles.state}>
          <Text style={styles.errorText}>Couldn’t load your tasks.</Text>
          <Pressable hitSlop={8} onPress={() => refetch()} disabled={isRefetching}>
            <Text style={styles.retry}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : activeTasks.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.emptyText}>No active tasks yet. Post one to get started.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {activeTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={taskToCard(task)}
              onPress={() => onTaskPress?.(task._id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  viewAll: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  list: { gap: 12 },
  state: {
    paddingVertical: 24,
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
