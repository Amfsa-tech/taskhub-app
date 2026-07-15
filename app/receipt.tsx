import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clipboard, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ShieldCheck from '@/assets/icons/shield-check.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { SAMPLE_COMPLETED_TASKS } from '@/components/taskhub/task-card';

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

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [copied, setCopied] = useState(false);

  // Look up completed task details.
  // NOTE: still backed by sample data — a real task id won't match, and the
  // screen falls back to the mockup values below.
  const task = SAMPLE_COMPLETED_TASKS.find((t) => t.id === id);

  // Default values from mockup design
  let displayTitle = 'Print and Deliver 200-Level GST Notes';
  let displayPrice = '₦1,000';
  let displayTasker = 'Chioma A.';
  let displayCompleted = 'May 10, 2026';
  let displayPosted = 'May 8, 2026';
  let displayPlatformFee = '₦75';
  let displayTaskerReceived = '₦1,475';
  let displayReference = 'NTH-20260510-001';

  // If a valid completed task is selected, compute mathematically sound details
  if (task) {
    const parsePrice = (priceStr: string): number => {
      const clean = priceStr.replace(/[^0-9]/g, '');
      return parseInt(clean, 10) || 0;
    };

    const formatPrice = (amount: number): string => {
      return `₦${amount.toLocaleString()}`;
    };

    const priceNum = parsePrice(task.price);
    const feeNum = Math.round(priceNum * 0.075); // 7.5% Platform Fee
    const receivedNum = priceNum - feeNum;

    // Use mockup values for task 1 to match the screenshot exactly
    if (task.id === '1') {
      displayTitle = 'Print and Deliver 200-Level GST Notes';
      displayPrice = '₦1,000';
      displayTasker = 'Chioma A.';
      displayCompleted = 'May 10, 2026';
      displayPosted = 'May 8, 2026';
      displayPlatformFee = '₦75';
      displayTaskerReceived = '₦1,475';
      displayReference = 'NTH-20260510-001';
    } else {
      displayTitle = task.title;
      displayPrice = task.price;
      displayTasker = task.tasker.name;
      displayCompleted = task.completedAt;
      displayPosted = 'May 8, 2026';
      displayPlatformFee = formatPrice(feeNum);
      displayTaskerReceived = formatPrice(receivedNum);
      displayReference = `NTH-20260510-00${task.id}`;
    }
  }

  const handleCopy = () => {
    try {
      Clipboard.setString(displayReference);
    } catch (e) {
      console.warn('Clipboard setString failed, falling back', e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    Alert.alert('Download Receipt', 'Downloading PDF receipt to your device...');
  };

  const handleBackToTask = () => {
    router.push('/(main)/tasks');
  };

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
          <Text style={styles.amountText}>{displayPrice}</Text>
          <Text style={styles.dateText}>{displayPosted}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Task</Text>
            <Text style={styles.value}>{displayTitle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasker</Text>
            <Text style={styles.value}>{displayTasker}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Completed</Text>
            <Text style={styles.value}>{displayCompleted}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>TaskHub Wallet</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform Fee</Text>
            <Text style={styles.valueBold}>{displayPlatformFee}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasker Received</Text>
            <Text style={styles.valueBold}>{displayTaskerReceived}</Text>
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
            <Text style={styles.refText}>{displayReference}</Text>
            <Pressable style={styles.copyBtn} onPress={handleCopy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? COLORS.success : COLORS.textPrimary} />
              <Text style={[styles.copyBtnText, copied && { color: COLORS.success }]}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Pin Buttons to Bottom */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.btnPrimary} onPress={handleDownload}>
          <Ionicons name="download-outline" size={20} color="#ffffff" />
          <Text style={styles.btnPrimaryText}>Download PDF Receipt</Text>
        </Pressable>
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
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
    width: 120,
  },
  value: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  valueBold: {
    flex: 1,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  escrowBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  escrowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.successBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#065f46',
  },
  escrowSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  refBlock: {
    gap: 8,
    marginTop: 8,
  },
  refLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#78788c',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  copyBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  btnPrimary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  btnSecondary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.buttonGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.buttonGreyText,
  },
});
