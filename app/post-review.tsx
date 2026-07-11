import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';
import { usePostTask } from '@/context/PostTaskContext';
import { createTask, formatNaira } from '@/lib/api/tasks';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function PostReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { draft, reset } = usePostTask();

  const budgetNum = Number(draft.budget.replace(/[^\d.]/g, ''));
  const serviceValue =
    draft.subCategories.map((s) => s.displayName).join(', ') ||
    draft.mainCategory?.displayName ||
    '—';

  const summary: { label: string; value: string; emphasized?: boolean }[] = [
    { label: 'Category', value: draft.mainCategory?.displayName || '—' },
    { label: 'Service', value: serviceValue },
    { label: 'Title', value: draft.title.trim() || '—' },
    { label: 'Budget', value: budgetNum > 0 ? formatNaira(budgetNum) : '—', emphasized: true },
    { label: 'Location', value: draft.location.trim() || 'From your profile' },
    ...(draft.images.length > 0
      ? [{ label: 'Photos', value: `${draft.images.length} attached` }]
      : []),
  ];

  const createMutation = useMutation({
    mutationFn: () =>
      createTask(
        {
          title: draft.title.trim(),
          description: draft.description.trim(),
          mainCategory: draft.mainCategory!._id,
          categories: draft.subCategories.map((s) => s._id),
          budget: budgetNum,
        },
        draft.images,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.replace('/post-success');
      reset();
    },
    onError: (err) =>
      Alert.alert(
        'Could not post task',
        err instanceof Error ? err.message : 'Please try again.',
      ),
  });

  const submit = () => {
    if (!draft.mainCategory || draft.subCategories.length === 0) {
      Alert.alert('Missing details', 'Please choose a category and at least one service.');
      return;
    }
    if (!draft.title.trim() || !draft.description.trim()) {
      Alert.alert('Missing details', 'Please add a title and description.');
      return;
    }
    if (!(budgetNum > 0)) {
      Alert.alert('Invalid budget', 'Please enter a valid budget amount.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={4} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Post</Text>
          <Text style={styles.subtitle}>Make sure everything looks good.</Text>
        </View>

        <View style={styles.card}>
          {summary.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowValue, row.emphasized && styles.rowValueEmphasized]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton
            label={createMutation.isPending ? 'Posting…' : 'Post Task'}
            disabled={createMutation.isPending}
            onPress={submit}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    width: '100%',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: COLORS.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  rowValueEmphasized: {
    fontFamily: 'Geist_600SemiBold',
  },
  buttonWrap: {
    marginTop: 40,
  },
});
