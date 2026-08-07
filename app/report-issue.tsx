import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { buildIssueReportMessage, submitSupportRequest } from '@/lib/api/support';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  placeholder: '#a0a0ba',
  error: '#dc2626',
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
  // Optional task context, passed by the report entry points on `task-details`.
  const { taskId, taskTitle } = useLocalSearchParams<{
    taskId?: string;
    taskTitle?: string;
  }>();
  const { user } = useAuth();
  const [selected, setSelected] = useState(ISSUES[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reporterName = user?.fullName?.trim() || user?.firstName?.trim() || '';
  const reporterEmail = user?.emailAddress?.trim() || '';

  const send = useMutation({
    mutationFn: () =>
      submitSupportRequest({
        name: reporterName,
        email: reporterEmail,
        message: buildIssueReportMessage({
          issue: selected,
          details,
          taskId,
          taskTitle,
        }),
      }),
    onSuccess: () => router.push('/report-submitted'),
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : 'Couldn’t send your report. Please try again.',
      ),
  });

  const submit = () => {
    setError(null);

    // The endpoint requires a name and a valid email, and takes them from the
    // body rather than the token — so a session without them can't report.
    if (!reporterName || !reporterEmail) {
      setError('We couldn’t read your account details. Please sign in again and retry.');
      return;
    }

    send.mutate();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Report Issue"
        right={
          <Pressable hitSlop={8} onPress={() => router.push('/help-support')}>
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
                editable={!send.isPending}
              />
            </View>
          </View>

          {/* Tell the user what's attached — the task reference goes into the
              message body, so it isn't otherwise visible anywhere. */}
          {taskTitle || taskId ? (
            <Text style={styles.contextNote}>
              This report will reference “{taskTitle || taskId}”.
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton
            label={send.isPending ? 'Sending…' : 'Submit Report'}
            disabled={send.isPending}
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
  contextNote: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.08,
    color: '#5a5a70',
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
