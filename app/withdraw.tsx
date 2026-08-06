import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTaskerBalance, useTaskerBankAccount } from '@/lib/api/queries';
import { formatNaira } from '@/lib/api/tasks';
import { requestWithdrawal } from '@/lib/api/wallet';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  warningBg: '#fffbea',
  warningText: '#92400e',
  error: '#dc2626',
};

const MIN_WITHDRAWAL = 500;

/**
 * Tasker payout request. Bank transfer only — the money goes to the single
 * saved bank account, and the backend holds every request for admin approval
 * (the wallet is debited immediately).
 *
 * No transaction PIN is collected: the backend never verifies one, and asking
 * for a PIN the server ignores would imply protection that doesn't exist.
 */
export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accountType } = useAuth();
  const isTasker = accountType === 'tasker';

  const balanceQ = useTaskerBalance(isTasker);
  const bankQ = useTaskerBankAccount(isTasker);

  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const available = balanceQ.data?.data.availableToWithdraw ?? 0;
  const pendingAmount = balanceQ.data?.data.pendingWithdrawals ?? 0;
  const account = bankQ.data?.data ?? null;

  // The backend allows one open request at a time; a non-zero pending total
  // means the next request would be rejected, so say that up front.
  const hasPendingWithdrawal = pendingAmount > 0;

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => requestWithdrawal({ amount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert(
        'Request submitted',
        `Your withdrawal of ${formatNaira(res.data.amount)} is awaiting approval. The amount has been reserved from your balance.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    },
  });

  const submit = () => {
    setError(null);
    const amount = Number(amountInput.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter the amount you want to withdraw.');
      return;
    }
    if (amount < MIN_WITHDRAWAL) {
      setError(`The minimum withdrawal is ${formatNaira(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (amount > available) {
      setError(`That's more than your available balance of ${formatNaira(available)}.`);
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const loading = balanceQ.isLoading || bankQ.isLoading;
  const submitting = withdrawMutation.isPending;

  if (!isTasker) {
    // Only taskers have payouts — client money leaves via task escrow.
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Withdraw" />
        <View style={styles.state}>
          <Text style={styles.stateText}>
            Withdrawals are for tasker earnings. Switch to your tasker account to request a payout.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Withdraw" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* Available balance */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available to withdraw</Text>
                <Text style={styles.balanceValue}>{formatNaira(available)}</Text>
              </View>

              {hasPendingWithdrawal && (
                <View style={styles.noticeCard}>
                  <Ionicons name="time-outline" size={18} color={COLORS.warningText} />
                  <Text style={styles.noticeText}>
                    You have a withdrawal of {formatNaira(pendingAmount)} awaiting approval. You
                    can request another once it&apos;s processed.
                  </Text>
                </View>
              )}

              {/* Destination account */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paying out to</Text>
                {account ? (
                  <View style={styles.accountCard}>
                    <View style={styles.bankIcon}>
                      <Ionicons name="business-outline" size={20} color={COLORS.brand} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.accountName}</Text>
                      <Text style={styles.accountMeta}>
                        {account.bankName} • {account.accountNumber}
                      </Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => router.push('/bank-account')}>
                      <Text style={styles.changeLink}>Change</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.accountCard} onPress={() => router.push('/bank-account')}>
                    <View style={styles.bankIcon}>
                      <Ionicons name="add" size={20} color={COLORS.brand} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>Add a bank account</Text>
                      <Text style={styles.accountMeta}>Required before you can withdraw</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Amount */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amount (₦)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Minimum ${formatNaira(MIN_WITHDRAWAL)}`}
                  placeholderTextColor={COLORS.placeholder}
                  value={amountInput}
                  onChangeText={(text) => {
                    setAmountInput(text);
                    if (error) setError(null);
                  }}
                  keyboardType="numeric"
                  editable={!hasPendingWithdrawal && !!account}
                />
                <Text style={styles.hint}>
                  Requests are reviewed before payout — the amount is reserved from your balance
                  right away.
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                  (submitting || hasPendingWithdrawal || !account) && styles.buttonDisabled,
                ]}
                onPress={submit}
                disabled={submitting || hasPendingWithdrawal || !account}>
                {submitting ? (
                  <ActivityIndicator color={COLORS.onBrand} />
                ) : (
                  <Text style={styles.buttonLabel}>Request Withdrawal</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
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
    gap: 24,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  balanceLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    letterSpacing: -0.15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: COLORS.onBrand,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.15,
    color: COLORS.warningText,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.32,
    color: COLORS.textPrimary,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  accountMeta: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  changeLink: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.15,
    color: COLORS.brand,
  },
  input: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  hint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  error: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
    textAlign: 'center',
  },
});
