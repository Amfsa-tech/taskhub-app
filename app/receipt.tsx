import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ShieldCheck from '@/assets/icons/shield-check.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTask } from '@/lib/api/queries';
import { formatLongDate, formatNaira } from '@/lib/api/tasks';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  success: '#15803d',
  successLight: '#f0fdf4',
  successBgSubtle: '#d1fae5',
  border: '#e2e2ec',
  buttonGrey: '#e2e2ec',
  buttonGreyText: '#78788c',
};

/**
 * Receipt for a completed task, built from the real task record.
 *
 * Client-borne fee model: the customer paid `escrowAmount` (budget + fee), the
 * tasker received the full budget. The stored breakdown is preferred; older
 * tasks without one fall back to deriving it from the budget at the 10% rate.
 */
export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [copied, setCopied] = useState(false);

  const taskQ = useTask(id);
  const task = taskQ.data?.task;

  const budget = task?.budget ?? 0;
  const platformFee = task?.platformFee || Math.round(budget * 0.1);
  const taskerReceived = task?.taskerPayout || budget;
  const totalPaid = task?.escrowAmount || budget + platformFee;

  const taskerName = task?.assignedTasker
    ? [task.assignedTasker.firstName, task.assignedTasker.lastName].filter(Boolean).join(' ')
    : '—';

  const completedIso = task?.completedAt ?? task?.updatedAt;
  const reference = task
    ? `NTH-${(completedIso ?? task.createdAt).slice(0, 10).replace(/-/g, '')}-${task._id
        .slice(-6)
        .toUpperCase()}`
    : '';

  const handleCopy = () => {
    try {
      Clipboard.setString(reference);
    } catch (e) {
      console.warn('Clipboard setString failed, falling back', e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBackToTask = () => {
    router.push('/(main)/tasks');
  };

  if (taskQ.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Receipt" />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      </View>
    );
  }

  if (!task || task.status !== 'completed') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Receipt" />
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>
            {!task
              ? 'This receipt could not be loaded.'
              : 'A receipt is available once the task is completed.'}
          </Text>
          <Pressable style={styles.btnSecondary} onPress={handleBackToTask}>
            <Text style={styles.btnSecondaryText}>Back To My Task</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Receipt" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <Text style={styles.statusText}>Task Completed</Text>
          <Text style={styles.amountText}>{formatNaira(totalPaid)}</Text>
          <Text style={styles.dateText}>{formatLongDate(completedIso)}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Task</Text>
            <Text style={styles.value}>{task.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasker</Text>
            <Text style={styles.value}>{taskerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Posted</Text>
            <Text style={styles.value}>{formatLongDate(task.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Completed</Text>
            <Text style={styles.value}>{formatLongDate(completedIso)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>TaskHub Wallet</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform Fee</Text>
            <Text style={styles.valueBold}>{formatNaira(platformFee)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasker Received</Text>
            <Text style={styles.valueBold}>{formatNaira(taskerReceived)}</Text>
          </View>
        </View>

        {/* Escrow Badge */}
        <View style={styles.escrowBanner}>
          <View style={styles.escrowIconBox}>
            <ShieldCheck width={20} height={20} />
          </View>
          <View style={styles.escrowTextCol}>
            <Text style={styles.escrowTitle}>Escrow Released</Text>
            <Text style={styles.escrowSubtitle}>Payment was protected by TaskHub Escrow</Text>
          </View>
        </View>

        {/* Reference ID copy block */}
        <View style={styles.refBlock}>
          <Text style={styles.refLabel}>REFERENCE ID</Text>
          <View style={styles.refRow}>
            <Text style={styles.refText}>{reference}</Text>
            <Pressable style={styles.copyBtn} onPress={handleCopy}>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? COLORS.success : COLORS.textPrimary}
              />
              <Text style={[styles.copyBtnText, copied && { color: COLORS.success }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Pin Buttons to Bottom */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.btnSecondary} onPress={handleBackToTask}>
          <Text style={styles.btnSecondaryText}>Back To My Task</Text>
        </Pressable>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  topSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  statusText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#10b981',
  },
  amountText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  dateText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
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
  label: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  valueBold: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: 16,
    padding: 14,
  },
  escrowIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowTextCol: {
    flex: 1,
    gap: 2,
  },
  escrowTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.success,
  },
  escrowSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  refBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  refLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.canvas,
    gap: 10,
  },
  btnSecondary: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  btnSecondaryText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.brand,
  },
});
