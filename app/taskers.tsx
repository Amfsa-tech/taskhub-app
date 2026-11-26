import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useCategories, useTaskerDirectory, useUniversities } from '@/lib/api/queries';
import { groupCategories } from '@/lib/api/categories';
import { filterUniversities } from '@/lib/api/universities';
import type { TaskerMatch } from '@/lib/api/tasks';

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
  const place = [tasker.city, tasker.residentState].filter(Boolean).join(', ') || 'Location not provided';

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
          <Text style={[styles.verification, tasker.isVerified === true && styles.verified]}>
            {tasker.isVerified === true ? '✓ Verified' : 'Unverified'}
          </Text>
        </View>
      </View>

      {tasker.bio ? <Text style={styles.bio} numberOfLines={2}>{tasker.bio}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={13} color={COLORS.star} />
          <Text style={styles.ratingText}>{rating > 0 ? `${rating.toFixed(1)} (${tasker.ratingCount ?? 0})` : 'New'}</Text>
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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [university, setUniversity] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [picker, setPicker] = useState<'category' | 'university' | 'rating' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('nearest');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const taskersQuery = useTaskerDirectory({
    search: debouncedSearch,
    category,
    university,
    minRating,
    sort: sort === 'rating' ? 'highest_rated' : sort === 'popular' ? 'most_popular' : 'nearest',
  });
  const categoriesQuery = useCategories();
  const taskers = useMemo(() => taskersQuery.data?.pages.flatMap((page) => page.data) ?? [], [taskersQuery.data]);

  const universitiesQuery = useUniversities();
  const universities = universitiesQuery.data?.universities ?? [];
  const categories = groupCategories(categoriesQuery.data?.categories ?? []).flatMap(({ main, subs }) =>
    [{ id: main.displayName || main.name, label: main.displayName || main.name, nested: false },
      ...subs.map((item) => ({ id: item.displayName || item.name, label: item.displayName || item.name, nested: true }))],
  );
  const filterTitle = picker === 'category' ? 'Categories' : picker === 'university' ? 'Institutions' : 'Minimum rating';
  const options = picker === 'category' ? [{ id: 'All', label: 'All Categories', nested: false },
    ...categories.filter((item) => item.label.toLowerCase().includes(pickerSearch.trim().toLowerCase()))]
    : picker === 'university' ? [{ id: '', label: 'All Institutions', nested: false },
      ...filterUniversities(universities, pickerSearch).map((item) => ({
        id: item._id, label: item.abbreviation ? `${item.name} (${item.abbreviation})` : item.name, nested: false,
      }))]
      : [0, 3, 4, 4.5].map((rating) => ({ id: String(rating), label: rating ? `${rating}+ stars` : 'Any rating', nested: false }));
  const selected = picker === 'category' ? category : picker === 'university' ? university : String(minRating);
  const pickerQuery = picker === 'category' ? categoriesQuery : picker === 'university' ? universitiesQuery : null;
  const openPicker = (filter: typeof picker) => {
    setPickerSearch('');
    setPicker(filter);
  };

  const visibleTaskers = taskers;

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setUniversity('');
    setMinRating(0);
    setSort('nearest');
  };

  const hasFilters = Boolean(search.trim()) || category !== 'All' || Boolean(university) || minRating > 0 || sort !== 'nearest';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Browse Taskers" />

      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <View style={styles.backdrop}>
          <View style={styles.filterPanel} accessibilityViewIsModal>
            <View style={styles.filterHeading}>
              <Text style={styles.title}>{filterTitle}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close filter" hitSlop={12} onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            {picker !== 'rating' && <TextInput style={styles.filterSearch} value={pickerSearch}
              onChangeText={setPickerSearch} placeholder={`Search ${filterTitle.toLowerCase()}`} />}
            {pickerQuery?.isLoading && <ActivityIndicator color={COLORS.brand} />}
            {pickerQuery?.isError && <Pressable accessibilityRole="button" onPress={() => void pickerQuery.refetch()}>
              <Text style={styles.inlineErrorText}>Could not load options. Try again</Text>
            </Pressable>}
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: item.id === selected }}
                  style={[styles.filterOption, item.nested && styles.subOption, item.id === selected && styles.chipSelected]}
                  onPress={() => {
                    if (picker === 'category') setCategory(item.id);
                    if (picker === 'university') setUniversity(item.id);
                    if (picker === 'rating') setMinRating(Number(item.id));
                    setPicker(null);
                  }}>
                  <Text style={styles.chipText}>{item.label}</Text>
                  {item.id === selected && <Ionicons name="checkmark" size={16} color={COLORS.brand} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

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
              <Text style={styles.subtitle}>Taskers in your city first, then professionals across Nigeria.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color={COLORS.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search nationwide by name, skill or location"
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

            <View style={styles.filterRow}>
              {([
                ['category', category === 'All' ? 'Categories' : category],
                ['university', universities.find((item) => item._id === university)?.name ?? 'Institutions'],
                ['rating', minRating ? `${minRating}+ stars` : 'Rating'],
              ] as const).map(([filter, label]) => (
                <Pressable key={filter} accessibilityRole="button" onPress={() => openPicker(filter)} style={styles.filterButton}>
                  <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.brand} />
                </Pressable>
              ))}
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
        ListFooterComponent={taskersQuery.hasNextPage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load more taskers"
            style={styles.retryButton}
            disabled={taskersQuery.isFetchingNextPage}
            onPress={() => taskersQuery.fetchNextPage()}>
            {taskersQuery.isFetchingNextPage ? <ActivityIndicator color={COLORS.onBrand} /> : <Text style={styles.retryText}>Load more taskers</Text>}
          </Pressable>
        ) : null}
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { flexGrow: 1, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: COLORS.surface, paddingHorizontal: 10, minHeight: 44 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#00000066' },
  filterPanel: { maxHeight: '80%', padding: 16, gap: 12, borderRadius: 12, backgroundColor: COLORS.surface },
  filterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  filterSearch: { backgroundColor: COLORS.sunken, borderRadius: 8, paddingHorizontal: 12, minHeight: 44 },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, minHeight: 44, borderRadius: 6 },
  subOption: { paddingLeft: 22 },
  verification: { alignSelf: 'flex-start', backgroundColor: '#fff7e6', color: '#854d0e', fontSize: 11, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  verified: { backgroundColor: '#ecfdf5', color: '#047857' },
  sortRow: { flexDirection: 'row', gap: 8 },
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
