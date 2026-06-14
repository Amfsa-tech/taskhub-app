import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowCounterClockwise from '@/assets/icons/arrow-counter-clockwise.svg';
import PencilSimpleLine from '@/assets/icons/pencil-simple-line.svg';
import ShieldCheck from '@/assets/icons/shield-check.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successBg: '#edfaf3',
  successText: '#0d6639',
};

const DETAILS = [
  { label: 'Service', value: 'Printing & Photocopy, Assignment' },
  { label: 'Location', value: 'UI, Ibadan' },
  { label: 'Title', value: 'Someone to print and do my assignment' },
  { label: 'Deadline', value: '18th of May, 2026' },
];

export default function VoiceConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Looks good?</Text>
          <Text style={styles.subtitle}>AI extracted these details from what you said</Text>
        </View>

        <View style={styles.prompt}>
          <Text style={styles.promptLabel}>TRY SAYING</Text>
          <Text style={styles.promptText}>
            &quot;Print my assignment and deliver to Zik Hall within the next hour&quot;
          </Text>
        </View>

        <View style={styles.summary}>
          {DETAILS.map((d) => (
            <View key={d.label} style={styles.row}>
              <Text style={styles.rowLabel}>{d.label}</Text>
              <Text style={styles.rowValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.escrow}>
          <ShieldCheck width={32} height={32} />
          <Text style={styles.escrowText}>
            Escrow Protected — your payment is only released when the task is complete.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Post Task" onPress={() => router.push('/voice-organizing')} />
          <View style={styles.secondaryRow}>
            <Pressable style={styles.outlineButton} onPress={() => router.back()}>
              <PencilSimpleLine width={16} height={16} />
              <Text style={styles.outlineLabel}>Edit</Text>
            </Pressable>
            <Pressable style={styles.outlineButton} onPress={() => router.replace('/voice-post')}>
              <ArrowCounterClockwise width={16} height={16} />
              <Text style={styles.outlineLabel}>Retry</Text>
            </Pressable>
          </View>
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
    paddingTop: 11,
    gap: 24,
  },
  header: {
    gap: 8,
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
  prompt: {
    gap: 10,
  },
  promptLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  promptText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
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
  escrow: {
    backgroundColor: COLORS.successBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  escrowText: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.successText,
  },
  actions: {
    gap: 8,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  outlineButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  outlineLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
});
