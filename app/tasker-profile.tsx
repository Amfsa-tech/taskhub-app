import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryKeys, useSavedTaskers, useTasker, useTaskerReviews } from '@/lib/api/queries';
import { saveTasker, unsaveTasker } from '@/lib/api/saved-taskers';
import type { TaskerReview } from '@/lib/api/tasks';

import Heart from '@/assets/icons/heart.svg';
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
  onBrand: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successBg: '#edfaf3',
  successText: '#0d6639',
  star: '#f59e0b',
  starEmpty: '#e0e0ea',
};

/** `Chioma A.` from first/last, or a plain name. */
function shortName(first?: string, last?: string, fallback = 'Tasker'): string {
  const f = first?.trim() ?? '';
  const li = last?.trim()?.[0];
  return [f, li ? `${li}.` : ''].filter(Boolean).join(' ') || fallback;
}

function initialsOf(name: string): string {
  return (name.match(/\b\w/g)?.slice(0, 2).join('') || '?').toUpperCase();
}

/** ISO -> `2 days ago`. Empty when absent. */
function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
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
  return `${Math.floor(days / 365)} year(s) ago`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        const on = i < Math.round(rating);
        return (
          <Star
            key={i}
            width={16}
            height={16}
            fill={on ? COLORS.star : COLORS.starEmpty}
            color={on ? COLORS.star : COLORS.starEmpty}
          />
        );
      })}
    </View>
  );
}

function ReviewCard({ review }: { review: TaskerReview }) {
  const name = review.reviewer?.fullName?.trim() || 'Client';
  const avatar = review.reviewer?.profilePicture || '';
  return (
    <View style={styles.reviewCard}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.reviewAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.reviewAvatar, styles.reviewAvatarFallback]}>
          <Text style={styles.reviewInitials}>{initialsOf(name)}</Text>
        </View>
      )}
      <View style={styles.reviewBody}>
        <View style={styles.reviewTopRow}>
          <Text style={styles.reviewName}>{name}</Text>
          <StarRow rating={review.rating} />
        </View>
        {review.reviewText ? <Text style={styles.reviewText}>{review.reviewText}</Text> : null}
        <Text style={styles.reviewTime}>{relativeTime(review.ratedAt)}</Text>
      </View>
    </View>
  );
}

/** The heart is only meaningful when we know which tasker this is. */
function SaveHeart({ taskerId, size = 24 }: { taskerId: string; size?: number }) {
  const queryClient = useQueryClient();
  const { data } = useSavedTaskers();
  const isSaved = (data?.taskers ?? []).some((t) => t._id === taskerId);

  const toggle = useMutation({
    mutationFn: () => (isSaved ? unsaveTasker(taskerId) : saveTasker(taskerId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedTaskers() });
    },
    onError: (err: Error) => {
      Alert.alert(isSaved ? 'Could not remove' : 'Could not save', err.message);
    },
  });

  return (
    <Pressable
      hitSlop={6}
      disabled={toggle.isPending}
      onPress={() => toggle.mutate()}
      style={toggle.isPending && { opacity: 0.5 }}>
      {isSaved ? <Heart width={size} height={size} /> : <HeartOutline width={size} height={size} />}
    </Pressable>
  );
}

export default function TaskerProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string; id?: string }>();
  // Callers that know the real tasker (Home, bids) pass `id`; some (chat) pass
  // only a name, in which case we can't fetch and fall back to a minimal view.
  const taskerId = params.id;

  const { data: taskerRes, isLoading, isError } = useTasker(taskerId);
  const { data: reviewsRes } = useTaskerReviews(taskerId);
  const tasker = taskerRes?.data;
  const reviews = reviewsRes?.data.reviews ?? [];
  const reviewCount = reviewsRes?.data.pagination.total ?? reviews.length;

  const name = tasker
    ? shortName(tasker.firstName, tasker.lastName)
    : (params.name ?? 'Tasker');
  const firstName = name.split(/[.\s]/).filter(Boolean)[0] ?? name;

  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const ratingLabel =
    tasker && tasker.averageRating > 0 ? tasker.averageRating.toFixed(1) : 'New';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Profile"
        right={
          <View style={styles.headerIcons}>
            {taskerId ? <SaveHeart taskerId={taskerId} /> : null}
            <Pressable hitSlop={6} onPress={() => {}}>
              <Share width={24} height={24} />
            </Pressable>
          </View>
        }
      />

      {taskerId && isLoading ? (
        <View style={styles.stateView}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : taskerId && (isError || !tasker) ? (
        <View style={styles.stateView}>
          <Text style={styles.emptyText}>Couldn’t load this tasker.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {/* Profile header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              {tasker?.profilePicture ? (
                <Image source={{ uri: tasker.profilePicture }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initialsOf(name)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{name}</Text>
            {tasker ? (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Star width={18} height={18} fill={COLORS.star} color={COLORS.star} />
                  <Text style={styles.metaText}>{ratingLabel}</Text>
                </View>
                <RatingDot width={6} height={6} />
                <Text style={styles.metaText}>
                  {tasker.completedJobs} {tasker.completedJobs === 1 ? 'Job' : 'Jobs'}
                </Text>
                {tasker.primaryCategory ? (
                  <>
                    <RatingDot width={6} height={6} />
                    <Text style={styles.metaText}>{tasker.primaryCategory}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
            {tasker?.isVerified ? (
              <View style={styles.verifiedBadge}>
                <ShieldSuccess width={16} height={16} />
                <Text style={styles.verifiedText}>Verified Tasker</Text>
              </View>
            ) : null}
          </View>

          {tasker ? (
            <>
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{tasker.completedJobs}</Text>
                  <Text style={styles.statLabel}>Jobs done</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{ratingLabel}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{reviewCount}</Text>
                  <Text style={styles.statLabel}>{reviewCount === 1 ? 'Review' : 'Reviews'}</Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                <Pressable
                  style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('about')}>
                  <Text style={[styles.tabButtonText, activeTab === 'about' && styles.tabButtonTextActive]}>
                    About
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('reviews')}>
                  <Text style={[styles.tabButtonText, activeTab === 'reviews' && styles.tabButtonTextActive]}>
                    Reviews
                  </Text>
                </Pressable>
              </View>

              {activeTab === 'about' ? (
                <>
                  {/* About me */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About me</Text>
                    <Text style={styles.aboutText}>
                      {tasker.bio || 'This tasker hasn’t added a bio yet.'}
                    </Text>
                  </View>

                  {/* Services */}
                  {tasker.services.length > 0 ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Services</Text>
                      <View style={styles.chips}>
                        {tasker.services.map((service) => (
                          <View key={service} style={styles.chip}>
                            <Text style={styles.chipText}>{service}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Gallery */}
                  {tasker.previousWork.length > 0 ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Gallery</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                        {tasker.previousWork.map((work) => (
                          <Pressable key={work.url} onPress={() => setLightbox(work.url)}>
                            <Image source={{ uri: work.url }} style={styles.galleryImage} contentFit="cover" />
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.section}>
                  {reviews.length > 0 ? (
                    <View style={styles.reviewList}>
                      {reviews.map((review) => (
                        <ReviewCard key={review.taskId} review={review} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No reviews yet.</Text>
                  )}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {taskerId ? (
          <View style={styles.heartButton}>
            <SaveHeart taskerId={taskerId} />
          </View>
        ) : null}
        <PrimaryButton label={`Hire ${firstName}`} onPress={() => {}} style={styles.hireButton} />
      </View>

      {/* Lightbox */}
      <Modal visible={lightbox !== null} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={styles.lightboxContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setLightbox(null)} />
          {lightbox && <Image source={{ uri: lightbox }} style={styles.lightboxImage} contentFit="contain" />}
          <Pressable style={[styles.closeButton, { top: insets.top + 16 }]} onPress={() => setLightbox(null)}>
            <View style={styles.crossContainer}>
              <View style={[styles.crossLine, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.crossLine, { transform: [{ rotate: '-45deg' }] }]} />
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  stateView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  avatarInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    letterSpacing: -0.45,
    color: COLORS.onBrand,
  },
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
  // Tab Layout
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.sunken,
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#111122',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.textPrimary,
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
  aboutText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
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
  galleryRow: {
    gap: 8,
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
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
  reviewAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  reviewInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 18,
    color: COLORS.onBrand,
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
  // Lightbox
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
  },
  crossContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLine: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
});
