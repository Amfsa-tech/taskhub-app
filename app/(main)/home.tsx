import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Bell from '@/assets/icons/bell.svg';
import CaretDown from '@/assets/icons/caret-down.svg';
import CaretRight from '@/assets/icons/caret-right.svg';
import Clock from '@/assets/icons/clock.svg';
import GraduationCap from '@/assets/icons/graduation-cap.svg';
import HouseLine from '@/assets/icons/house-line.svg';
import Laptop from '@/assets/icons/laptop.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import Microphone from '@/assets/icons/microphone.svg';
import Package from '@/assets/icons/package.svg';
import PaperPlaneTilt from '@/assets/icons/paper-plane-tilt.svg';
import RatingDot from '@/assets/icons/rating-dot.svg';
import Sparkle from '@/assets/icons/sparkle.svg';
import Star from '@/assets/icons/star.svg';
import VerificationRing from '@/assets/icons/verification-ring.svg';
import Wallet from '@/assets/icons/wallet.svg';

import { ActiveTasks } from '@/components/taskhub/active-tasks';
import { useLocation } from '@/context/LocationContext';
import { queryKeys, useNearbyTaskers, useNotifications } from '@/lib/api/queries';
import type { TaskerMatch } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';

function initialsOf(name: string, email: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return (letters.join('') || email[0] || '?').toUpperCase();
}

// Colours pulled directly from the Figma design tokens (light theme).
const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  elevated: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  brandMuted: '#e4d6ff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  textPlaceholder: '#a0a0ba',
  onBrand: '#ffffff',
  infoBg: '#eff6ff',
  warningBg: '#fffbea',
  successBg: '#edfaf3',
  purple50: '#f3eeff',
};

type Category = { key: string; label: string; bg: string; icon: React.ReactNode };

const CATEGORIES: Category[] = [
  { key: 'campus', label: 'Campus', bg: COLORS.purple50, icon: <GraduationCap width={24} height={24} /> },
  { key: 'local', label: 'Local', bg: COLORS.infoBg, icon: <HouseLine width={24} height={24} /> },
  { key: 'errands', label: 'Errands', bg: COLORS.warningBg, icon: <Package width={24} height={24} /> },
  { key: 'remote', label: 'Remote', bg: COLORS.successBg, icon: <Laptop width={24} height={24} /> },
];

type TaskerVM = {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  rating: string;
  jobs: string;
  specialty: string;
};

/** `Chioma A.` from a populated tasker ref. */
function taskerShortName(t: TaskerMatch): string {
  const first = t.firstName?.trim() ?? '';
  const lastInitial = t.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

function taskerToVM(t: TaskerMatch): TaskerVM {
  const name = taskerShortName(t);
  return {
    id: t._id,
    name,
    avatar: t.profilePicture || '',
    initials: (name.match(/\b\w/g)?.slice(0, 2).join('') || '?').toUpperCase(),
    rating: t.averageRating != null && t.averageRating > 0 ? t.averageRating.toFixed(1) : 'New',
    jobs: `${t.completedJobs ?? 0} ${t.completedJobs === 1 ? 'Job' : 'Jobs'}`,
    specialty: t.primaryCategory || t.area || t.residentState || 'Available',
  };
}

function TaskerCard({ tasker, onPress }: { tasker: TaskerVM; onPress: () => void }) {
  return (
    <Pressable style={styles.taskerCard} onPress={onPress}>
      <View style={styles.taskerImageWrap}>
        {tasker.avatar ? (
          <Image source={{ uri: tasker.avatar }} style={styles.taskerImage} contentFit="cover" />
        ) : (
          <View style={styles.taskerImageFallback}>
            <Text style={styles.taskerInitials}>{tasker.initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.taskerInfo}>
        <Text style={styles.taskerName} numberOfLines={1}>
          {tasker.name}
        </Text>
        <View style={styles.ratingRow}>
          <View style={styles.starRow}>
            <Star width={18} height={18} />
            <Text style={styles.ratingValue}>{tasker.rating}</Text>
          </View>
          <RatingDot width={6} height={6} />
          <Text style={styles.ratingValue}>{tasker.jobs}</Text>
        </View>
        <Text style={styles.taskerSpecialty} numberOfLines={1}>
          {tasker.specialty}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedLocation, isLoadingLocation } = useLocation();
  const { user, accountType } = useAuth();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.data?.unreadCount ?? 0;

  const isTasker = accountType === 'tasker';

  const nearby = useNearbyTaskers();
  const topTaskers = (nearby.data?.data ?? []).map(taskerToVM);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // `ActiveTasks` owns its own `useUserTasks` query, so refresh by key rather
  // than by handle — that covers the active-tasks list and the bell badge.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['tasks'] }),
        queryClient.refetchQueries({ queryKey: queryKeys.notifications() }),
        queryClient.refetchQueries({ queryKey: queryKeys.nearbyTaskers() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Users have `fullName`; taskers have `firstName`. Fall back gracefully.
  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] || user?.firstName || 'there';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBarLeft}>
          {isTasker && (
            <Pressable onPress={() => router.push('/profile')} style={styles.headerAvatarWrap}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.headerAvatar} contentFit="cover" />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarInitials}>{initialsOf(firstName, user?.emailAddress ?? '')}</Text>
                </View>
              )}
            </Pressable>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Pressable
              style={styles.locationRow}
              hitSlop={8}
              onPress={() => router.push('/location-selector-modal')}
            >
              <MapPin width={18} height={18} />
              <Text style={styles.locationText} numberOfLines={1}>
                {isLoadingLocation
                  ? 'Loading...'
                  : ((selectedLocation || 'UI Main gate').length > 10
                    ? (selectedLocation || 'UI Main gate').substring(0, 10) + '...'
                    : (selectedLocation || 'UI Main gate'))
                }
              </Text>
              <CaretDown width={12} height={18} />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.bellButton}
          hitSlop={8}
          onPress={() => router.push('/notifications')}>
          <Bell width={20} height={20} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isTasker ? (
        <TaskerHomeView refreshing={refreshing} onRefresh={onRefresh} insets={insets} user={user} router={router} />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.brand}
              colors={[COLORS.brand]}
            />
          }>
          {/* Account verification card */}
          <Pressable style={styles.verifyCard} onPress={() => { }}>
            <View style={styles.ring}>
              <VerificationRing width={51} height={51} style={styles.ringImage} color="#ffffff" />
              <Text style={styles.ringText}>60</Text>
            </View>
            <View style={styles.verifyText}>
              <Text style={styles.verifyTitle}>Complete Verification & Profile</Text>
              <Text style={styles.verifySubtitle}>Hire Taskers with more confidence</Text>
            </View>
            <CaretRight width={9} height={24} />
          </Pressable>

          {/* AI Quick Post */}
          <View style={styles.quickPost}>
            <View style={styles.quickPostHeader}>
              <View style={styles.quickPostLabelRow}>
                <Sparkle width={18} height={18} />
                <Text style={styles.quickPostLabel}>AI Quick Post</Text>
              </View>
              <Text style={styles.quickPostPrompt}>What do you need help with?</Text>
            </View>

            <Pressable style={styles.exampleCard} onPress={() => router.push('/post')}>
              <Text style={styles.examplePlaceholder}>e.g Print my assignment, fix my laptop</Text>
              <View style={styles.exampleActions}>
                <View style={[styles.roundIcon, { backgroundColor: COLORS.brandSubtle }]}>
                  <Microphone width={24} height={24} />
                </View>
                <View style={[styles.roundIcon, { backgroundColor: COLORS.brandMuted }]}>
                  <PaperPlaneTilt width={24} height={24} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Quick Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Category</Text>
            <View style={styles.categoryCard}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat.key} style={styles.categoryItem} onPress={() => router.push('/post')}>
                  <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>{cat.icon}</View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Top Taskers */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Top Taskers near you</Text>
              <Pressable hitSlop={8} onPress={() => { }}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {nearby.isLoading ? (
              <View style={styles.taskerState}>
                <ActivityIndicator color={COLORS.brand} />
              </View>
            ) : topTaskers.length === 0 ? (
              <View style={styles.taskerState}>
                <Text style={styles.taskerEmpty}>No taskers available yet.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.taskerRow}>
                {topTaskers.map((tasker) => (
                  <TaskerCard
                    key={tasker.id}
                    tasker={tasker}
                    onPress={() =>
                      router.push({
                        pathname: '/tasker-profile',
                        params: { id: tasker.id, name: tasker.name },
                      })
                    }
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Your Active Tasks */}
          <ActiveTasks
            onTaskPress={(taskId) => router.push({ pathname: '/task-details', params: { id: taskId } })}
          />
        </ScrollView>
      )}
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
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userInfo: {
    gap: 8,
  },
  greeting: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    paddingRight: 16,
  },
  locationText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.onBrand,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  // Account verification
  verifyCard: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
  },
  ring: {
    width: 51,
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.brand
  },
  ringImage: {
    position: 'absolute',
    width: 51,
    height: 51,
  },
  ringText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.brand,
  },
  verifyText: {
    flex: 1,
    gap: 4,
  },
  verifyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: COLORS.onBrand,
  },
  verifySubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.onBrand,
  },
  // AI Quick Post
  quickPost: {
    gap: 16,
  },
  quickPostHeader: {
    alignItems: 'center',
    gap: 8,
  },
  quickPostLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickPostLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.32,
    color: COLORS.brand,
  },
  quickPostPrompt: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  exampleCard: {
    backgroundColor: COLORS.elevated,
    height: 149,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  examplePlaceholder: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPlaceholder,
  },
  exampleActions: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  // Quick Category
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: 62,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Top Taskers
  taskerState: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskerEmpty: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    letterSpacing: -0.16,
    color: COLORS.textSecondary,
  },
  taskerRow: {
    gap: 16,
    paddingRight: 16,
  },
  taskerCard: {
    backgroundColor: COLORS.elevated,
    width: 153,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  taskerImageWrap: {
    width: '100%',
    height: 89,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.brandSubtle,
  },
  taskerImage: {
    width: '100%',
    height: '100%',
  },
  taskerImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  taskerInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.45,
    color: COLORS.onBrand,
  },
  taskerInfo: {
    gap: 4,
    alignItems: 'center',
  },
  taskerName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  taskerSpecialty: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.brand,
    textAlign: 'center',
    width: '100%',
  },
  // Tasker Dashboard Styles
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.brand,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  headerAvatarInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.onBrand,
  },
  taskerStatsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  taskerStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  taskerStatCardWhite: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  taskerStatHeader: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskerStatLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  taskerStatValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: COLORS.onBrand,
  },
  taskerVerifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandSubtle,
    borderWidth: 1,
    borderColor: COLORS.brandMuted,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
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
  taskerSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  taskerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskerSectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  taskerSectionLink: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.brand,
  },
  taskerJobCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0ea',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  taskerJobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskerJobCardPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  taskerJobCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskerJobCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  taskerJobCardTitleBold: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  taskerJobCardBids: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.brand,
  },
  taskerJobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taskerJobCardClient: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  taskerJobCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  taskerJobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskerJobMetaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressBarWrapper: {
    marginTop: 8,
  },
  segmentBar: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 999,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagRemote: {
    backgroundColor: '#edfaf3',
  },
  tagRemoteText: {
    color: '#0d6639',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagLocal: {
    backgroundColor: '#eff6ff',
  },
  tagLocalText: {
    color: '#1e88e5',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagErrand: {
    backgroundColor: '#fffbea',
  },
  tagErrandText: {
    color: '#b45309',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
});

type TaskerHomeViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  insets: any;
  user: any;
  router: any;
};

function TaskerHomeView({ refreshing, onRefresh, insets, user, router }: TaskerHomeViewProps) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.brand}
          colors={[COLORS.brand]}
        />
      }>
      {/* Earnings and Wallet Cards */}
      <View style={styles.taskerStatsRow}>
        <View style={[styles.taskerStatCard, { backgroundColor: COLORS.brand }]}>
          <View style={styles.taskerStatHeader}>
            <MaterialCommunityIcons name="arrow-top-right" size={24} color={COLORS.onBrand} />
          </View>
          <Text style={styles.taskerStatLabel}>Today's Earnings</Text>
          <Text style={styles.taskerStatValue}>₦7,500</Text>
        </View>

        <View style={[styles.taskerStatCard, styles.taskerStatCardWhite]}>
          <View style={styles.taskerStatHeader}>
            <Wallet width={24} height={24} color={COLORS.brand} />
          </View>
          <Text style={[styles.taskerStatLabel, { color: COLORS.textSecondary }]}>Wallet Balance</Text>
          <Text style={[styles.taskerStatValue, { color: COLORS.textPrimary }]}>₦24,300</Text>
        </View>
      </View>

      {/* Complete Verification & Profile Card */}
      <Pressable style={styles.taskerVerifyCard} onPress={() => router.push('/select-verification')}>
        <View style={styles.ring}>
          <VerificationRing width={51} height={51} style={styles.ringImage} color={COLORS.brand} />
          <Text style={styles.ringText}>60</Text>
        </View>
        <View style={styles.taskerVerifyText}>
          <Text style={styles.taskerVerifyTitle}>Complete Verification & Profile</Text>
          <Text style={styles.taskerVerifySubtitle}>Add profile Photo</Text>
        </View>
        <CaretRight width={9} height={24} color={COLORS.brand} />
      </Pressable>

      {/* Pending Invitation Section */}
      <View style={styles.taskerSection}>
        <View style={styles.taskerSectionHeader}>
          <Text style={styles.taskerSectionTitle}>Pending Invitation</Text>
          <Pressable onPress={() => router.push('/tasks')}>
            <Text style={styles.taskerSectionLink}>View all</Text>
          </Pressable>
        </View>

        <Pressable style={styles.taskerJobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: '3' } })}>
          <View style={styles.taskerJobCardTop}>
            <View style={[styles.tag, styles.tagRemote]}>
              <Text style={styles.tagRemoteText}>Remote</Text>
            </View>
            <Text style={styles.taskerJobCardPrice}>₦1,000</Text>
          </View>
          <View style={styles.taskerJobCardMain}>
            <Text style={styles.taskerJobCardTitle}>Build a App</Text>
            <CaretRight width={9} height={24} />
          </View>
          <View style={styles.taskerJobCardFooter}>
            <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.taskerJobCardClient}>Sarah K.</Text>
          </View>
        </Pressable>
      </View>

      {/* Recommended Jobs Section */}
      <View style={styles.taskerSection}>
        <View style={styles.taskerSectionHeader}>
          <Text style={styles.taskerSectionTitle}>Recommended Jobs</Text>
          <Pressable onPress={() => router.push('/discover')}>
            <Text style={styles.taskerSectionLink}>Discover</Text>
          </Pressable>
        </View>

        <Pressable style={styles.taskerJobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: '5' } })}>
          <View style={styles.taskerJobCardTop}>
            <View style={[styles.tag, styles.tagLocal]}>
              <Text style={styles.tagLocalText}>Local</Text>
            </View>
            <Text style={styles.taskerJobCardPrice}>₦20,000</Text>
          </View>
          <View style={styles.taskerJobCardMain}>
            <Text style={styles.taskerJobCardTitle}>Fix my Laptop Screen</Text>
            <Text style={styles.taskerJobCardBids}>2 Bids</Text>
          </View>
          <View style={styles.taskerJobCardMeta}>
            <View style={styles.taskerJobMetaItem}>
              <MapPin width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>UI Main gate</Text>
            </View>
            <View style={styles.taskerJobMetaItem}>
              <Clock width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>18 May</Text>
            </View>
          </View>
        </Pressable>

        <Pressable style={styles.taskerJobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: '6' } })}>
          <View style={styles.taskerJobCardTop}>
            <View style={[styles.tag, styles.tagErrand]}>
              <Text style={styles.tagErrandText}>Errand</Text>
            </View>
            <Text style={styles.taskerJobCardPrice}>₦2,000</Text>
          </View>
          <View style={styles.taskerJobCardMain}>
            <Text style={styles.taskerJobCardTitle}>Deliver Package to Lekki</Text>
            <Text style={styles.taskerJobCardBids}>5 Bids</Text>
          </View>
          <View style={styles.taskerJobCardMeta}>
            <View style={styles.taskerJobMetaItem}>
              <MapPin width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>Yaba → Lekki</Text>
            </View>
            <View style={styles.taskerJobMetaItem}>
              <Clock width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>10mins ago</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Jobs in progress Section */}
      <View style={styles.taskerSection}>
        <View style={styles.taskerSectionHeader}>
          <Text style={styles.taskerSectionTitle}>Jobs in progress</Text>
          <Pressable onPress={() => router.push('/tasks')}>
            <Text style={styles.taskerSectionLink}>Discover</Text>
          </Pressable>
        </View>

        <Pressable style={styles.taskerJobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: '1' } })}>
          <View style={styles.taskerJobCardTop}>
            <Text style={styles.taskerJobCardTitleBold}>Deliver a flyer for an Event</Text>
            <Text style={styles.taskerJobCardPrice}>₦1,000</Text>
          </View>
          <View style={styles.taskerJobCardMeta}>
            <View style={styles.taskerJobMetaItem}>
              <Clock width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>Sarah K.</Text>
            </View>
            <View style={styles.taskerJobMetaItem}>
              <MapPin width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>21km</Text>
            </View>
          </View>
          <View style={styles.progressBarWrapper}>
            <SegmentedProgressBar total={4} active={2} />
          </View>
        </Pressable>

        <Pressable style={styles.taskerJobCard} onPress={() => router.push({ pathname: '/task-details', params: { id: '4' } })}>
          <View style={styles.taskerJobCardTop}>
            <Text style={styles.taskerJobCardTitleBold}>Deliver Package to Junction</Text>
            <Text style={styles.taskerJobCardPrice}>₦1,000</Text>
          </View>
          <View style={styles.taskerJobCardMeta}>
            <View style={styles.taskerJobMetaItem}>
              <Clock width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>Sarah K.</Text>
            </View>
            <View style={styles.taskerJobMetaItem}>
              <MapPin width={14} height={14} color={COLORS.textSecondary} />
              <Text style={styles.taskerJobMetaText}>21km</Text>
            </View>
          </View>
          <View style={styles.progressBarWrapper}>
            <SegmentedProgressBar total={5} active={3} />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SegmentedProgressBar({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.segmentBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < active ? COLORS.brand : '#e0e0ea' }
          ]}
        />
      ))}
    </View>
  );
}

