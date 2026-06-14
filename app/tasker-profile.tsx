import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HeartOutline from '@/assets/icons/heart-outline.svg';
import RatingDot from '@/assets/icons/rating-dot.svg';
import Share from '@/assets/icons/share.svg';
import ShieldSuccess from '@/assets/icons/shield-success.svg';
import Star from '@/assets/icons/star.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  avatarBg: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successBg: '#edfaf3',
  successText: '#0d6639',
};

const AVATAR = require('@/assets/images/taskers/tasker-1.png');

type Stat = { value: string; label: string };
const STATS: Stat[] = [
  { value: '127', label: 'Jobs done' },
  { value: '~2mins', label: 'Response' },
  { value: '4.9/5', label: 'Rating' },
];

const SERVICES = ['Printing', 'Typing', 'Fix Laptop'];

type ReviewItem = {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  rating: number;
  text: string;
  time: string;
};

const REVIEWS: ReviewItem[] = [
  {
    id: '1',
    name: 'Chioma. A',
    avatar: AVATAR,
    rating: 5,
    text: 'Super fast and reliable. Delivered my prints exactly on time.',
    time: '2 Days ago',
  },
  {
    id: '2',
    name: 'Aisha. M',
    avatar: require('@/assets/images/taskers/tasker-3.png'),
    rating: 5,
    text: 'Great communication and quality work!',
    time: '2 Days ago',
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} width={18} height={18} />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <View style={styles.reviewCard}>
      <Image source={review.avatar} style={styles.reviewAvatar} contentFit="cover" />
      <View style={styles.reviewBody}>
        <View style={styles.reviewTopRow}>
          <Text style={styles.reviewName}>{review.name}</Text>
          <StarRow count={review.rating} />
        </View>
        <Text style={styles.reviewText}>{review.text}</Text>
        <Text style={styles.reviewTime}>{review.time}</Text>
      </View>
    </View>
  );
}

export default function TaskerProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? 'Chioma. A';
  const firstName = name.split(/[.\s]/).filter(Boolean)[0] ?? name;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Profile"
        right={
          <View style={styles.headerIcons}>
            <Pressable hitSlop={6} onPress={() => {}}>
              <HeartOutline width={24} height={24} />
            </Pressable>
            <Pressable hitSlop={6} onPress={() => {}}>
              <Share width={24} height={24} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
          </View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star width={18} height={18} />
              <Text style={styles.metaText}>4.9</Text>
            </View>
            <RatingDot width={6} height={6} />
            <Text style={styles.metaText}>127 Jobs</Text>
            <RatingDot width={6} height={6} />
            <Text style={styles.metaText}>0.3km</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <ShieldSuccess width={16} height={16} />
            <Text style={styles.verifiedText}>Verified Tasker</Text>
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

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.chips}>
            {SERVICES.map((service) => (
              <View key={service} style={styles.chip}>
                <Text style={styles.chipText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.reviewList}>
            {REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.heartButton} hitSlop={6} onPress={() => {}}>
          <HeartOutline width={24} height={24} />
        </Pressable>
        <PrimaryButton label={`Hire ${firstName}`} onPress={() => {}} style={styles.hireButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  // Profile header
  profileHeader: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.avatarBg,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  metaRow: {
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
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.successBg,
  },
  verifiedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.successText,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
  // Sections
  section: { gap: 16 },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.brandSubtle,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  // Reviews
  reviewList: { gap: 8 },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
  },
  reviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.avatarBg,
  },
  reviewBody: {
    flex: 1,
    gap: 8,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  reviewTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  // Footer
  footer: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireButton: {
    flex: 1,
    width: undefined,
  },
});
