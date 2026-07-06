import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';
import { useTasks } from '@/context/TaskContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
};

export default function PostDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draftTask, updateDraftTask } = useTasks();

  const [title, setTitle] = useState(draftTask?.title || '');
  const [description, setDescription] = useState(draftTask?.description || '');
  const [location, setLocation] = useState(draftTask?.location || '');
  const [budget, setBudget] = useState(draftTask?.budget || '');

  const handleNext = () => {
    updateDraftTask({
      title,
      description,
      location,
      budget,
    });
    router.push('/post-review');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={3} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Task details</Text>
            <Text style={styles.subtitle}>Tell us more about what you need.</Text>
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Printing & Photocopy, Assignment"
                placeholderTextColor={COLORS.placeholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe what you need..."
                placeholderTextColor={COLORS.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Unilorin , First Gate"
                placeholderTextColor={COLORS.placeholder}
                value={location}
                onChangeText={setLocation}
              />
              <Pressable hitSlop={6} onPress={() => { }}>
                <Text style={styles.useMap}>Use Map</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Set Budget</Text>
              <TextInput
                style={styles.input}
                placeholder="₦1,000"
                placeholderTextColor={COLORS.placeholder}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
              {draftTask?.category === 'local' && (
                <Text style={styles.helper}>Suggested Price: ₦4,000</Text>
              )}
              {draftTask?.category === 'campus' && (
                <Text style={styles.helper}>Suggested Price: ₦1,000</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label="Next" onPress={handleNext} />
        </View>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 24,
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
  fields: {
    gap: 16,
  },
  field: {
    gap: 4,
  },
  label: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 125,
    textAlignVertical: 'top',
  },
  useMap: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  helper: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
