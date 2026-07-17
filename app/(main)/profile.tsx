import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spinner } from '@/components/taskhub/spinner';
import { useSavedTaskers } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { loginOrCreateDevAccount } from '@/lib/auth/dev-auth';

import BadgeVerified from '@/assets/icons/badge-verified.svg';
import CaretRightMuted from '@/assets/icons/caret-right-muted.svg';
import CaretRight from '@/assets/icons/caret-right.svg';
import GearSix from '@/assets/icons/gear-six.svg';
import Heart from '@/assets/icons/heart.svg';
import PencilEdit from '@/assets/icons/pencil-edit.svg';
import PencilSimple from '@/assets/icons/pencil-simple.svg';
import Question from '@/assets/icons/question.svg';
import ShieldSuccess from '@/assets/icons/shield-success.svg';
import SignOut from '@/assets/icons/sign-out.svg';
import StarAmber from '@/assets/icons/star-amber.svg';
import Swap from '@/assets/icons/swap.svg';
import User from '@/assets/icons/user.svg';
import Wallet from '@/assets/icons/wallet.svg';
import VerificationRing from '@/assets/icons/verification-ring.svg';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  elevated: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  brandMuted: '#e4d6ff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  textBrandStrong: '#4621c0',
  onBrand: '#ffffff',
  infoBg: '#eff6ff',
  errorBg: '#fff1f1',
  errorText: '#b01515',
  warningBg: '#fffbea',
  warningText: '#b45309',
  successBg: '#edfaf3',
  successText: '#0d6639',
  draftBg: '#f2f2f7',
};

type MenuItem = {
  key: string;
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  danger?: boolean;
  badge?: string;
  badgeColor?: string;
};

const MENU_GROUP_ACCOUNT: MenuItem[] = [
  {
    key: 'edit-profile',
    label: 'Edit Profile',
    iconBg: COLORS.infoBg,
    icon: <PencilEdit width={18} height={18} />,
  },
  {
    key: 'saved-taskers',
    label: 'Saved Taskers',
    iconBg: COLORS.errorBg,
    icon: <Heart width={18} height={18} />,
  },
  {
    key: 'my-reviews',
    label: 'My Reviews',
    iconBg: COLORS.warningBg,
    icon: <StarAmber width={18} height={18} />,
  },
  {
    key: 'wallet-payment',
    label: 'Wallet Payment',
    iconBg: COLORS.successBg,
    icon: <Wallet width={18} height={18} />,
  },
];

const TASKER_MENU_GROUP_ACCOUNT: MenuItem[] = [
  {
    key: 'wallet',
    label: 'Wallet & Earnings',
    iconBg: COLORS.infoBg,
    icon: <Wallet width={18} height={18} />,
  },
  {
    key: 'edit-profile',
    label: 'Personal Information',
    iconBg: '#eef6ff',
    icon: <PencilEdit width={18} height={18} />,
  },
  {
    key: 'services',
    label: 'Services',
    iconBg: '#f5f0ff',
    icon: <MaterialCommunityIcons name="briefcase-outline" size={18} color={COLORS.brand} />,
    badge: 'Pending',
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    iconBg: '#fff4e5',
    icon: <MaterialCommunityIcons name="image-multiple-outline" size={18} color="#e07b00" />,
    badge: 'Pending',
  },
  {
    key: 'verification',
    label: 'Verification',
    iconBg: COLORS.successBg,
    icon: <ShieldSuccess width={18} height={18} />,
    badge: 'Pending',
    badgeColor: COLORS.warningText,
  },
  {
    key: 'availability',
    label: 'Availability',
    iconBg: COLORS.draftBg,
    icon: <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#555" />,
  },
];

const TASKER_MENU_GROUP_EARNINGS: MenuItem[] = [
  {
    key: 'my-reviews',
    label: 'Reviews',
    iconBg: COLORS.warningBg,
    icon: <StarAmber width={18} height={18} />,
  },
  {
    key: 'bank-account',
    label: 'Bank Account',
    iconBg: COLORS.successBg,
    icon: <Wallet width={18} height={18} />,
  },
  {
    key: 'analytics',
    label: 'Performance',
    iconBg: '#f0f0f8',
    icon: <MaterialCommunityIcons name="chart-bar" size={18} color={COLORS.brand} />,
  },
  {
    key: 'payment-history',
    label: 'Payment History',
    iconBg: '#eef6ff',
    icon: <MaterialCommunityIcons name="receipt" size={18} color="#2563eb" />,
  },
];

const MENU_GROUP_GENERAL: MenuItem[] = [
  {
    key: 'verification',
    label: 'Verification',
    iconBg: COLORS.successBg,
    icon: <ShieldSuccess width={18} height={18} />,
  },
  {
    key: 'settings',
    label: 'Settings',
    iconBg: COLORS.draftBg,
    icon: <GearSix width={18} height={18} />,
  },
  {
    key: 'notifications',
    label: 'Notification',
    iconBg: COLORS.infoBg,
    icon: <MaterialCommunityIcons name="bell-outline" size={18} color="#2563eb" />,
  },
  {
    key: 'help',
    label: 'Help & Support',
    iconBg: COLORS.infoBg,
    icon: <Question width={18} height={18} />,
  },
];

const MENU_GROUP_LOGOUT: MenuItem[] = [
  {
    key: 'logout',
    label: 'Log Out',
    iconBg: COLORS.errorBg,
    icon: <SignOut width={18} height={18} />,
    danger: true,
  },
];

function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} hitSlop={4}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>{item.icon}</View>
        <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
      </View>
      <View style={styles.menuRight}>
        {item.badge && (
          <Text style={[styles.menuBadge, item.badgeColor ? { color: item.badgeColor } : {}]}>
            {item.badge}
          </Text>
        )}
        <CaretRightMuted width={9} height={12} />
      </View>
    </Pressable>
  );
}

function MenuCard({ items, onItemPress }: { items: MenuItem[]; onItemPress: (key: string) => void }) {
  return (
    <View style={styles.menuCard}>
      {items.map((item) => (
        <MenuRow key={item.key} item={item} onPress={() => onItemPress(item.key)} />
      ))}
    </View>
  );
}

/** `Elliot Eniola` -> `EE`. Falls back to the first letter of the email. */
function initialsOf(name: string, email: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return (letters.join('') || email[0] || '?').toUpperCase();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, accountType, token, setSession, isBootstrapping, signOut, signIn } = useAuth();
  const [isDevLoading, setIsDevLoading] = useState(false);

  const isExpoGo = Constants?.appOwnership === 'expo';

  // The Saved tile reads from the live query rather than the (cached) user
  // object, so it updates as soon as a tasker is saved or unsaved.
  const { data: saved } = useSavedTaskers();

  const handleStartTaskerTest = async () => {
    setIsDevLoading(true);
    try {
      await loginOrCreateDevAccount('tasker', signIn);
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Developer Login Failed', err.message || 'Something went wrong.');
    } finally {
      setIsDevLoading(false);
    }
  };

  const handleSwitchMode = async () => {
    if (token && user) {
      const nextType = accountType === 'user' ? 'tasker' : 'user';
      try {
        await setSession(nextType, token, user);
        Alert.alert('Success', `Switched to ${nextType === 'tasker' ? 'Tasker' : 'Customer'} mode.`);
        router.replace('/home');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not switch mode.');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleMenuPress = (key: string) => {
    if (key === 'edit-profile') {
      router.push('/edit-profile');
    } else if (key === 'saved-taskers') {
      router.push('/saved-taskers');
    } else if (key === 'my-reviews') {
      router.push('/my-reviews');
    } else if (key === 'settings') {
      router.push('/settings');
    } else if (key === 'wallet' || key === 'wallet-payment') {
      router.push('/wallet');
    } else if (key === 'verification') {
      router.push('/select-verification');
    } else if (key === 'services') {
      router.push('/tasker-services');
    } else if (key === 'portfolio') {
      router.push('/tasker-portfolio');
    } else if (key === 'help') {
      router.push('/help-support');
    } else if (key === 'logout') {
      handleLogout();
    } else if (key === 'analytics') {
      router.push('/performance' as any);
    } else if (key === 'payment-history') {
      router.push('/transaction-history');
    } else if (key === 'bank-account') {
      router.push('/bank-account');
    } else if (key === 'notifications') {
      router.push('/notifications');
    }
  };

  if (isBootstrapping) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Spinner />
      </View>
    );
  }

  // There's no auth guard on the tab group, so this screen can be reached
  // signed-out (e.g. after a token expiry clears the session).
  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Text style={styles.emptyTitle}>You&apos;re signed out</Text>
        <Text style={styles.emptyBody}>Log in to see your profile.</Text>
        <Pressable
          style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          onPress={() => router.replace('/login')}>
          <Text style={styles.emptyButtonLabel}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  const name =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.emailAddress.split('@')[0];

  const isVerified = Boolean(user.isKYCVerified);
  const savedCount = saved?.count ?? user.savedTaskersCount ?? 0;

  const stats = [
    { value: user.tasksPostedCount ?? 0, label: 'Task Posted' },
    { value: user.reviewsGivenCount ?? 0, label: 'Reviews' },
    { value: savedCount, label: 'Saved' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.heading}>Profile</Text>
        <Pressable hitSlop={8} onPress={() => handleMenuPress('settings')}>
          <GearSix width={24} height={24} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Profile details */}
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initialsOf(name, user.emailAddress)}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileMain}>
            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user.emailAddress}
              </Text>
              <View style={styles.badgeRow}>
                {isVerified ? (
                  <View style={[styles.tag, { backgroundColor: COLORS.successBg }]}>
                    <BadgeVerified width={16} height={16} />
                    <Text style={[styles.tagText, { color: COLORS.successText }]}>Verified</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.tag, { backgroundColor: COLORS.warningBg }]}
                    onPress={() => handleMenuPress('verification')}
                    hitSlop={4}>
                    <Text style={[styles.tagText, { color: COLORS.warningText }]}>
                      Verify identity
                    </Text>
                  </Pressable>
                )}
                <View style={[styles.tag, { backgroundColor: COLORS.brandSubtle }]}>
                  <User width={16} height={16} />
                  <Text style={[styles.tagText, { color: COLORS.textBrandStrong }]}>
                    {accountType === 'tasker' ? 'Tasker' : 'User'}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable hitSlop={8} onPress={() => handleMenuPress('edit-profile')}>
              <PencilSimple width={18} height={18} />
            </Pressable>
          </View>
        </View>

        {/* User stats row (non-tasker only) */}
        {accountType !== 'tasker' && (
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tasker: Verification & Profile Card first */}
        {accountType === 'tasker' && (
          <Pressable style={styles.taskerProfileVerifyCard} onPress={() => router.push('/select-verification')}>
            <View style={styles.ring}>
              <VerificationRing width={51} height={51} style={styles.ringImage} color={COLORS.brand} />
              <Text style={styles.ringText}>60</Text>
            </View>
            <View style={styles.taskerVerifyText}>
              <Text style={styles.taskerVerifyTitle}>Complete Verification & Profile</Text>
              <Text style={styles.taskerVerifySubtitle}>Add profile Photo</Text>
            </View>
            <CaretRight width={9} height={12} color={COLORS.brand} />
          </Pressable>
        )}

        {/* Tasker: Performance button row */}
        {accountType === 'tasker' && (
          <Pressable style={styles.performanceCard} onPress={() => router.push('/performance' as any)}>
            <View style={styles.performanceHeader}>
              <View style={styles.performanceIconWrap}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.brand} />
              </View>
              <View style={styles.performanceHeaderText}>
                <Text style={styles.performanceTitle}>Performance</Text>
                <Text style={styles.performanceSubtitle}>View your analytics & insights</Text>
              </View>
              <CaretRight width={9} height={12} />
            </View>
          </Pressable>
        )}

        {/* Tasker: 4 individual stat cards */}
        {accountType === 'tasker' && (
          <View style={styles.taskerStatCards}>
            {[
              { value: '8', label: 'Rating' },
              { value: '82%', label: 'Accept' },
              { value: '5', label: 'Complete' },
              { value: '3mins', label: 'Response' },
            ].map((s) => (
              <View key={s.label} style={styles.taskerStatCard}>
                <Text style={styles.taskerStatValue}>{s.value}</Text>
                <Text style={styles.taskerStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Switch Card */}
        <Pressable style={styles.taskerCard} onPress={handleSwitchMode}>
          <View style={styles.taskerIcon}>
            <Swap width={24} height={24} />
          </View>
          <View style={styles.taskerText}>
            <Text style={styles.taskerTitle}>
              {accountType === 'tasker' ? 'Switch to user mode' : 'Switch to Tasker mode'}
            </Text>
            <Text style={styles.taskerSubtitle}>
              {accountType === 'tasker'
                ? 'Earn money by completing tasks'
                : 'Earn money by completing tasks'}
            </Text>
          </View>
          <CaretRight width={9} height={12} />
        </Pressable>

        {isExpoGo && (
          <Pressable
            style={[styles.taskerCard, styles.devCard, isDevLoading && styles.disabledCard]}
            onPress={handleStartTaskerTest}
            disabled={isDevLoading}>
            <View style={styles.taskerIcon}>
              <MaterialCommunityIcons name="developer-board" size={24} color={COLORS.brand} />
            </View>
            <View style={styles.taskerText}>
              {isDevLoading ? (
                <ActivityIndicator color={COLORS.onBrand} size="small" />
              ) : (
                <>
                  <Text style={styles.taskerTitle}>Start Tasker Test</Text>
                  <Text style={styles.taskerSubtitle}>Switch to developer/test tasker account</Text>
                </>
              )}
            </View>
            {!isDevLoading && <CaretRight width={9} height={12} />}
          </Pressable>
        )}

        {/* Menu groups */}
        <MenuCard
          items={accountType === 'tasker' ? TASKER_MENU_GROUP_ACCOUNT : MENU_GROUP_ACCOUNT}
          onItemPress={handleMenuPress}
        />
        {accountType === 'tasker' && (
          <MenuCard items={TASKER_MENU_GROUP_EARNINGS} onItemPress={handleMenuPress} />
        )}
        <MenuCard items={MENU_GROUP_GENERAL} onItemPress={handleMenuPress} />
        <MenuCard items={MENU_GROUP_LOGOUT} onItemPress={handleMenuPress} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  // Signed-out fallback
  emptyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  emptyButton: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.onBrand,
  },
  pressed: { opacity: 0.9 },
  topBar: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  heading: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  // Profile details
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#4621c0',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.45,
    color: COLORS.onBrand,
  },
  profileMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  email: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: 8,
    gap: 4,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  // Switch to tasker
  taskerCard: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  taskerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskerText: {
    flex: 1,
    gap: 2,
  },
  taskerTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.onBrand,
  },
  taskerSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.onBrand,
  },
  devCard: {
    backgroundColor: '#1e293b',
    marginTop: -8, // pull closer to the switch tasker card or customize spacing
  },
  disabledCard: {
    opacity: 0.6,
  },
  // Menu
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  menuLabelDanger: {
    color: COLORS.errorText,
  },
  // Performance Card Styles
  performanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0ea',
    overflow: 'hidden',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  performanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceHeaderText: {
    flex: 1,
    gap: 2,
  },
  performanceTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  performanceSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  performanceStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
  },
  performanceStatItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  performanceDivider: {
    width: 1,
    backgroundColor: '#f0f0f5',
    marginVertical: 10,
  },
  performanceStatValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  performanceStatLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Menu badge
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  taskerProfileVerifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandSubtle,
    borderWidth: 1,
    borderColor: COLORS.brandMuted,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  taskerVerifyText: {
    flex: 1,
    gap: 4,
  },
  taskerVerifyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  taskerVerifySubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.brand,
  },
  ring: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 51,
    height: 51,
  },
  ringImage: {
    position: 'absolute',
  },
  ringText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
  // 4 individual tasker stat cards
  taskerStatCards: {
    flexDirection: 'row',
    gap: 8,
  },
  taskerStatCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  taskerStatValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  taskerStatLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
