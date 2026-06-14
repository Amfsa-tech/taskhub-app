import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircle } from '@/components/icons/check-circle';
import { Circle } from '@/components/icons/circle';
import { GraduationCap } from '@/components/icons/graduation-cap';
import { House } from '@/components/icons/house';
import { Package } from '@/components/icons/package';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  onBrand: '#ffffff',
  check: '#3b82f6',
};

type Category = {
  key: string;
  title: string;
  subtitle: string;
  iconColor: string;
  renderIcon: () => React.ReactNode;
};

const CATEGORIES: Category[] = [
  {
    key: 'campus',
    title: 'Campus Task',
    subtitle: 'Printing, assignments, hostel help, tutorials.',
    iconColor: '#3b82f6',
    renderIcon: () => <GraduationCap size={24} color={COLORS.onBrand} />,
  },
  {
    key: 'local',
    title: 'Local Services',
    subtitle: 'Repairs, cleaning, electricians, home services.',
    iconColor: '#f59e0b',
    renderIcon: () => <House size={24} color={COLORS.onBrand} />,
  },
  {
    key: 'errands',
    title: 'Errands & Deliveries',
    subtitle: 'Pickups, deliveries, shopping, quick runs.',
    iconColor: '#6c3bff',
    renderIcon: () => <Package size={24} color={COLORS.onBrand} />,
  },
  {
    key: 'digital',
    title: 'Digital / Remote',
    subtitle: 'Design, typing, editing, coding, remote help.',
    iconColor: '#18a962',
    renderIcon: () => <Package size={24} color={COLORS.onBrand} />,
  },
];

export default function PurposeSelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Campus + Local pre-selected to match the design.
  const [selected, setSelected] = useState<Record<string, boolean>>({
    campus: true,
    local: true,
  });

  const count = Object.values(selected).filter(Boolean).length;

  const toggle = (key: string) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  // Campus task selected -> university picker; otherwise the location prompt.
  const finish = () =>
    router.push(selected.campus ? '/location-university' : '/location-permission');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>What kind of tasks do you want to use TaskHub for?</Text>
          <Text style={styles.subtitle}>Pick one or more. We’ll personalize your experience.</Text>
        </View>

        {/* Categories */}
        <View style={styles.cards}>
          {CATEGORIES.map((cat) => {
            const isSelected = !!selected[cat.key];
            return (
              <Pressable
                key={cat.key}
                onPress={() => toggle(cat.key)}
                style={[styles.card, isSelected ? styles.cardSelected : styles.cardDefault]}>
                <View style={[styles.cardIcon, { backgroundColor: cat.iconColor }]}>
                  {cat.renderIcon()}
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{cat.title}</Text>
                  <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
                </View>
                {isSelected ? (
                  <CheckCircle size={20} color={COLORS.check} />
                ) : (
                  <Circle size={20} color={COLORS.iconSecondary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={finish}>
          <Text style={styles.buttonLabel}>
            {count > 0 ? `Continue with ${count} Selected` : 'Continue'}
          </Text>
        </Pressable>

        <Pressable hitSlop={8} onPress={finish} style={styles.skipRow}>
          <Text style={styles.skipLabel}>Skip for now</Text>
        </Pressable>
      </View>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  heading: {
    gap: 6,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
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
  cards: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardDefault: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardSelected: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.infoBorder,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 21.9,
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  skipRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
