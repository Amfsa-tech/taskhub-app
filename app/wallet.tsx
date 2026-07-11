import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FundWalletModal } from '@/components/taskhub/fund-wallet-modal';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useWalletBalance, useWalletTransactions } from '@/lib/api/queries';
import { formatNaira, formatShortDate } from '@/lib/api/tasks';
import { initializeFunding, verifyFunding, type WalletTransaction } from '@/lib/api/wallet';

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
};

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
  const queryClient = useQueryClient();
  const balanceQ = useWalletBalance();
  const txQ = useWalletTransactions();

  const [fundOpen, setFundOpen] = useState(false);
  const [funding, setFunding] = useState(false);

  const balance = balanceQ.data?.data;
  const transactions = txQ.data?.transactions ?? [];

  const startFunding = async (amount: number) => {
    setFunding(true);
    try {
      const init = await initializeFunding(amount);
      const { authorizationUrl, reference } = init.data;

      // Open the hosted checkout; the promise resolves when it's dismissed.
      await WebBrowser.openBrowserAsync(authorizationUrl);

      // Confirm after the checkout closes — a webhook may already have credited.
      let status: 'success' | 'pending' | 'failed' = 'pending';
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const v = await verifyFunding(reference);
          status = v.data.transactionStatus;
        } catch {
          // transient — retry
        }
        if (status !== 'pending') break;
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setFundOpen(false);

      if (status === 'success') {
        Alert.alert('Wallet funded', `${formatNaira(amount)} was added to your wallet.`);
      } else if (status === 'pending') {
        Alert.alert(
          'Payment processing',
          'We’re confirming your payment. Your balance will update shortly.',
        );
      } else {
        Alert.alert('Payment not completed', 'The payment was cancelled or did not go through.');
      }
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
              <Text style={styles.balanceValue}>{formatNaira(balance?.availableBalance ?? 0)}</Text>
              {balance && balance.totalInEscrow > 0 ? (
                <Text style={styles.escrow}>{formatNaira(balance.totalInEscrow)} held in escrow</Text>
              ) : null}
            </>
          )}

          <Pressable
            style={({ pressed }) => [styles.fundButton, pressed && styles.pressed]}
            onPress={() => setFundOpen(true)}>
            <Text style={styles.fundLabel}>Fund Wallet</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>

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
  fundLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.32,
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
