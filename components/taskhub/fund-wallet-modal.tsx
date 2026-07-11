import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  error: '#dc2626',
};

const PRESETS = [1000, 2000, 5000, 10000];
const MIN_AMOUNT = 100;

export function FundWalletModal({
  visible,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    const value = Number(amount.replace(/[^\d.]/g, ''));
    if (!(value >= MIN_AMOUNT)) {
      setError(`Enter an amount of ₦${MIN_AMOUNT} or more.`);
      return;
    }
    onSubmit(Math.round(value));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={pending ? undefined : onClose}>
        <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Fund your wallet</Text>
            <Text style={styles.subtitle}>Add money to pay taskers securely via escrow.</Text>
          </View>

          <View style={styles.amountField}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => {
                setAmount(t);
                if (error) setError(null);
              }}
              placeholder="0"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <Pressable key={p} style={styles.presetChip} onPress={() => setAmount(String(p))}>
                <Text style={styles.presetText}>₦{p.toLocaleString('en-US')}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.payButton, (pressed || pending) && styles.pressed]}
              disabled={pending}
              onPress={submit}>
              {pending ? (
                <ActivityIndicator color={COLORS.onBrand} />
              ) : (
                <Text style={styles.payLabel}>Continue to Payment</Text>
              )}
            </Pressable>
            <Pressable style={styles.cancelButton} hitSlop={8} onPress={onClose} disabled={pending}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  header: { gap: 4 },
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
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sunken,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
  },
  currency: {
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    color: COLORS.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    padding: 0,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  error: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  buttons: { gap: 8 },
  payButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  payLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.brand,
  },
});
