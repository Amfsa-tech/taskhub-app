import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SAMPLE_TASKS, TaskCard } from '@/components/taskhub/task-card';

const COLORS = {
  textPrimary: '#111122',
  brand: '#6c3bff',
};

export function ActiveTasks({ onTaskPress }: { onTaskPress?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Active Tasks</Text>
        <Pressable hitSlop={8} onPress={() => {}}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {SAMPLE_TASKS.map((task, i) => (
          <TaskCard key={`${task.title}-${i}`} task={task} onPress={onTaskPress} />
        ))}
      </View>
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
});
