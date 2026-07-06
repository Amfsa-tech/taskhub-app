import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Microphone from '@/assets/icons/microphone.svg';
import PaperPlaneWhite from '@/assets/icons/paper-plane-white.svg';
import SparkleWhite from '@/assets/icons/sparkle-white.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTasks } from '@/context/TaskContext';

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

function parseTaskWithAI(text: string) {
  const lowercase = text.toLowerCase();
  
  // Default values
  let title = text.trim();
  let description = text.trim();
  let category = 'campus'; // default category
  let service = 'Printing & Photocopy';
  let budget = '3,000'; // Default budget
  let location = 'UI, Ibadan'; // Default location

  // Simple heuristic checks
  if (lowercase.includes('plumb') || lowercase.includes('leak') || lowercase.includes('pipe') || lowercase.includes('sink') || lowercase.includes('water')) {
    title = 'Need a plumber in Yaba';
    category = 'local';
    service = 'Plumber';
    budget = '4,000';
    if (lowercase.includes('yaba')) location = 'Yaba, Lagos';
  } else if (lowercase.includes('laptop') || lowercase.includes('computer') || lowercase.includes('repair') || lowercase.includes('screen') || lowercase.includes('crack')) {
    title = 'Fix my Laptop Screen';
    category = 'local';
    service = 'Laptop Repair';
    budget = '20,000';
    if (lowercase.includes('yaba')) location = 'Yaba, Lagos';
    else if (lowercase.includes('unilorin')) location = 'Unilorin, First Gate';
  } else if (lowercase.includes('print') || lowercase.includes('photocopy') || lowercase.includes('assignment') || lowercase.includes('bind') || lowercase.includes('paper')) {
    title = 'Print my assignment';
    category = 'campus';
    service = 'Printing & Photocopy';
    budget = '1,000';
    if (lowercase.includes('zik')) location = 'Zik Hall, UI';
    else if (lowercase.includes('mellanby')) location = 'Mellanby Hall, UI';
    else if (lowercase.includes('tedder')) location = 'Tedder Hall, UI';
  } else if (lowercase.includes('deliver') || lowercase.includes('package') || lowercase.includes('send') || lowercase.includes('food') || lowercase.includes('errand')) {
    title = 'Deliver package to Lekki';
    category = 'errands';
    service = 'Deliveries & Pickup';
    budget = '2,000';
    if (lowercase.includes('lekki')) location = 'Lekki, Lagos';
    else if (lowercase.includes('ikorodu')) location = 'Ikorodu';
  } else if (lowercase.includes('code') || lowercase.includes('design') || lowercase.includes('logo') || lowercase.includes('website') || lowercase.includes('remote')) {
    title = 'Need a remote designer/developer';
    category = 'digital';
    service = 'Document Editing';
    budget = '10,000';
  }

  // Attempt to parse budget from text (e.g. ₦4000, 5000 naira, 2k, etc.)
  const nMatches = text.match(/(?:₦|naira|NGN|\$)?\s?(\d+(?:,\d+)?)\s?(?:naira|k)?/i);
  if (nMatches) {
    const numStr = nMatches[0].replace(/[^\d]/g, '');
    const val = parseInt(numStr, 10);
    if (!isNaN(val) && val > 0) {
      if (nMatches[0].toLowerCase().includes('k')) {
        budget = (val * 1000).toLocaleString();
      } else {
        budget = val.toLocaleString();
      }
    }
  }

  // Handle specific location overrides
  if (lowercase.includes('yaba')) {
    location = 'Yaba, Lagos';
  } else if (lowercase.includes('zik')) {
    location = 'Zik Hall, UI';
  } else if (lowercase.includes('lekki')) {
    location = 'Lekki, Lagos';
  } else if (lowercase.includes('ibadan')) {
    location = 'UI, Ibadan';
  }

  // Capitalize title
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return { title, description, category, service, budget, location };
}

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ voiceText?: string }>();
  const [prompt, setPrompt] = useState('');
  const { setDraftTask, resetDraftTask } = useTasks();

  useEffect(() => {
    if (params.voiceText) {
      setPrompt(params.voiceText);
    }
  }, [params.voiceText]);

  const handleAiSubmit = () => {
    if (!prompt.trim()) return;
    const parsed = parseTaskWithAI(prompt);
    setDraftTask(parsed);
    router.push('/voice-organizing');
  };

  const handleManualSubmit = () => {
    resetDraftTask();
    router.push('/post-category');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="AI Quicks post" />

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
            <Pressable 
              style={[styles.roundIcon, { backgroundColor: COLORS.brandSubtle }]}
              onPress={() => router.push('/voice-post')}>
              <Microphone width={24} height={24} />
            </Pressable>
            <Pressable 
              style={[styles.roundIcon, { backgroundColor: COLORS.brand }]}
              onPress={handleAiSubmit}
              disabled={!prompt.trim()}>
              <PaperPlaneWhite width={24} height={24} />
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
          label="Continue"
          leftIcon={<SparkleWhite width={18} height={18} />}
          onPress={handleAiSubmit}
          disabled={!prompt.trim()}
        />
        <PrimaryButton
          label="Choose Manually Instead"
          variant="secondary"
          onPress={handleManualSubmit}
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
