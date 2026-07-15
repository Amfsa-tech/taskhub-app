import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Microphone from '@/assets/icons/microphone.svg';
import PaperPlaneWhite from '@/assets/icons/paper-plane-white.svg';
import SparkleWhite from '@/assets/icons/sparkle-white.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { usePostTask } from '@/context/PostTaskContext';
import { parseTaskFromPrompt } from '@/lib/api/ai';
import { useCategories } from '@/lib/api/queries';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  textPlaceholder: '#a0a0ba',
};

const EXAMPLES = [
  '"Print my assignment and deliver to Zik Hall"',
  '"Fix my laptop today"',
  '"Schedule meeting with marketing team"',
  '"Order new office supplies by Friday"',
];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reset, patch } = usePostTask();
  const [prompt, setPrompt] = useState('');

  // Categories are needed to resolve the AI's matched ids back to the Category
  // objects the draft/review flow expects.
  const { data: categoriesData } = useCategories();

  // Start each post with a clean draft.
  useEffect(() => {
    reset();
  }, [reset]);

  const goToCategory = () => {
    // Seed the description with whatever the user typed so it isn't lost.
    if (prompt.trim()) patch({ description: prompt.trim() });
    router.push('/post-category');
  };

  const aiParse = useMutation({
    mutationFn: (text: string) => parseTaskFromPrompt(text),
    onSuccess: ({ draft }) => {
      const all = categoriesData?.categories ?? [];
      const mainCategory = draft.mainCategoryId
        ? all.find((c) => c._id === draft.mainCategoryId) ?? null
        : null;
      const subCategories = draft.subCategoryIds
        .map((id) => all.find((c) => c._id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c));

      patch({
        title: draft.title,
        description: draft.description || prompt.trim(),
        budget: draft.budget != null && draft.budget > 0 ? String(draft.budget) : '',
        mainCategory,
        subCategories,
      });

      // If the AI matched a category and at least one service, the draft is
      // complete enough to review. Otherwise drop the user into manual category
      // selection with everything it could infer already filled in.
      if (mainCategory && subCategories.length > 0) {
        router.push('/post-review');
      } else {
        router.push('/post-category');
      }
    },
    onError: (err: Error) => {
      Alert.alert(
        'AI couldn’t process that',
        `${err.message}\n\nYou can continue and choose a category manually.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue manually', onPress: goToCategory },
        ],
      );
    },
  });

  const runAi = () => {
    const text = prompt.trim();
    if (!text) {
      Alert.alert('Describe your task', 'Type what you need done, then tap Continue.');
      return;
    }
    aiParse.mutate(text);
  };

  const pending = aiParse.isPending;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="AI Quick Post" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Prompt header */}
        <View style={styles.promptHeader}>
          <Text style={styles.title}>What do you need done?</Text>
          <Text style={styles.subtitle}>Describe it naturally — AI will organize it for you.</Text>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="e.g Print my assignment, fix my laptop"
            placeholderTextColor={COLORS.textPlaceholder}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <View style={styles.inputActions}>
            <View style={[styles.roundIcon, { backgroundColor: COLORS.brandSubtle }]}>
              <Microphone width={24} height={24} />
            </View>
            <Pressable
              style={[styles.roundIcon, { backgroundColor: COLORS.brand }, pending && styles.disabled]}
              onPress={runAi}
              disabled={pending}>
              {pending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <PaperPlaneWhite width={24} height={24} />
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.tryLabel}>Try something Like this</Text>

        <View style={styles.examples}>
          {EXAMPLES.map((ex) => (
            <Pressable key={ex} style={styles.exampleChip} onPress={() => setPrompt(ex.replace(/"/g, ''))}>
              <Text style={styles.exampleText}>{ex}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={pending ? 'Organizing…' : 'Continue with AI'}
          leftIcon={pending ? undefined : <SparkleWhite width={18} height={18} />}
          onPress={runAi}
          disabled={pending}
        />
        <PrimaryButton
          label="Choose Manually Instead"
          variant="secondary"
          onPress={goToCategory}
          disabled={pending}
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
    paddingTop: 24,
    paddingBottom: 24,
  },
  promptHeader: {
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    height: 149,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.brand,
    padding: 16,
  },
  input: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  inputActions: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  tryLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    marginTop: 24,
    marginBottom: 10,
  },
  examples: {
    gap: 10,
  },
  exampleChip: {
    backgroundColor: COLORS.surface,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  exampleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
});
