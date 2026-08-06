import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { useNewPost } from '@/hooks/use-new-post';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { inviteTasker } from '@/lib/api/bids';
import { useUserTasks } from '@/lib/api/queries';
import { formatNaira, formatShortDate, locationLabel } from '@/lib/api/tasks';

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

export default function ChooseExistingTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startNewPost = useNewPost();
  const { taskerId, taskerName } = useLocalSearchParams<{
    taskerId?: string;
    taskerName?: string;
  }>();
  const name = taskerName || 'this tasker';

  // Only the user's own open tasks can take an invite.
  const tasksQ = useUserTasks({ status: 'open' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const displayTasks = (tasksQ.data?.tasks ?? []).map((t) => ({
    id: t._id,
    title: t.title,
    price: formatNaira(t.budget),
    location: locationLabel(t),
    date: formatShortDate(t.deadline || t.createdAt),
  }));

  const invite = useMutation({
    mutationFn: (taskId: string) => inviteTasker({ taskId, taskerId: taskerId as string }),
    onSuccess: () => {
      // The backend opens (or reuses) the conversation and posts the invite as a
      // system message, so the inbox is where the user picks the thread up.
      Alert.alert('Invite sent', `${name} has been invited to bid on your task.`, [
        { text: 'OK', onPress: () => router.replace('/messages') },
      ]);
    },
    onError: (err) =>
      Alert.alert('Could not send invite', err instanceof Error ? err.message : 'Please try again.'),
  });

  const handleContinue = () => {
    if (!selectedId) return;
    if (!taskerId) {
      Alert.alert('No tasker selected', 'Open a tasker’s profile and try again.');
      return;
    }
    invite.mutate(selectedId);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Choose Existing Task" />

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Select a task to invite <Text style={styles.bold}>{name}</Text> to.
        </Text>

        {tasksQ.isLoading ? (
          <View style={styles.listState}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : tasksQ.isError ? (
          <View style={styles.listState}>
            <Text style={styles.listStateText}>Couldn’t load your open tasks.</Text>
            <Pressable hitSlop={8} onPress={() => tasksQ.refetch()}>
              <Text style={styles.listStateRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : displayTasks.length === 0 ? (
          <View style={styles.listState}>
            <Text style={styles.listStateText}>
              You have no open tasks to invite anyone to. Post one first.
            </Text>
            <Pressable hitSlop={8} onPress={() => startNewPost({ replace: true })}>
              <Text style={styles.listStateRetry}>Post a task</Text>
            </Pressable>
          </View>
        ) : null}

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
        <PrimaryButton
          label={invite.isPending ? 'Sending invite…' : 'Continue'}
          onPress={handleContinue}
          disabled={!selectedId || invite.isPending}
        />
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
  listState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  listStateText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listStateRetry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
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
