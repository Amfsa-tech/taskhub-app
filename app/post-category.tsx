import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GraduationCapWhite from '@/assets/icons/graduation-cap-white.svg';
import HouseWhite from '@/assets/icons/house-white.svg';
import PackageWhite from '@/assets/icons/package-white.svg';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { StepsHeader } from '@/components/taskhub/steps-header';

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
};

type Cat = { key: string; title: string; subtitle: string; bg: string; icon: React.ReactNode };

const CATEGORIES: Cat[] = [
  {
    key: 'campus',
    title: 'Campus Task',
    subtitle: 'University Tasks',
    bg: COLORS.blue,
    icon: <GraduationCapWhite width={24} height={24} />,
  },
  {
    key: 'local',
    title: 'Local Services',
    subtitle: 'Home & Area service',
    bg: COLORS.amber,
    icon: <HouseWhite width={24} height={24} />,
  },
  {
    key: 'errands',
    title: 'Errands & Deliveries',
    subtitle: 'Deliveries & Pickup',
    bg: COLORS.purple,
    icon: <PackageWhite width={24} height={24} />,
  },
  {
    key: 'digital',
    title: 'Digital / Remote',
    subtitle: 'Design,  editing, coding, remote help...',
    bg: COLORS.green,
    icon: <PackageWhite width={24} height={24} />,
  },
];

export default function PostCategoryScreen() {
  const router = useRouter();

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

        <View style={styles.list}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.key} style={styles.card} onPress={() => router.push('/post-service')}>
              <View style={[styles.icon, { backgroundColor: cat.bg }]}>{cat.icon}</View>
              <View style={styles.textBlock}>
                <Text style={styles.cardTitle}>{cat.title}</Text>
                <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
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
});
