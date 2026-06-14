import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  successBg: '#edfaf3',
  successText: '#0d6639',
  draftBg: '#f2f2f7',
};

const AVATAR = require('@/assets/images/taskers/tasker-1.png');

type Stat = { value: string; label: string };

const STATS: Stat[] = [
  { value: '8', label: 'Task Posted' },
  { value: '6', label: 'Reviews' },
  { value: '5', label: 'Saved' },
];

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleMenuPress = (key: string) => {
    // Wire individual destinations as those screens are built.
    if (key === 'edit-profile') {
      router.push('/edit-profile');
    } else if (key === 'logout') {
      router.replace('/login');
    }
  };

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
            <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
          </View>
          <View style={styles.profileMain}>
            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>
                Elliot Eniola
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                ellioteniolasamuel@gmail.com
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.tag, { backgroundColor: COLORS.successBg }]}>
                  <BadgeVerified width={16} height={16} />
                  <Text style={[styles.tagText, { color: COLORS.successText }]}>Verified</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: COLORS.brandSubtle }]}>
                  <User width={16} height={16} />
                  <Text style={[styles.tagText, { color: COLORS.textBrandStrong }]}>Customer</Text>
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
          {STATS.map((stat) => (
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
