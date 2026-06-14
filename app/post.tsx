import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Microphone from '@/assets/icons/microphone.svg';
import PaperPlaneWhite from '@/assets/icons/paper-plane-white.svg';
import SparkleWhite from '@/assets/icons/sparkle-white.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

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
  const [prompt, setPrompt] = useState('');

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
            <View style={[styles.roundIcon, { backgroundColor: COLORS.brand }]}>
              <PaperPlaneWhite width={24} height={24} />
            </View>
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
          label="Continue"
          leftIcon={<SparkleWhite width={18} height={18} />}
          onPress={() => router.push('/post-category')}
        />
        <PrimaryButton
          label="Choose Manually Instead"
          variant="secondary"
          onPress={() => router.push('/post-category')}
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
