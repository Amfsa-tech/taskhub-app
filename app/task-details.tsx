import { Image } from 'expo-image';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowLeft from '@/assets/icons/arrow-left.svg';
import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import RatingDot from '@/assets/icons/rating-dot.svg';
import Shield from '@/assets/icons/shield.svg';
import Star from '@/assets/icons/star.svg';
import { InviteToBidModal } from '@/components/taskhub/invite-to-bid-modal';
import { ReadyToHireModal } from '@/components/taskhub/ready-to-hire-modal';
import { TaskActionsModal } from '@/components/taskhub/task-actions-modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandStrong: '#4621c0',
  pillBg: '#f3eeff',
  successBg: '#edfaf3',
  successText: '#0d6639',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

type Match = {
  name: string;
  match: string;
  rating: string;
  jobs: string;
  distance: string;
  tags: string[];
  avatar: ImageSourcePropType;
  price?: string;
};

const MATCHES: Match[] = [
  {
    name: 'Chioma. A',
    match: '96% match',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    tags: ['Printing', 'Assignment'],
    avatar: require('@/assets/images/chats/chat-1.png'),
    price: '₦1,500',
  },
  {
    name: 'Tunde .O',
    match: '96% match',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    tags: ['Printing'],
    avatar: require('@/assets/images/chats/chat-2.jpg'),
    price: '₦1,800',
  },
];

type Bid = {
  name: string;
  price: string;
  rating: string;
  jobs: string;
  distance: string;
  message: string;
  avatar: ImageSourcePropType;
};

const BIDS: Bid[] = [
  {
    name: 'Chioma. A',
    price: '₦1,500',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    message: "I can print and deliver within 30 minutes. I'm close to Zik Hall.",
    avatar: require('@/assets/images/chats/chat-1.png'),
  },
  {
    name: 'Hassan. A',
    price: '₦1,500',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    message: 'Will handle this right away. Sharp printing guaranteed.',
    avatar: require('@/assets/images/chats/chat-3.jpg'),
  },
];

function Dot() {
  return <RatingDot width={6} height={6} />;
}

function MatchedCard({ match, onInvite, onHire }: { match: Match; onInvite: () => void, onHire: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          <Image source={match.avatar} style={styles.avatar} contentFit="cover" />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{match.name}</Text>
            <View style={[styles.badge, { backgroundColor: COLORS.successBg }]}>
              <Text style={[styles.badgeText, { color: COLORS.successText }]}>{match.match}</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingItem}>
              <Star width={18} height={18} />
              <Text style={styles.metaText}>{match.rating}</Text>
            </View>
            <Dot />
            <Text style={styles.metaText}>{match.jobs}</Text>
            <Dot />
            <Text style={styles.metaText}>{match.distance}</Text>
          </View>

          <View style={styles.tags}>
            {match.tags.map((tag) => (
              <View key={tag} style={styles.pill}>
                <Text style={styles.pillText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onInvite}>
          <Text style={styles.secondaryLabel}>Invite to Bid</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={onHire}>
          <Text style={styles.primaryLabel}>Hire Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BidCard({ bid, onAccept }: { bid: Bid; onAccept: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          <Image source={bid.avatar} style={styles.avatar} contentFit="cover" />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{bid.name}</Text>
            <Text style={styles.name}>{bid.price}</Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingItem}>
              <Star width={18} height={18} />
              <Text style={styles.metaText}>{bid.rating}</Text>
            </View>
            <Dot />
            <Text style={styles.metaText}>{bid.jobs}</Text>
            <Dot />
            <Text style={styles.metaText}>{bid.distance}</Text>
          </View>

          <Text style={styles.bidMessage}>{bid.message}</Text>
        </View>
      </View>

      <View style={styles.bidActions}>
        <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={() => router.push({ pathname: '/chat', params: { name: bid.name } })}>
          <Text style={styles.secondaryLabel} numberOfLines={1}>
            Chat
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.tertiaryButton]} onPress={() => router.push({ pathname: '/tasker-profile', params: { name: bid.name } })}>
          <Text style={styles.tertiaryLabel} numberOfLines={1}>
            Profile
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={onAccept} >
          <Text style={styles.primaryLabel} numberOfLines={1}>
            Accept Bid
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TaskDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<'matches' | 'bids'>('matches');
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [hireName, setHireName] = useState<string | null>(null);
  const [hireAvatar, setHireAvatar] = useState<ImageSourcePropType | null>(null);
  const [hirePrice, setHirePrice] = useState<string | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);

  const goTab = (next: 'matches' | 'bids') => {
    setTab(next);
    pagerRef.current?.scrollTo({ x: next === 'bids' ? SCREEN_WIDTH : 0, animated: true });
  };

  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const next = idx === 1 ? 'bids' : 'matches';
    if (next !== tab) setTab(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft width={22} height={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Task Details</Text>
          <Pressable hitSlop={8} onPress={() => setActionsVisible(true)}>
            <Text style={styles.actionsLink}>Actions</Text>
          </Pressable>
        </View>
      </View>

      {/* Header (fixed above the swipeable pages) */}
      <View style={styles.header}>
        <View style={[styles.badge, styles.statusBadge, { backgroundColor: COLORS.successBg }]}>
          <Text style={[styles.badgeText, { color: COLORS.successText }]}>Open</Text>
        </View>

        <Text style={styles.title}>Printing & Photocopying, Assignment</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MapPin width={16} height={16} />
            <Text style={styles.metaText}>UI Main gate</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock width={16} height={16} />
            <Text style={styles.metaText}>18 May</Text>
          </View>
          <View style={styles.metaItem}>
            <Shield width={16} height={16} />
            <Text style={styles.metaText}>Safe</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBudget}>
          <View>
            <Text style={[styles.budgetText]}>
              Budget
            </Text>
          </View>
          <View>
            <Text style={[styles.priceText]}>{hirePrice}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'matches' && styles.tabActive]}
            onPress={() => goTab('matches')}>
            <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>
              Smart Matches (2)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'bids' && styles.tabActive]}
            onPress={() => goTab('bids')}>
            <Text style={[styles.tabText, tab === 'bids' && styles.tabTextActive]}>Bids(3)</Text>
          </Pressable>
        </View>
      </View>

      {/* Swipeable pages */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerScroll}
        style={styles.flex}>
        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {MATCHES.map((m, i) => (
            <MatchedCard key={`${m.name}-${i}`} match={m} onInvite={() => setInviteName(m.name)} onHire={() => { setHireName(m.name); setHireAvatar(m.avatar); setHirePrice(m.price ?? null); }} />
          ))}
        </ScrollView>

        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {BIDS.map((b, i) => (
            <BidCard key={`${b.name}-${i}`} bid={b} onAccept={() => { setHireName(b.name); setHireAvatar(b.avatar); setHirePrice(b.price); }} />
          ))}
        </ScrollView>
      </ScrollView>

      <InviteToBidModal
        visible={inviteName !== null}
        taskerName={inviteName ?? ''}
        onClose={() => setInviteName(null)}
      />
      <ReadyToHireModal
        visible={hireName !== null}
        taskerName={hireName ?? ''}
        taskerAvatar={hireAvatar ?? null}
        taskerPrice={hirePrice}
        onClose={() => setHireName(null)}
      />
      <TaskActionsModal
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onEdit={() => Alert.alert('Edit Task', 'Edit task functionality goes here.')}
        onBoost={() => Alert.alert('Boost Task', 'Task boosted successfully!')}
        onCancel={() =>
          Alert.alert('Cancel Task', 'Are you sure you want to cancel this task?', [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: () => Alert.alert('Task Cancelled', 'Task has been cancelled successfully!'),
            },
          ])
        }
        onReport={() => router.push('/report-issue')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  topBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  actionsLink: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brandStrong,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  page: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  title: {
    marginTop: 16,
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  meta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  tabBudget: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  budgetText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  priceText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  tabs: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.pillBg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    gap: 8,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  pill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.brandStrong,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bidActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.sunken,
  },
  secondaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
  },
  primaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.surface,
  },
  tertiaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  tertiaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  bidMessage: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
