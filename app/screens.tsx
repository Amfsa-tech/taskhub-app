import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowRight } from '@/components/icons/arrow-right';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
};

type ScreenLink = {
  label: string;
  description: string;
  href: string;
};

type ScreenSection = {
  title: string;
  items: ScreenLink[];
};

const SECTIONS: ScreenSection[] = [
  {
    title: 'Onboarding',
    items: [
      { label: 'Splash', description: 'Initial loading screen', href: '/splash' },
      { label: 'Onboarding', description: 'Carousel intro slides', href: '/onboarding' },
      { label: 'Purpose', description: 'Choose hire or earn', href: '/purpose' },
    ],
  },
  {
    title: 'Auth',
    items: [
      { label: 'Login', description: 'Sign in to account', href: '/login' },
      { label: 'Create Account', description: 'New account sign up', href: '/create-account' },
    ],
  },
  {
    title: 'Main App',
    items: [
      { label: 'Home (Tabs)', description: 'Primary tab navigator', href: '/(tabs)' },
      { label: 'Explore', description: 'Explore tab', href: '/(tabs)/explore' },
      { label: 'Modal', description: 'Example modal screen', href: '/modal' },
    ],
  },
];

export default function ScreensScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.heading}>
        <Text style={styles.title}>Screens</Text>
        <Text style={styles.subtitle}>Tap any screen to navigate and track your progress.</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.group}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.href}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => router.push(item.href as never)}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDescription}>{item.description}</Text>
                  </View>
                  <ArrowRight size={18} color={COLORS.iconSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  heading: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 6,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.iconSecondary,
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  rowPressed: {
    backgroundColor: COLORS.canvas,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  rowDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.24,
    color: COLORS.iconSecondary,
  },
});
