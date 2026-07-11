import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircle } from '@/components/icons/check-circle';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import {
  COUNTRIES,
  setSelectedCountry,
  useSelectedCountry,
  type Country,
} from '@/lib/onboarding/country';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  iconSecondary: '#78788c',
};

export default function CountrySelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const selected = useSelectedCountry();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const choose = (country: Country) => {
    setSelectedCountry(country);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Close */}
        <Pressable style={styles.close} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </Pressable>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Select a Country</Text>
          <Text style={styles.subtitle}>This helps us know where you are</Text>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.iconSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your country…"
            placeholderTextColor={COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Results */}
        <View style={styles.list}>
          {results.map((country) => {
            const active = country === selected;
            return (
              <Pressable
                key={country}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => choose(country)}>
                <Text style={styles.rowLabel}>{country}</Text>
                {active ? <CheckCircle size={20} color={COLORS.primary} /> : null}
              </Pressable>
            );
          })}
          {results.length === 0 ? (
            <Text style={styles.empty}>No countries match “{query.trim()}”.</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 24 },
  close: { padding: 8, alignSelf: 'flex-start' },
  heading: { gap: 6 },
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  rowPressed: { opacity: 0.7 },
  rowLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  empty: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
});
