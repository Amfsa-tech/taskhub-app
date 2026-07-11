import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GraduationCapWhite from '@/assets/icons/graduation-cap-white.svg';
import HouseWhite from '@/assets/icons/house-white.svg';
import PackageWhite from '@/assets/icons/package-white.svg';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { StepsHeader } from '@/components/taskhub/steps-header';
import { usePostTask } from '@/context/PostTaskContext';
import { groupCategories, type Category } from '@/lib/api/categories';
import { useCategories } from '@/lib/api/queries';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  placeholder: '#a0a0ba',
  blue: '#3b82f6',
  amber: '#f59e0b',
  purple: '#6c3bff',
  green: '#18a962',
  error: '#dc2626',
};

/** Match a main category to one of the designed icon/colour treatments. */
function visual(main: Category): { icon: React.ReactNode; bg: string } {
  const n = main.name.toLowerCase();
  if (n.includes('campus')) return { icon: <GraduationCapWhite width={24} height={24} />, bg: COLORS.blue };
  if (n.includes('local')) return { icon: <HouseWhite width={24} height={24} />, bg: COLORS.amber };
  if (n.includes('errand') || n.includes('deliver')) {
    return { icon: <PackageWhite width={24} height={24} />, bg: COLORS.purple };
  }
  return { icon: <PackageWhite width={24} height={24} />, bg: COLORS.green };
}

export default function PostCategoryScreen() {
  const router = useRouter();
  const { setMainCategory } = usePostTask();
  const { data, isLoading, isError, refetch, isRefetching } = useCategories();

  const groups = data ? groupCategories(data.categories) : [];

  const select = (main: Category) => {
    setMainCategory(main);
    router.push('/post-service');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={1} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>What Type of task?</Text>
          <Text style={styles.subtitle}>Select a context for your task</Text>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.iconSecondary} />
          <Text style={styles.searchText}>Search category, service...</Text>
        </View>

        {isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={COLORS.purple} />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>Couldn’t load categories.</Text>
            <Pressable hitSlop={8} onPress={() => refetch()} disabled={isRefetching}>
              <Text style={styles.retry}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
            </Pressable>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.emptyText}>No categories available yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {groups.map(({ main, subs }) => {
              const v = visual(main);
              return (
                <Pressable key={main._id} style={styles.card} onPress={() => select(main)}>
                  <View style={[styles.icon, { backgroundColor: v.bg }]}>{v.icon}</View>
                  <View style={styles.textBlock}>
                    <Text style={styles.cardTitle}>{main.displayName}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {main.description || `${subs.length} service${subs.length === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
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
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 90,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.iconSecondary,
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
    color: COLORS.purple,
  },
});
