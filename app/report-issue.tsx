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

import FlagWhite from '@/assets/icons/flag-white.svg';
import Headset from '@/assets/icons/headset.svg';
import RadioOff from '@/assets/icons/radio-off.svg';
import RadioOn from '@/assets/icons/radio-on.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  placeholder: '#a0a0ba',
};

const ISSUES = [
  'Tasker Didn’t show up',
  'Poor Quality of work',
  'Rude and Unprofessional behaviour',
  'Payment Issue',
  'Fake Profile / Scam',
  'Safety Concerns',
  'Others',
];

export default function ReportIssueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState(ISSUES[0]);
  const [details, setDetails] = useState('');

  const submit = () => {
    // Send to the backend when available; then show the confirmation screen.
    router.push('/report-submitted');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Report Issue"
        right={
          <Pressable hitSlop={8} onPress={() => {}}>
            <Headset width={24} height={24} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Issue selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What is the Issue</Text>
            <View style={styles.card}>
              {ISSUES.map((issue, i) => {
                const isSelected = selected === issue;
                return (
                  <Pressable
                    key={issue}
                    style={[styles.option, i < ISSUES.length - 1 && styles.optionGap]}
                    onPress={() => setSelected(issue)}>
                    <Text style={styles.optionLabel}>{issue}</Text>
                    {isSelected ? (
                      <RadioOn width={20} height={20} />
                    ) : (
                      <RadioOff width={20} height={20} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Additional details */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Details</Text>
            <View style={styles.textArea}>
              <TextInput
                style={styles.textAreaInput}
                value={details}
                onChangeText={setDetails}
                placeholder="Describe what happened"
                placeholderTextColor={COLORS.placeholder}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton
            label="Submit Report"
            onPress={submit}
            leftIcon={<FlagWhite width={18} height={18} />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  option: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionGap: { marginBottom: 8 },
  optionLabel: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 124,
  },
  textAreaInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
