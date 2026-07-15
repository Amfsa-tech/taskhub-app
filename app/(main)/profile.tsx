import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spinner } from '@/components/taskhub/spinner';
import { useSavedTaskers } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';

import BadgeVerified from '@/assets/icons/badge-verified.svg';
import CaretRight from '@/assets/icons/caret-right.svg';
import CaretRightMuted from '@/assets/icons/caret-right-muted.svg';
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

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  elevated: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
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
    key: 'help',
    label: 'Help and Support',
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
      <CaretRightMuted width={20} height={20} />
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
  const { user, accountType, isBootstrapping, signOut } = useAuth();

  // The Saved tile reads from the live query rather than the (cached) user
  // object, so it updates as soon as a tasker is saved or unsaved.
  const { data: saved } = useSavedTaskers();

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
    } else if (key === 'wallet-payment') {
      router.push('/wallet');
    } else if (key === 'verification') {
      router.push('/select-verification');
    } else if (key === 'help') {
      router.push('/help-support');
    } else if (key === 'logout') {
      handleLogout();
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
                    {accountType === 'tasker' ? 'Tasker' : 'Customer'}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable hitSlop={8} onPress={() => handleMenuPress('edit-profile')}>
              <PencilSimple width={18} height={18} />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Switch to tasker mode */}
        <Pressable style={styles.taskerCard} onPress={() => {}}>
          <View style={styles.taskerIcon}>
            <Swap width={24} height={24} />
          </View>
          <View style={styles.taskerText}>
            <Text style={styles.taskerTitle}>Switch to tasker mode</Text>
            <Text style={styles.taskerSubtitle}>Earn money by completing tasks</Text>
          </View>
          <CaretRight width={9} height={16} />
        </Pressable>

        {/* Menu groups */}
        <MenuCard items={MENU_GROUP_ACCOUNT} onItemPress={handleMenuPress} />
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
});
