import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVerificationStatus } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e0e0ea',
  danger: '#b01515',
  successText: '#0d6639',
};

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  valueColor?: string;
  showChevron?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

function SettingRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = COLORS.textSecondary,
  showChevron = true,
  onPress,
  rightElement,
  danger = false,
}: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.leftContainer}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.label, danger && styles.dangerText]}>{label}</Text>
      </View>
      <View style={styles.rightContainer}>
        {value && <Text style={[styles.valueText, { color: valueColor }]}>{value}</Text>}
        {rightElement}
        {showChevron && <Ionicons name="chevron-forward" size={16} color="#a0a0ba" />}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, accountType, user } = useAuth();
  const isTasker = accountType === 'tasker';

  // Mask all but the leading country code and last two digits, e.g. "+234*** ****12".
  const phone = user?.phoneNumber?.trim();
  const phoneLabel =
    phone && phone.length >= 7 ? `${phone.slice(0, 4)}*** ****${phone.slice(-2)}` : 'Not set';

  /**
   * The backend exposes a single KYC boolean per account (`isKYCVerified` for
   * users, `verifyIdentity` for taskers) — there's no per-method breakdown, so
   * both security rows below read from the same flag. Splitting them would need
   * separate backend fields.
   */
  const verificationQ = useVerificationStatus();
  const isVerified = verificationQ.data?.data.isVerified;
  const verificationLabel = verificationQ.isLoading
    ? '…'
    : isVerified
      ? 'Verified'
      : 'Not verified';
  const verificationColor = isVerified ? COLORS.successText : '#d97706';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          // Clear the persisted session before navigating — otherwise the token
          // survives in SecureStore and the next launch silently restores it.
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {/* Account group */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="person-outline"
              iconBg="#eff6ff"
              iconColor="#1d4ed8"
              label="Edit Profile"
              onPress={() => router.push('/edit-profile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-closed-outline"
              iconBg="#fff1f1"
              iconColor="#b01515"
              label="Change Password"
              onPress={() => router.push('/change-password')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="call-outline"
              iconBg="#edfaf3"
              iconColor="#0d6639"
              label="Phone Number"
              value={phoneLabel}
              onPress={() => router.push('/phone-number')}
            />
          </View>
        </View>

        {/* Privacy group */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PRIVACY</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="person-remove-outline"
              iconBg="#fff1f1"
              iconColor="#b01515"
              label="Blocked user"
              onPress={() => router.push('/blocked-users')}
            />
          </View>
        </View>

        {/* Security group — verification only, so taskers only. Device
            sessions were removed: the backend has no session model. */}
        {isTasker && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>SECURITY</Text>
            <View style={styles.groupCard}>
              <SettingRow
                icon="shield-checkmark-outline"
                iconBg="#eff6ff"
                iconColor="#1d4ed8"
                label="Face verification"
                value={verificationLabel}
                valueColor={verificationColor}
                onPress={() => router.push('/select-verification')}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="id-card-outline"
                iconBg="#fff1f1"
                iconColor="#b01515"
                label="NIN Verification"
                value={verificationLabel}
                valueColor={verificationColor}
                onPress={() => router.push('/select-verification')}
              />
            </View>
          </View>
        )}

        {/* Payment group */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PAYMENT</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="wallet-outline"
              iconBg="#eff6ff"
              iconColor="#1d4ed8"
              label="Wallet"
              onPress={() => router.push('/wallet')}
            />
          </View>
        </View>

        {/* Help group */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HELP</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="help-circle-outline"
              iconBg="#eff6ff"
              iconColor="#1d4ed8"
              label="Help & Support"
              onPress={() => router.push('/help-support')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="alert-circle-outline"
              iconBg="#fff1f1"
              iconColor="#b01515"
              label="Report an Issue"
              onPress={() => router.push('/report-issue')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="log-out-outline"
              iconBg="#fff1f1"
              iconColor={COLORS.danger}
              label="Log Out"
              danger
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
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
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.textSecondary,
    paddingLeft: 8,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  dangerText: {
    color: COLORS.danger,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    letterSpacing: -0.08,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
  },
});
