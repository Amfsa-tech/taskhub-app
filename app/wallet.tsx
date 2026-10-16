import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FundWalletModal } from '@/components/taskhub/fund-wallet-modal';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import {
  useTaskerBalance,
  useTaskerTransactions,
  useWalletBalance,
  useWalletTransactions,
} from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { formatNaira, formatShortDate } from '@/lib/api/tasks';
import { initializeFunding, verifyFunding, type WalletTransaction } from '@/lib/api/wallet';
import { STELLAR_WALLET_ENABLED } from '@/lib/config';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  onBrand: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  credit: '#15803d',
  error: '#dc2626',
  pending: '#b45309',
  pendingSurface: '#fff8e6',
  pendingBorder: '#f3c969',
};

type PendingFunding = {
  reference: string;
  authorizationUrl: string;
  amount: number;
  initiatedAt: string;
};

const PENDING_FUNDING_KEY = '@taskhub/pending-wallet-funding';

function statusNote(tx: WalletTransaction): string {
  if (tx.status === 'success') return '';
  return ` · ${tx.status}`;
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const credit = tx.type === 'credit';
  return (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <Text style={styles.txDesc} numberOfLines={1}>
          {tx.description || 'Transaction'}
        </Text>
        <Text style={styles.txDate}>
          {formatShortDate(tx.createdAt)}
          {statusNote(tx)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: credit ? COLORS.credit : COLORS.textPrimary }]}>
        {credit ? '+' : '-'}
        {formatNaira(tx.amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accountType, user } = useAuth();
  const isTasker = accountType === 'tasker';

  /*
   * User and tasker wallets are different endpoints with different shapes, and
   * they are not interchangeable: `GET /api/wallet/user/balance` resolves a
   * `User` by id, so a tasker token 404s rather than 401s. Each pair is enabled
   * only for the account type it belongs to.
   */
  const userBalanceQ = useWalletBalance(!isTasker);
  const userTxQ = useWalletTransactions(!isTasker);
  const taskerBalanceQ = useTaskerBalance(isTasker);
  const taskerTxQ = useTaskerTransactions(isTasker);

  const balanceQ = isTasker ? taskerBalanceQ : userBalanceQ;
  const txQ = isTasker ? taskerTxQ : userTxQ;

  const [fundOpen, setFundOpen] = useState(false);
  const [funding, setFunding] = useState(false);
  const [pendingFunding, setPendingFunding] = useState<PendingFunding | null>(null);
  const [checkingFunding, setCheckingFunding] = useState(false);
  const checkingRef = useRef(false);
  const pendingKey = user?._id ? `${PENDING_FUNDING_KEY}:${user._id}` : null;

  const transactions = txQ.data?.transactions ?? [];

  // Taskers have no escrow of their own (escrow is held against the client's
  // wallet) but do have pending withdrawals, so the secondary line differs.
  const available = isTasker
    ? (taskerBalanceQ.data?.data?.availableToWithdraw ?? 0)
    : (userBalanceQ.data?.data?.availableBalance ?? 0);
  const secondaryAmount = isTasker
    ? (taskerBalanceQ.data?.data?.pendingWithdrawals ?? 0)
    : (userBalanceQ.data?.data?.totalInEscrow ?? 0);
  const secondaryLabel = isTasker ? 'pending withdrawal' : 'held in escrow';

  useEffect(() => {
    let cancelled = false;
    if (!pendingKey || isTasker) {
      setPendingFunding(null);
      return;
    }

    AsyncStorage.getItem(pendingKey)
      .then((stored) => {
        if (!cancelled && stored) setPendingFunding(JSON.parse(stored) as PendingFunding);
      })
      .catch(() => {
        // A storage failure must not make the wallet unusable.
      });

    return () => {
      cancelled = true;
    };
  }, [isTasker, pendingKey]);

  const checkFundingStatus = useCallback(
    async (payment: PendingFunding, notify = true) => {
      if (checkingRef.current || !pendingKey) return;
      checkingRef.current = true;
      setCheckingFunding(true);
      try {
        const result = await verifyFunding(payment.reference);
        const status = result.data.transactionStatus;
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });

        if (status === 'success' || status === 'failed') {
          await AsyncStorage.removeItem(pendingKey);
          setPendingFunding(null);
        }

        if (notify) {
          if (status === 'success') {
            Alert.alert('Wallet funded', `${formatNaira(payment.amount)} was added to your wallet.`);
          } else if (status === 'failed') {
            Alert.alert('Payment not completed', 'Flutterwave reported that this payment did not go through.');
          } else {
            Alert.alert(
              'Payment still pending',
              'If you used bank transfer, return to Flutterwave and tap I have paid after completing the transfer.',
            );
          }
        }
      } catch (error) {
        if (notify) {
          Alert.alert(
            'Could not check payment',
            error instanceof Error ? error.message : 'Please check your connection and try again.',
          );
        }
      } finally {
        checkingRef.current = false;
        setCheckingFunding(false);
      }
    },
    [pendingKey, queryClient],
  );

  useEffect(() => {
    if (!pendingFunding) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkFundingStatus(pendingFunding, false);
    });
    return () => subscription.remove();
  }, [checkFundingStatus, pendingFunding]);

  const openFundingCheckout = useCallback(async (payment: PendingFunding) => {
    await WebBrowser.openBrowserAsync(payment.authorizationUrl, {
      createTask: true,
      showInRecents: true,
      showTitle: true,
    });

    // Android resolves as soon as the custom tab opens. iOS resolves after it
    // closes, so only the iOS branch can safely verify at this point.
    if (Platform.OS === 'ios') await checkFundingStatus(payment, true);
  }, [checkFundingStatus]);

  const startFunding = async (amount: number) => {
    setFunding(true);
    try {
      const init = await initializeFunding(amount);
      const { authorizationUrl, reference } = init.data;
      const payment: PendingFunding = {
        authorizationUrl,
        reference,
        amount,
        initiatedAt: new Date().toISOString(),
      };

      if (!pendingKey) throw new Error('Your session is not ready. Please sign in again.');
      await AsyncStorage.setItem(pendingKey, JSON.stringify(payment));
      setPendingFunding(payment);
      setFundOpen(false);
      await openFundingCheckout(payment);
    } catch (err) {
      Alert.alert('Funding failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setFunding(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Wallet" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          {balanceQ.isLoading ? (
            <ActivityIndicator color={COLORS.onBrand} style={styles.balanceLoading} />
          ) : balanceQ.isError ? (
            <Text style={styles.balanceError}>Couldn’t load balance</Text>
          ) : (
            <>
              <Text style={styles.balanceValue}>{formatNaira(available)}</Text>
              {secondaryAmount > 0 ? (
                <Text style={styles.escrow}>
                  {formatNaira(secondaryAmount)} {secondaryLabel}
                </Text>
              ) : null}
            </>
          )}

          {!isTasker && (
            <Pressable
              style={({ pressed }) => [styles.fundButton, pressed && styles.pressed]}
              onPress={() => setFundOpen(true)}>
              <Text style={styles.fundLabel}>Fund Wallet</Text>
            </Pressable>
          )}
          {isTasker && (
            <Pressable
              style={({ pressed }) => [styles.fundButton, pressed && styles.pressed]}
              onPress={() => router.push('/withdraw' as any)}>
              <Text style={styles.fundLabel}>Withdraw</Text>
            </Pressable>
          )}
          {STELLAR_WALLET_ENABLED && <Pressable
            style={({ pressed }) => [styles.stellarLink, pressed && styles.pressed]}
            onPress={() => router.push('/stellar-deposit' as any)}>
            <Text style={styles.stellarLinkText}>Stellar deposit details</Text>
          </Pressable>}
        </View>

        {!isTasker && pendingFunding ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Payment awaiting confirmation</Text>
            <Text style={styles.pendingCopy}>
              Your {formatNaira(pendingFunding.amount)} Flutterwave checkout is saved. You can switch
              to your bank app, then reopen the same checkout to tap I have paid.
            </Text>
            <View style={styles.pendingActions}>
              <Pressable
                style={({ pressed }) => [styles.pendingPrimary, pressed && styles.pressed]}
                onPress={() => openFundingCheckout(pendingFunding)}>
                <Text style={styles.pendingPrimaryLabel}>Return to payment</Text>
              </Pressable>
              <Pressable
                disabled={checkingFunding}
                style={({ pressed }) => [
                  styles.pendingSecondary,
                  pressed && styles.pressed,
                  checkingFunding && styles.disabled,
                ]}
                onPress={() => checkFundingStatus(pendingFunding, true)}>
                {checkingFunding ? (
                  <ActivityIndicator size="small" color={COLORS.brand} />
                ) : (
                  <Text style={styles.pendingSecondaryLabel}>Check payment status</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Transactions */}
        <Text style={styles.sectionTitle}>{isTasker ? 'Earnings' : 'Transactions'}</Text>

        {txQ.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : txQ.isError ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>Couldn’t load transactions.</Text>
            <Pressable hitSlop={8} onPress={() => txQ.refetch()}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.map((tx) => (
              <TransactionRow key={tx._id} tx={tx} />
            ))}
          </View>
        )}
      </ScrollView>

      <FundWalletModal
        visible={fundOpen}
        pending={funding}
        onClose={() => setFundOpen(false)}
        onSubmit={startFunding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  balanceCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  balanceLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.onBrand,
    opacity: 0.85,
  },
  balanceValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 34,
    letterSpacing: -0.5,
    color: COLORS.onBrand,
  },
  balanceLoading: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  balanceError: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    color: COLORS.onBrand,
    marginVertical: 4,
  },
  escrow: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.onBrand,
    opacity: 0.85,
  },
  fundButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  fundLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.32,
    color: COLORS.brand,
  },
  stellarLink: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  stellarLinkText: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.onBrand, textDecorationLine: 'underline' },
  pendingCard: {
    backgroundColor: COLORS.pendingSurface,
    borderWidth: 1,
    borderColor: COLORS.pendingBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  pendingTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  pendingCopy: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  pendingActions: { gap: 8 },
  pendingPrimary: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPrimaryLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.onBrand,
  },
  pendingSecondary: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingSecondaryLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  txList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.sunken,
  },
  txLeft: { flex: 1, gap: 2 },
  txDesc: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  txDate: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  txAmount: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.32,
  },
  state: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
});
