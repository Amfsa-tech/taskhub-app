import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const NIGERIAN_BANKS = [
  'OPAY',
  'Kuda Bank',
  'Guaranty Trust Bank (GTB)',
  'Zenith Bank',
  'Access Bank',
  'United Bank for Africa (UBA)',
  'First Bank of Nigeria',
];

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export default function BankAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // UI state: 'list' | 'add'
  const [view, setView] = useState<'list' | 'add'>('list');
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      accountNumber: '8108294447',
      accountName: 'Elliot Eniola Samuel',
      bankName: 'OPAY',
    },
  ]);

  // Form state
  const [selectedBank, setSelectedBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Dropdown state
  const [showBankDrop, setShowBankDrop] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const bankBtnRef = useRef<View>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canSave = selectedBank && accountName.trim() && accountNumber.trim().length === 10;

  const handleSave = () => {
    if (!canSave) return;
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: selectedBank,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    // Reset form
    setSelectedBank('');
    setAccountName('');
    setAccountNumber('');
    
    // Show success modal & auto-dismiss
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setView('list');
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

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
            {accounts.map((acc) => (
              <View key={acc.id} style={styles.accountCard}>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountNo}>{acc.accountNumber}</Text>
                  <Text style={styles.accountHolder}>{acc.accountName}</Text>
                  <Text style={styles.bankNameLabel}>{acc.bankName}</Text>
                </View>
                <Pressable onPress={() => handleDelete(acc.id)} hitSlop={8} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.dangerText} />
                </Pressable>
              </View>
            ))}

            {/* Add new bank box */}
            <Pressable style={styles.addBankBox} onPress={() => setView('add')}>
              <Text style={styles.addBankText}>Add new bank</Text>
            </Pressable>
          </View>
        ) : (
          // ─── Add View ───
          <View style={styles.formSection}>
            {/* Bank Name Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bank name</Text>
              <View
                ref={bankBtnRef}
                onLayout={() => {}}
                style={styles.dropdownAnchor}>
                <Pressable
                  style={styles.dropdownBtn}
                  onPress={() => {
                    bankBtnRef.current?.measureInWindow((x, y, w, h) => {
                      setDropPos({ top: y + h + 4, left: x, width: w });
                      setShowBankDrop(true);
                    });
                  }}>
                  <Text style={[styles.dropdownBtnText, !selectedBank && styles.placeholderText]}>
                    {selectedBank || 'Select your bank'}
                  </Text>
                  <MaterialCommunityIcons
                    name={showBankDrop ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Account Name Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Account name</Text>
              <TextInput
                style={styles.input}
                placeholder="Account holder name"
                placeholderTextColor={COLORS.textSecondary}
                value={accountName}
                onChangeText={setAccountName}
              />
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
              />
            </View>

            {/* Blue Info Callout */}
            <View style={styles.calloutCard}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.infoText} />
              <Text style={styles.calloutText}>
                Payouts typically arrive in 1–2 business days. You can update these details anytime.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button (form state only) */}
      {view === 'add' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            disabled={!canSave}
            onPress={handleSave}>
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              Save bank Details
            </Text>
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
          <ScrollView style={{ maxHeight: 200 }}>
            {NIGERIAN_BANKS.map((bank, idx) => (
              <Pressable
                key={bank}
                style={[
                  styles.dropItem,
                  idx < NIGERIAN_BANKS.length - 1 && styles.dropItemBorder,
                ]}
                onPress={() => {
                  setSelectedBank(bank);
                  setShowBankDrop(false);
                }}>
                <Text style={[styles.dropItemText, selectedBank === bank && styles.dropItemTextActive]}>
                  {bank}
                </Text>
                {selectedBank === bank && (
                  <MaterialCommunityIcons name="check" size={16} color={COLORS.brand} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => {
            setShowSuccessModal(false);
            setView('list');
          }}>
          <View style={styles.successContainer}>
            <Image
              source={require('../assets/images/SealCheck.png')}
              style={styles.sealCheck}
              resizeMode="contain"
            />
            <Text style={styles.successText}>Bank Account Successfully</Text>
            <Text style={styles.successText}>added</Text>
          </View>
        </Pressable>
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
