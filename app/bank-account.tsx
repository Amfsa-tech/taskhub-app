import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryKeys, useBanks, useTaskerBankAccount } from '@/lib/api/queries';
import { setTaskerBankAccount, type Bank } from '@/lib/api/wallet';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  brandMuted: '#e4d6ff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e4e4ee',
  infoBg: '#eff6ff',
  infoText: '#1d4ed8',
  dangerText: '#ef4444',
};

/**
 * Payout bank account — **tasker only**.
 *
 * Three things the previous mock got structurally wrong, all fixed here:
 *   1. The backend stores exactly **one** account (`Tasker.bankAccount` is a
 *      single embedded object). Saving replaces it; there is no delete endpoint.
 *      The old screen kept an array with add/remove.
 *   2. The **account name is not entered** — the backend resolves it with the
 *      payment gateway from the number + bank code. That resolution is the
 *      validation, so a typo fails loudly instead of saving a wrong name.
 *   3. Banks come from `GET /api/wallet/banks` because saving needs the bank
 *      `code`, which a hardcoded list of display names can't supply.
 */
export default function BankAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { accountType } = useAuth();

  const isTasker = accountType === 'tasker';

  const accountQ = useTaskerBankAccount(isTasker);
  const banksQ = useBanks(isTasker);
  const account = accountQ.data?.data ?? null;

  // UI state: 'list' | 'add'
  const [view, setView] = useState<'list' | 'add'>('list');

  // Form state
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');

  // Dropdown state
  const [showBankDrop, setShowBankDrop] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const bankBtnRef = useRef<View>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const banks = banksQ.data?.data ?? [];
  const canSave = Boolean(selectedBank) && accountNumber.trim().length === 10;

  const save = useMutation({
    mutationFn: () =>
      setTaskerBankAccount({
        accountNumber: accountNumber.trim(),
        bankCode: (selectedBank as Bank).code,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.taskerBankAccount() });
      setSelectedBank(null);
      setAccountNumber('');
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setView('list');
      }, 1600);
    },
  });

  // Client accounts have no payout account to manage — every endpoint here
  // resolves a Tasker and 404s for them.
  if (!isTasker) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Bank Account</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.successContainer}>
          <Text style={styles.infoCardSub}>
            Payout accounts belong to tasker profiles. Switch to tasker mode to add one.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => (view === 'add' ? setView('list') : router.back())}
          hitSlop={8}
          style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bank Account</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Payout Account Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={COLORS.brand} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoCardTitle}>Payout Account</Text>
            <Text style={styles.infoCardSub}>
              This account will receive your TaskHub earnings when you withdraw.
            </Text>
          </View>
        </View>

        {view === 'list' ? (
          // ─── List View ───
          <View style={styles.listSection}>
            {accountQ.isLoading ? (
              <View style={styles.successContainer}>
                <ActivityIndicator color={COLORS.brand} />
              </View>
            ) : accountQ.isError ? (
              <View style={styles.successContainer}>
                <Text style={styles.infoCardSub}>Couldn’t load your payout account.</Text>
                <Pressable hitSlop={8} onPress={() => accountQ.refetch()}>
                  <Text style={styles.addBankText}>Retry</Text>
                </Pressable>
              </View>
            ) : account ? (
              <View style={styles.accountCard}>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountNo}>{account.accountNumber}</Text>
                  <Text style={styles.accountHolder}>{account.accountName}</Text>
                  <Text style={styles.bankNameLabel}>{account.bankName}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.infoCardSub}>No payout account saved yet.</Text>
              </View>
            )}

            {/* One account per tasker: saving another replaces this one. */}
            <Pressable style={styles.addBankBox} onPress={() => setView('add')}>
              <Text style={styles.addBankText}>
                {account ? 'Replace bank account' : 'Add bank account'}
              </Text>
            </Pressable>
          </View>
        ) : (
          // ─── Add View ───
          <View style={styles.formSection}>
            {/* Bank Name Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bank name</Text>
              <View ref={bankBtnRef} style={styles.dropdownAnchor}>
                <Pressable
                  style={styles.dropdownBtn}
                  onPress={() => {
                    bankBtnRef.current?.measureInWindow((x, y, w, h) => {
                      setDropPos({ top: y + h + 4, left: x, width: w });
                      setShowBankDrop(true);
                    });
                  }}>
                  <Text style={[styles.dropdownBtnText, !selectedBank && styles.placeholderText]}>
                    {selectedBank?.name ||
                      (banksQ.isLoading ? 'Loading banks…' : 'Select your bank')}
                  </Text>
                  <MaterialCommunityIcons
                    name={showBankDrop ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </Pressable>
              </View>
              {banksQ.isError ? (
                <Pressable hitSlop={8} onPress={() => banksQ.refetch()}>
                  <Text style={styles.errorText}>Couldn’t load banks. Tap to retry.</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Account Number Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Account number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit account number"
                placeholderTextColor={COLORS.textSecondary}
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={10}
                editable={!save.isPending}
              />
            </View>

            {/* Blue Info Callout */}
            <View style={styles.calloutCard}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.infoText} />
              <Text style={styles.calloutText}>
                We’ll confirm the account name with your bank before saving. Payouts typically
                arrive in 1–2 business days.
              </Text>
            </View>

            {save.isError ? (
              <Text style={styles.errorText}>
                {save.error instanceof Error
                  ? save.error.message
                  : 'Could not verify those bank details.'}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Save Button (form state only) */}
      {view === 'add' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.saveBtn, (!canSave || save.isPending) && styles.saveBtnDisabled]}
            disabled={!canSave || save.isPending}
            onPress={() => save.mutate()}>
            {save.isPending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                Save bank Details
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Bank Dropdown Modal */}
      <Modal
        visible={showBankDrop}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBankDrop(false)}>
        <Pressable style={styles.dropBackdrop} onPress={() => setShowBankDrop(false)} />
        <View style={[styles.dropdownList, { top: dropPos.top, left: dropPos.left, width: dropPos.width }]}>
          <ScrollView style={{ maxHeight: 240 }}>
            {banks.map((bank, idx) => (
              <Pressable
                key={bank.code}
                style={[styles.dropItem, idx < banks.length - 1 && styles.dropItemBorder]}
                onPress={() => {
                  setSelectedBank(bank);
                  setShowBankDrop(false);
                }}>
                <Text
                  style={[
                    styles.dropItemText,
                    selectedBank?.code === bank.code && styles.dropItemTextActive,
                  ]}>
                  {bank.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successContainer}>
            <View style={styles.sealCheck}>
              <Ionicons name="checkmark-sharp" size={28} color="#ffffff" />
            </View>
            <Text style={styles.successText}>Bank account saved</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    letterSpacing: -0.41,
  },
  scroll: { padding: 16, gap: 16 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.brandSubtle,
    borderWidth: 1,
    borderColor: COLORS.brandMuted,
    borderRadius: 16,
    padding: 16,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: { flex: 1, gap: 4 },
  infoCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  infoCardSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // List Section
  listSection: { gap: 12, marginTop: 4 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountDetails: { gap: 4 },
  accountNo: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  accountHolder: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bankNameLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBankBox: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.canvas,
    marginTop: 4,
  },
  addBankText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  // Form Section
  formSection: { gap: 16, marginTop: 4 },
  field: { gap: 8 },
  fieldLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dropdownAnchor: { width: '100%' },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownBtnText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.dangerText,
    marginTop: 6,
  },
  placeholderText: { color: COLORS.textSecondary },
  input: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  calloutCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.infoBg,
    borderRadius: 12,
    padding: 12,
  },
  calloutText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.infoText,
    flex: 1,
    lineHeight: 18,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#e0e0ea' },
  saveBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  saveBtnTextDisabled: { color: '#a0a0b0' },
  // Dropdown list
  dropBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdownList: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  dropItemText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dropItemTextActive: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sealCheck: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  successText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
