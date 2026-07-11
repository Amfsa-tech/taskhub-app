<<<<<<< HEAD
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
=======
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
<<<<<<< HEAD
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
=======
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  success: '#12b76a',
  warning: '#d97706',
  error: '#ef4444',
  info: '#2563eb',
};

type Transaction = {
  id: string;
  title: string;
  amount: string;
  date: string;
  source: string;
  status: 'Released' | 'Success' | 'In -Escrow' | 'Failed';
  type: 'debit' | 'credit' | 'escrow';
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '2',
    title: 'Wallet funded',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Bank',
    status: 'Success',
    type: 'credit',
  },
  {
    id: '3',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'In -Escrow',
    type: 'escrow',
  },
  {
    id: '4',
    title: 'Refund - Cancelled Task',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Failed',
    type: 'credit',
  },
  {
    id: '5',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'In -Escrow',
    type: 'escrow',
  },
  {
    id: '6',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '7',
    title: 'Wallet funded',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Card',
    status: 'Failed',
    type: 'credit',
  },
  {
    id: '8',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '9',
    title: 'Refund - Cancelled Task',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Success',
    type: 'credit',
  },
];

export function getStatusStyle(status: Transaction['status']) {
  switch (status) {
    case 'Released':
    case 'Success':
      return { color: COLORS.success, label: status };
    case 'In -Escrow':
      return { color: COLORS.info, label: status };
    case 'Failed':
      return { color: COLORS.error, label: status };
    default:
      return { color: COLORS.textSecondary, label: status };
  }
}

export function getTransactionIcon(type: Transaction['type'], status: Transaction['status']) {
  if (status === 'Failed') {
    return {
      name: 'close-outline' as const,
      color: COLORS.error,
      bg: '#fff1f1',
    };
  }
  if (type === 'credit') {
    return {
      name: 'arrow-down-outline' as const,
      color: COLORS.success,
      bg: '#edfaf3',
    };
  }
  if (type === 'escrow') {
    return {
      name: 'wallet-outline' as const,
      color: COLORS.warning,
      bg: '#fffbeb',
    };
  }
  return {
    name: 'arrow-up-outline' as const,
    color: COLORS.warning,
    bg: '#fffbeb',
  };
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(15000);

  const handleAddFunds = () => {
    Alert.alert('Add Funds', 'Select payment gateway or option to fund your wallet.', [
      {
        text: 'Demo Fund (+₦5,000)',
        onPress: () => {
          setBalance((prev) => prev + 5000);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Wallet" />

      <ScrollView
        style={styles.flex}
<<<<<<< HEAD
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
=======
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>

        {/* Balance Card */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceTextCol}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balanceValue}>₦{balance.toLocaleString()}</Text>
            <Text style={styles.escrowSub}>In Escrow: ₦15,000</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addFundsBtn, pressed && styles.btnPressed]}
            onPress={handleAddFunds}>
            <Text style={styles.addFundsText}>Add Funds</Text>
          </Pressable>
        </View>

        {/* Payment History section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Payment History</Text>
          
          <View style={styles.chartCard}>
            <View style={styles.chartYAxis}>
              <Text style={styles.axisLabel}>100K</Text>
              <Text style={styles.axisLabel}>80K</Text>
              <Text style={styles.axisLabel}>60K</Text>
              <Text style={styles.axisLabel}>40K</Text>
              <Text style={styles.axisLabel}>20K</Text>
              <Text style={styles.axisLabel}>0</Text>
            </View>

            <View style={styles.chartBarsArea}>
              <View style={styles.gridContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              <View style={styles.barsContainer}>
                {[
                  { month: 'JAN', val: 55 },
                  { month: 'FEB', val: 40 },
                  { month: 'MAR', val: 75 },
                  { month: 'APR', val: 78 },
                  { month: 'MAY', val: 70 },
                  { month: 'JUN', val: 35 },
                ].map((bar) => (
                  <View key={bar.month} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${bar.val}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{bar.month}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Transaction History</Text>
            <Pressable onPress={() => router.push('/transaction-history')}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.transactionsCard}>
            <Text style={styles.cardSubtitle}>Recent Activities</Text>

            {MOCK_TRANSACTIONS.slice(0, 3).map((item, index) => {
              const icon = getTransactionIcon(item.type, item.status);
              const statusStyle = getStatusStyle(item.status);

              return (
                <View key={item.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.transactionRow}>
                    <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.txMeta}>{item.date} • {item.source}</Text>
                    </View>
                    <View style={styles.txPriceCol}>
                      <Text style={[styles.txAmount, item.amount.startsWith('+') ? styles.creditText : styles.debitText]}>
                        {item.amount}
                      </Text>
                      <Text style={[styles.txStatus, { color: statusStyle.color }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 4,
  },
  balanceTextCol: {
    gap: 4,
  },
  balanceLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    color: COLORS.textPrimary,
  },
  escrowSub: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addFundsBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addFundsText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  btnPressed: {
    opacity: 0.9,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.brand,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    height: 240,
    gap: 12,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 170,
    width: 32,
    paddingBottom: 4,
  },
  axisLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartBarsArea: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    height: 168,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#eaeaf0',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  barCol: {
    alignItems: 'center',
    width: '13%',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barTrack: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#8c5fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  transactionsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
  },
  cardSubtitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 4,
  },
  txTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  txMeta: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  txPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
  },
  txStatus: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
  },
  creditText: {
    color: COLORS.success,
  },
  debitText: {
    color: COLORS.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
});
