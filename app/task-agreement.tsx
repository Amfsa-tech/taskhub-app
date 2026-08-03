import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { acceptBid, type PaymentSummary } from '@/lib/api/bids';
import { usePaymentSummary } from '@/lib/api/queries';
import { formatNaira } from '@/lib/api/tasks';

const PopperImage = require('@/assets/images/party_popper_3d.png');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandStrong: '#4621c0',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successBg: '#edfaf3',
  successText: '#0d6639',
  border: '#e0e0ea',
  error: '#dc2626',
};

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function taskerLabel(tasker: PaymentSummary['tasker']): string {
  if (!tasker) return 'Tasker';
  const first = tasker.firstName?.trim() ?? '';
  const lastInitial = tasker.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

/**
 * Confirm-and-pay for a bid.
 *
 * The backend has no "agreement" or separate payment step: `POST /api/bids/:id/accept`
 * atomically assigns the task and moves bid + platform fee into escrow. This
 * screen is therefore a *confirmation* of that one call, and every figure on it
 * comes from `GET /api/bids/:id/payment-summary` — the fee is computed
 * server-side, so it is never re-derived here.
 */
export default function TaskAgreementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bidId } = useLocalSearchParams<{ bidId?: string }>();

  const summaryQ = usePaymentSummary(bidId);
  const summary = summaryQ.data?.summary;

  const [step, setStep] = useState<'summary' | 'hired'>('summary');

  const pay = useMutation({
    mutationFn: () => acceptBid(bidId as string),
    onSuccess: async () => {
      // Escrow moved: the task, its list, and the wallet are all stale now.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      setStep('hired');
    },
    onError: (err) =>
      Alert.alert('Payment failed', err instanceof Error ? err.message : 'Please try again.'),
  });

  // ---- Terminal state: hired ----
  if (step === 'hired') {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <Image source={PopperImage} style={styles.popperImage} contentFit="contain" />
        <Text style={styles.confirmedTitle}>Tasker Hired Successfully</Text>
        <Text style={styles.hiredSubtitle}>
          {summary
            ? `${formatNaira(summary.total)} is held securely in escrow until the task is complete.`
            : 'Payment is securely held in escrow.'}
        </Text>
        <View style={styles.hiredButtons}>
          <PrimaryButton
            label="Track my Task"
            onPress={() =>
              router.replace(
                summary
                  ? { pathname: '/track-task', params: { id: summary.taskId } }
                  : '/tasks',
              )
            }
          />
          <Pressable
            style={({ pressed }) => [styles.myTasksButton, pressed && styles.pressed]}
            onPress={() => router.replace('/tasks')}>
            <Text style={styles.myTasksLabel}>Go To my Tasks</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- Paying ----
  if (pay.isPending) {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#12b76a" />
        <Text style={styles.confirmedTitle}>Processing Payment</Text>
        <Text style={styles.confirmedSubtitle}>Please wait a moment</Text>
      </View>
    );
  }

  // ---- Loading / error ----
  if (summaryQ.isLoading || summaryQ.isError || !summary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Confirm & Pay</Text>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.fullscreenCenter}>
          {summaryQ.isLoading ? (
            <ActivityIndicator color={COLORS.brand} />
          ) : (
            <>
              <Text style={styles.confirmedSubtitle}>
                {bidId ? 'Couldn’t load the payment summary.' : 'No bid was selected.'}
              </Text>
              {bidId ? (
                <Pressable hitSlop={8} onPress={() => summaryQ.refetch()}>
                  <Text style={styles.editLabel}>Retry</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  const shortfall = summary.total - summary.walletBalance;

  // ---- Summary ----
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm & Pay</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Payment summary — every figure is server-computed */}
        <View style={styles.card}>
          <SectionHeader title="PAYMENT SUMMARY" />
          <View style={styles.cardBody}>
            <DetailRow label="Task" value={summary.taskTitle} />
            <DetailRow label="Tasker" value={taskerLabel(summary.tasker)} />
            <DetailRow label="Task Amount" value={formatNaira(summary.taskAmount)} />
            <DetailRow
              label={`Platform Fee (${Math.round(summary.feeRate * 100)}%)`}
              value={formatNaira(summary.platformFee)}
            />
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>{formatNaira(summary.total)}</Text>
            </View>
          </View>

          <View style={styles.escrowBanner}>
            <Ionicons name="shield-checkmark" size={20} color="#0d6639" />
            <Text style={styles.escrowText}>
              Escrow Protected — your payment is only released when the task is complete.
            </Text>
          </View>
        </View>

        {/* Wallet is the only funding source: accept debits the wallet directly. */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.walletRow}>
          <View style={styles.walletIconWrap}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.brand} />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet</Text>
            <Text style={styles.walletBalance}>{formatNaira(summary.walletBalance)}</Text>
          </View>
          <View style={styles.radioOutline}>
            <View style={styles.radioDot} />
          </View>
        </View>

        {!summary.sufficientBalance ? (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#d97706" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              You need {formatNaira(shortfall)} more to cover this payment. Fund your wallet to
              continue.
            </Text>
          </View>
        ) : (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#d97706" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Only continue when both sides understand the task clearly. Paying assigns the task to
              this tasker straight away.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomPayBar, { paddingBottom: insets.bottom + 16 }]}>
        {summary.sufficientBalance ? (
          <PrimaryButton
            label={`Pay ${formatNaira(summary.total)} from wallet`}
            onPress={() => pay.mutate()}
          />
        ) : (
          <PrimaryButton label="Fund Wallet" onPress={() => router.push('/wallet')} />
        )}

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={() => router.back()}>
          <Text style={styles.cancelLabel}>Cancel</Text>
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
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.canvas,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  placeholderButton: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
    width: 100,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: COLORS.brand,
  },
  // Tasker styles
  taskerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sunken,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  taskerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskerName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.successText,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  statsText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bullet: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#b45309',
  },
  // Action Buttons
  buttonContainer: {
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.9,
  },
  // Fullscreen loaders & success layouts
  fullscreenCenter: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  scallopedBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#12b76a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#12b76a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  confirmedTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  confirmedSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#edfaf3',
    borderColor: '#d2f4e1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  escrowText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#0d6639',
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    gap: 4,
  },
  walletLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  walletBalance: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  bottomPayBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  successCheckBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#12b76a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popperImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  hiredSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  hiredButtons: {
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
  myTasksButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myTasksLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
});
