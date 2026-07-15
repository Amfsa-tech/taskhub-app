import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Heart from '@/assets/icons/heart.svg';
import { ReadyToHireModal } from '@/components/taskhub/ready-to-hire-modal';
import { Spinner } from '@/components/taskhub/spinner';
import { queryKeys, useSavedTaskers } from '@/lib/api/queries';
import { savedTaskerName, unsaveTasker, type SavedTasker } from '@/lib/api/saved-taskers';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  pillBg: '#f3eeff',
  successBg: '#edfaf3',
  successText: '#0d6639',
  onBrand: '#ffffff',
};

/** `Chioma A.` -> `CA` */
function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return (letters.join('') || '?').toUpperCase();
}

function locationOf(t: SavedTasker): string | null {
  return t.area || t.residentState || null;
}

export default function SavedTaskersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useSavedTaskers();
  const taskers = data?.taskers ?? [];

  // ReadyToHireModal state
  const [hireTasker, setHireTasker] = useState<SavedTasker | null>(null);

  const unsave = useMutation({
    mutationFn: (taskerId: string) => unsaveTasker(taskerId),
    onSuccess: () => {
      // Refresh the list and the profile's "Saved" tile.
      queryClient.invalidateQueries({ queryKey: queryKeys.savedTaskers() });
    },
    onError: (err: Error) => {
      Alert.alert('Could not remove', err.message);
    },
  });

  const confirmUnsave = (tasker: SavedTasker) => {
    const name = savedTaskerName(tasker);
    Alert.alert('Remove tasker', `Remove ${name} from your saved taskers?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => unsave.mutate(tasker._id),
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
        <Text style={styles.headerTitle}>Saved Taskers</Text>
        <View style={styles.placeholderButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Spinner />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Couldn&apos;t load saved taskers</Text>
          <Text style={styles.emptyBody}>{error.message}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={() => refetch()}>
            <Text style={styles.retryLabel}>Try Again</Text>
          </Pressable>
        </View>
      ) : taskers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No saved taskers yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on a tasker&apos;s profile to save them here for next time.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}>
          {taskers.map((tasker) => {
            const name = savedTaskerName(tasker);
            const rating = tasker.averageRating ?? 0;
            const jobs = tasker.completedJobs ?? 0;
            const place = locationOf(tasker);
            const removing = unsave.isPending && unsave.variables === tasker._id;

            return (
              <View key={tasker._id} style={[styles.card, removing && styles.cardRemoving]}>
                {/* Header info row */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatarWrap}>
                    {tasker.profilePicture ? (
                      <Image
                        source={{ uri: tasker.profilePicture }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>{initialsOf(name)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userDetails}>
                      <Text style={styles.name} numberOfLines={1}>
                        {name}
                      </Text>
                      {tasker.isVerified ? (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-sharp" size={10} color={COLORS.successText} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Rating & details */}
                    <View style={styles.ratingRow}>
                      {rating > 0 ? (
                        <>
                          <Ionicons name="star" size={14} color="#fbbf24" style={styles.starIcon} />
                          <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
                        </>
                      ) : (
                        <Text style={styles.metaText}>New</Text>
                      )}
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.metaText}>
                        {jobs} {jobs === 1 ? 'Job' : 'Jobs'}
                      </Text>
                      {place ? (
                        <>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.metaText} numberOfLines={1}>
                            {place}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    {/* Category */}
                    {tasker.primaryCategory ? (
                      <View style={styles.tagsRow}>
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>{tasker.primaryCategory}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Unsave */}
                  <Pressable
                    hitSlop={8}
                    disabled={removing}
                    onPress={() => confirmUnsave(tasker)}
                    style={removing && styles.disabled}>
                    <Heart width={22} height={22} />
                  </Pressable>
                </View>

                {/* Hire button */}
                <Pressable
                  style={({ pressed }) => [styles.hireButton, pressed && styles.pressed]}
                  onPress={() => setHireTasker(tasker)}>
                  <Text style={styles.hireLabel}>Hire Now</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Ready to Hire modal */}
      <ReadyToHireModal
        visible={hireTasker !== null}
        taskerName={hireTasker ? savedTaskerName(hireTasker) : ''}
        taskerAvatar={hireTasker?.profilePicture ? { uri: hireTasker.profilePicture } : null}
        taskerPrice={null}
        onClose={() => setHireTasker(null)}
      />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.onBrand,
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
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardRemoving: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.45,
    color: COLORS.onBrand,
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.successText,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  bullet: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: COLORS.brand,
  },
  hireButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
