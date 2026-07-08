import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTasks } from '@/context/TaskContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  success: '#15803d',
  successLight: '#f0fdf4',
  border: '#e0e0ea',
};

const DEFAULT_OPEN_TASKS = [
  {
    id: 'sample-open-1',
    title: 'Print My Assignment',
    price: '₦1,000',
    location: 'UI Main gate',
    date: '18 May',
  },
  {
    id: 'sample-open-2',
    title: 'Deliver Package to Lekki',
    price: '₦1,000',
    location: 'Yaba - Lekki',
    date: '18 May',
  },
  {
    id: 'sample-open-3',
    title: 'Design a flyer for event',
    price: '₦1,000',
    location: 'Remote',
    date: '18 May',
  },
  {
    id: 'sample-open-4',
    title: 'Need a Plumber in yaba',
    price: '₦1,000',
    location: 'Yaba Lagos',
    date: '18 May',
  },
];

export default function ChooseExistingTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { taskerName } = useLocalSearchParams<{ taskerName?: string }>();
  const name = taskerName || 'Chioma A.';
  
  const { tasks } = useTasks();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Merge context tasks (posted by user) and sample open tasks for a rich visual selection
  const displayTasks = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      price: t.price,
      location: t.location,
      date: t.date,
    })),
    ...DEFAULT_OPEN_TASKS.filter(
      (def) => !tasks.some((t) => t.title.toLowerCase() === def.title.toLowerCase())
    ),
  ];

  const handleContinue = () => {
    if (!selectedId) return;
    const selectedTask = displayTasks.find((t) => t.id === selectedId);
    if (!selectedTask) return;

    router.push({
      pathname: '/chat',
      params: {
        name,
        showInviteBanner: 'true',
        invitedTaskTitle: selectedTask.title,
        taskTitle: selectedTask.title,
        taskPrice: selectedTask.price,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Choose Existing Task" />

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Select a task to invite <Text style={styles.bold}>{name}</Text> to.
        </Text>

        <View style={styles.list}>
          {displayTasks.map((task) => {
            const isSelected = selectedId === task.id;
            return (
              <Pressable
                key={task.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedId(task.id)}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: COLORS.successLight }]}>
                    <Text style={[styles.badgeText, { color: COLORS.success }]}>Open</Text>
                  </View>
                  <Text style={styles.price}>{task.price}</Text>
                </View>

                <Text style={styles.title}>{task.title}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MapPin width={16} height={16} />
                    <Text style={styles.metaText}>{task.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock width={16} height={16} />
                    <Text style={styles.metaText}>{task.date}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!selectedId} />
      </View>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  bold: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.textPrimary,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#111122',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: COLORS.brand,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
  },
  price: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
