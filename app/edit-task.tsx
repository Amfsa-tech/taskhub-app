import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { queryKeys, useTask } from '@/lib/api/queries';
import { updateTask } from '@/lib/api/tasks';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
};

/**
 * Edit an open task's simple fields (title / description / budget).
 * Category, images, and location aren't editable — cancel and repost for those.
 * Assigned tasks aren't editable here: the escrow was funded off the accepted
 * bid, so changing the budget afterwards would desync money from the task.
 */
export default function EditTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const taskQ = useTask(id);
  const task = taskQ.data?.task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [seeded, setSeeded] = useState(false);

  // Seed the form once the task arrives; don't clobber in-progress edits on
  // background refetches.
  useEffect(() => {
    if (task && !seeded) {
      setTitle(task.title);
      setDescription(task.description);
      setBudget(String(task.budget));
      setSeeded(true);
    }
  }, [task, seeded]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTask(id as string, {
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id as string) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Saved', 'Your task has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) =>
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.'),
  });

  const canSave =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    Number(budget) > 0 &&
    !saveMutation.isPending;

  if (taskQ.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Edit Task" />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      </View>
    );
  }

  if (!task || task.status !== 'open') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Edit Task" />
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            {!task
              ? 'This task could not be loaded.'
              : 'Only open tasks can be edited. Once a tasker is hired the agreed price is locked in escrow.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Edit Task" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need done?"
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the task in detail"
            placeholderTextColor={COLORS.placeholder}
            multiline
          />

          <Text style={styles.fieldLabel}>Budget (₦)</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={(t) => setBudget(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={styles.note}>
            Need to change the category, photos, or location? Cancel this task and post it again.
          </Text>

          <PrimaryButton
            label={saveMutation.isPending ? 'Saving…' : 'Save changes'}
            disabled={!canSave}
            onPress={() => saveMutation.mutate()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  note: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
});
