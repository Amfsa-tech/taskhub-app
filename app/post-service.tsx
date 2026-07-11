import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircle } from '@/components/icons/check-circle';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';
import { usePostTask } from '@/context/PostTaskContext';
import { groupCategories } from '@/lib/api/categories';
import { useCategories } from '@/lib/api/queries';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  placeholder: '#a0a0ba',
  error: '#dc2626',
};

export default function PostServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, toggleSubCategory } = usePostTask();
  const { data, isLoading, isError, refetch, isRefetching } = useCategories();

  const main = draft.mainCategory;
  const subs =
    data && main
      ? groupCategories(data.categories).find((g) => g.main._id === main._id)?.subs ?? []
      : [];
  const selectedIds = new Set(draft.subCategories.map((s) => s._id));
  const count = draft.subCategories.length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={2} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a service</Text>
          <Text style={styles.subtitle}>
            {main ? `Choose a specific area under ${main.displayName}` : 'Choose a specific area you need'}
          </Text>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.iconSecondary} />
          <Text style={styles.searchText}>Search service...</Text>
        </View>

        {!main ? (
          <View style={styles.state}>
            <Text style={styles.emptyText}>Pick a category first.</Text>
            <Pressable hitSlop={8} onPress={() => router.replace('/post-category')}>
              <Text style={styles.retry}>Choose category</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>Couldn’t load services.</Text>
            <Pressable hitSlop={8} onPress={() => refetch()} disabled={isRefetching}>
              <Text style={styles.retry}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
            </Pressable>
          </View>
        ) : subs.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.emptyText}>No services listed for this category.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {subs.map((sub) => {
              const active = selectedIds.has(sub._id);
              return (
                <Pressable
                  key={sub._id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => toggleSubCategory(sub)}>
                  <Text style={styles.rowText}>{sub.displayName}</Text>
                  {active && <CheckCircle size={22} color={COLORS.brand} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={count > 0 ? `Continue with ${count} selected` : 'Continue'}
          disabled={count === 0}
          onPress={() => router.push('/post-details')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    width: '100%',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    width: '100%',
  },
  search: {
    backgroundColor: COLORS.sunken,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  searchText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.placeholder,
  },
  list: {
    gap: 8,
  },
  row: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowActive: {
    backgroundColor: COLORS.surface,
  },
  rowText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  state: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
