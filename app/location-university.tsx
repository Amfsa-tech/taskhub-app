import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { CheckCircle } from '@/components/icons/check-circle';
import { GraduationCap } from '@/components/icons/graduation-cap';
import { Headset } from '@/components/icons/headset';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  focus: '#6c3bff',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
};

const UNIVERSITIES = [
  'University of Ibadan',
  'University of Ilorin',
  'University of Lagos',
  'University of Agriculture (FUNAAB)',
  'Obafemi Awolowo University (OAU)',
  'University of Lagos (UNILAG)',
  'Ahmadu Bello University (ABU)',
  'University of Benin (UNIBEN)',
  'University of Nigeria (UNN)',
];

export default function LocationUniversityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('University of Ilorin');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter((u) => u.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.fixed}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => {}}>
            <Headset size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Support</Text>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Select your University</Text>
          <Text style={styles.subtitle}>This helps us connect you with campus taskers.</Text>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your university..."
            placeholderTextColor={COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* University list */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {results.map((name, i) => {
          const isSelected = name === selected;
          return (
            <Pressable
              key={`${name}-${i}`}
              onPress={() => setSelected(name)}
              style={[styles.row, isSelected && styles.rowSelected]}>
              <View style={styles.rowLeft}>
                <GraduationCap size={20} color={COLORS.textPrimary} />
                <Text style={styles.rowLabel}>{name}</Text>
              </View>
              {isSelected && <CheckCircle size={20} color={COLORS.focus} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/success')}>
          <Text style={styles.buttonLabel}>Continue</Text>
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
  fixed: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.focus,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
});
