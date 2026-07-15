import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReviewsAboutMe, useUserTasks } from '@/lib/api/queries';
import type { CategoryRef, ClientReview, Task, TaskTaskerRef } from '@/lib/api/tasks';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  pillBg: '#f3eeff',
  border: '#e0e0ea',
};

type ReviewVM = {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  rating: number;
  message: string;
  tag: string | null;
  time: string;
};

/** `Chioma A.` — short tasker name from a populated ref. */
function taskerName(t?: TaskTaskerRef | null): string {
  if (!t) return 'Tasker';
  const first = t.firstName?.trim() ?? '';
  const lastInitial = t.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]);
  return (letters.join('') || '?').toUpperCase();
}

function categoryLabel(cat?: CategoryRef | string | null): string | null {
  if (!cat) return null;
  if (typeof cat === 'string') return null;
  return cat.displayName || cat.name || null;
}

/** ISO date -> `2 days ago`, `Just now`, etc. Empty when absent. */
function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/** A completed task the client rated -> a "You gave" review card. */
function taskToReview(task: Task): ReviewVM {
  const name = taskerName(task.assignedTasker);
  return {
    id: task._id,
    name,
    initials: initialsOf(name),
    avatar: task.assignedTasker?.profilePicture || '',
    rating: task.rating ?? 0,
    message: task.reviewText || '',
    tag: categoryLabel(task.subCategory) || categoryLabel(task.mainCategory),
    time: relativeTime(task.ratedAt || task.completedAt),
  };
}

/** A tasker's review about the client -> an "About you" review card. */
function clientReviewToReview(r: ClientReview): ReviewVM {
  const name = taskerName(r.tasker);
  return {
    id: r._id,
    name,
    initials: initialsOf(name),
    avatar: r.tasker?.profilePicture || '',
    rating: r.rating,
    message: r.reviewText,
    tag: r.category,
    time: relativeTime(r.ratedAt),
  };
}

function ReviewCard({ review }: { review: ReviewVM }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {review.avatar ? (
            <Image source={{ uri: review.avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.avatarText}>{review.initials}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{review.name}</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Ionicons
                key={idx}
                name="star"
                size={16}
                color={idx < review.rating ? '#fbbf24' : '#e0e0ea'}
                style={styles.star}
              />
            ))}
          </View>
        </View>
        <Pressable hitSlop={8} onPress={() => {}} style={styles.flagButton}>
          <Ionicons name="flag-outline" size={18} color="#a0a0ba" />
        </Pressable>
      </View>

      {review.message ? <Text style={styles.message}>{review.message}</Text> : null}

      <View style={styles.cardFooter}>
        {review.tag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{review.tag}</Text>
          </View>
        ) : (
          <View />
        )}
        {review.time ? <Text style={styles.timeText}>{review.time}</Text> : null}
      </View>
    </View>
  );
}

function StateView({
  mode,
  emptyText,
  onRetry,
}: {
  mode: 'loading' | 'error' | 'empty';
  emptyText?: string;
  onRetry?: () => void;
}) {
  if (mode === 'loading') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }
  if (mode === 'error') {
    return (
      <View style={styles.state}>
        <Text style={styles.emptyText}>Couldn’t load reviews.</Text>
        <Pressable hitSlop={8} onPress={onRetry}>
          <Text style={styles.retry}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );
}

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'about' | 'gave'>('about');

  // "You gave": the client's own reviews, derived from their completed+rated tasks.
  const completed = useUserTasks({ status: 'completed' });
  const gaveReviews = useMemo(
    () => (completed.data?.tasks ?? []).filter((t) => t.rating != null).map(taskToReview),
    [completed.data],
  );

  // "About you": reviews taskers left about the client.
  const about = useReviewsAboutMe();
  const aboutReviews = useMemo(
    () => (about.data?.reviews ?? []).map(clientReviewToReview),
    [about.data],
  );

  const isAbout = activeTab === 'about';
  const query = isAbout ? about : completed;
  const reviews = isAbout ? aboutReviews : gaveReviews;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <Pressable
            style={[styles.tab, isAbout && styles.tabActive]}
            onPress={() => setActiveTab('about')}>
            <Text style={[styles.tabText, isAbout && styles.tabTextActive]}>About you</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, !isAbout && styles.tabActive]}
            onPress={() => setActiveTab('gave')}>
            <Text style={[styles.tabText, !isAbout && styles.tabTextActive]}>You gave</Text>
          </Pressable>
        </View>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {query.isLoading ? (
          <StateView mode="loading" />
        ) : query.isError ? (
          <StateView mode="error" onRetry={() => query.refetch()} />
        ) : reviews.length === 0 ? (
          <StateView
            mode="empty"
            emptyText={
              isAbout
                ? 'No reviews yet. Taskers you hire can review you after a completed task.'
                : 'You haven’t reviewed any taskers yet.'
            }
          />
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
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
  state: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 6,
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
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  flagButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.sunken,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
