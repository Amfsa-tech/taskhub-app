import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useCategories, useNearbyTaskers } from '@/lib/api/queries';
import type { TaskerMatch } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  border: '#e0e0ea',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  muted: '#78788c',
  star: '#f59e0b',
  onBrand: '#ffffff',
};

type SortMode = 'nearest' | 'rating' | 'popular';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'rating', label: 'Top rated' },
  { key: 'popular', label: 'Popular' },
];

function fullName(tasker: TaskerMatch) {
  return [tasker.firstName?.trim(), tasker.lastName?.trim()].filter(Boolean).join(' ') || 'Tasker';
}

function initials(name: string) {
  return (name.match(/\b\w/g)?.slice(0, 2).join('') || 'T').toUpperCase();
}

function TaskerDirectoryCard({ tasker, onPress }: { tasker: TaskerMatch; onPress: () => void }) {
  const name = fullName(tasker);
  const rating = tasker.averageRating ?? 0;
  const jobs = tasker.completedJobs ?? 0;
  const place = tasker.area || tasker.residentState || 'Nearby';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${name}'s profile`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          {tasker.profilePicture ? (
            <Image source={{ uri: tasker.profilePicture }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardIdentity}>
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
          <View style={styles.categoryRow}>
            <Ionicons name="briefcase-outline" size={13} color={COLORS.brand} />
            <Text style={styles.categoryText} numberOfLines={1}>
              {tasker.primaryCategory || 'Tasker'}
            </Text>
          </View>
        </View>
      </View>

      {tasker.bio ? <Text style={styles.bio} numberOfLines={2}>{tasker.bio}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={13} color={COLORS.star} />
          <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
        </View>
        <Text style={styles.jobsText}>
          <Text style={styles.jobsStrong}>{jobs}</Text> {jobs === 1 ? 'task' : 'tasks'} completed
        </Text>
      </View>

      <View style={styles.locationRow}>
        <View style={styles.locationName}>
          <Ionicons name="location-outline" size={14} color={COLORS.muted} />
          <Text style={styles.locationText} numberOfLines={1}>{place}</Text>
        </View>
        {tasker.distance != null ? (
          <Text style={styles.distance}>{tasker.distance.toFixed(1)} km away</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TaskersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortMode>('nearest');

  const location = user?.location;
  const coords = location
    && Number.isFinite(location.latitude)
    && Number.isFinite(location.longitude)
    ? { latitude: location.latitude, longitude: location.longitude }
    : undefined;
  const taskersQuery = useNearbyTaskers(coords);
  const categoriesQuery = useCategories();
  const taskers = useMemo(() => taskersQuery.data?.data ?? [], [taskersQuery.data]);

  const categories = useMemo(() => {
    const apiCategories = (categoriesQuery.data?.categories ?? [])
      .filter((item) => !item.parentCategory)
      .map((item) => item.displayName || item.name);
    const taskerCategories = taskers
      .map((item) => item.primaryCategory)
      .filter((item): item is string => Boolean(item));
    return ['All', ...Array.from(new Set([...apiCategories, ...taskerCategories])).sort()];
  }, [categoriesQuery.data?.categories, taskers]);

  const visibleTaskers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = taskers.filter((tasker) => {
      const matchesSearch = !normalizedSearch || [
        fullName(tasker),
        tasker.primaryCategory,
        tasker.area,
        tasker.residentState,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesCategory = category === 'All' || tasker.primaryCategory === category;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((left, right) => {
      if (sort === 'rating') return (right.averageRating ?? 0) - (left.averageRating ?? 0);
      if (sort === 'popular') return (right.completedJobs ?? 0) - (left.completedJobs ?? 0);
      return (left.distance ?? Number.POSITIVE_INFINITY) - (right.distance ?? Number.POSITIVE_INFINITY);
    });
  }, [category, search, sort, taskers]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('nearest');
  };

  const hasFilters = Boolean(search.trim()) || category !== 'All' || sort !== 'nearest';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Browse Taskers" />

      <FlatList
        data={visibleTaskers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TaskerDirectoryCard
            tasker={item}
            onPress={() => router.push({
              pathname: '/tasker-profile',
              params: { id: item._id, name: fullName(item) },
            })}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={(
          <RefreshControl
            refreshing={taskersQuery.isRefetching}
            onRefresh={() => taskersQuery.refetch()}
            tintColor={COLORS.brand}
            colors={[COLORS.brand]}
          />
        )}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            <View style={styles.intro}>
              <Text style={styles.title}>Find the right tasker</Text>
              <Text style={styles.subtitle}>Browse trusted professionals available near you.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color={COLORS.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or skill"
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search ? (
                <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={19} color={COLORS.muted} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categories.map((item) => {
                  const selected = item === category;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort by</Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((option) => {
                  const selected = option.key === sort;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setSort(option.key)}
                      style={[styles.sortChip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {taskersQuery.error && taskers.length > 0 ? (
              <Pressable style={styles.inlineError} onPress={() => taskersQuery.refetch()}>
                <Text style={styles.inlineErrorText}>Could not refresh taskers. Tap to retry.</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          taskersQuery.isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={COLORS.brand} />
              <Text style={styles.stateBody}>Finding available taskers...</Text>
            </View>
          ) : taskersQuery.isError ? (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={28} color={COLORS.brand} />
              </View>
              <Text style={styles.stateTitle}>Could not load taskers</Text>
              <Text style={styles.stateBody}>Check your connection and try again.</Text>
              <Pressable style={styles.retryButton} onPress={() => taskersQuery.refetch()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Ionicons name="people-outline" size={28} color={COLORS.brand} />
              </View>
              <Text style={styles.stateTitle}>{hasFilters ? 'No matching taskers' : 'No taskers available'}</Text>
              <Text style={styles.stateBody}>
                {hasFilters ? 'Try changing or clearing your search and filters.' : 'Please check back again soon.'}
              </Text>
              {hasFilters ? (
                <Pressable style={styles.retryButton} onPress={clearFilters}>
                  <Text style={styles.retryText}>Reset filters</Text>
                </Pressable>
              ) : null}
            </View>
          )
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  listContent: { paddingHorizontal: 16, gap: 12 },
  headerContent: { gap: 16, paddingTop: 20, paddingBottom: 4 },
  intro: { gap: 4 },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  searchBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  filterSection: { gap: 8 },
  filterLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipRow: { gap: 8, paddingRight: 16 },
  sortRow: { flexDirection: 'row', gap: 8 },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChip: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.brandSubtle, borderColor: COLORS.brand },
  chipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextSelected: { color: COLORS.brand },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pressed: { opacity: 0.9 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: COLORS.onBrand },
  cardIdentity: { flex: 1, gap: 4 },
  cardName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  categoryText: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bio: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#9a6500' },
  jobsText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.muted },
  jobsStrong: { fontFamily: 'Geist_600SemiBold', color: COLORS.textPrimary },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  locationName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.textSecondary },
  distance: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.brand,
    backgroundColor: COLORS.brandSubtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineError: {
    backgroundColor: '#fff1f1',
    borderRadius: 12,
    padding: 12,
  },
  inlineErrorText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: '#b01515' },
  state: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
  },
  retryText: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.onBrand },
});
