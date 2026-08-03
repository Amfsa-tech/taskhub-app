import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { CheckCircle } from '@/components/icons/check-circle';
import { GraduationCap } from '@/components/icons/graduation-cap';
import { Headset } from '@/components/icons/headset';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { useUniversities } from '@/lib/api/queries';
import { filterUniversities } from '@/lib/api/universities';
import { updateProfile } from '@/lib/auth/auth-api';

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

export default function LocationUniversityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  /** University `_id` — the backend resolves the reference from it. */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const universitiesQ = useUniversities();
  const universities = useMemo(
    () => universitiesQ.data?.universities ?? [],
    [universitiesQ.data],
  );

  // No `?q=` on the endpoint — the full list is small and name-sorted, so it
  // ships in one request and filters here.
  const results = useMemo(
    () => filterUniversities(universities, query),
    [universities, query],
  );

  const save = useMutation({
    mutationFn: (id: string) => updateProfile({ university: id }),
  });

  const goNext = () => router.push('/location-permission');

  /**
   * Save the pick, then continue. As with the purpose screen, a failed save
   * still advances — the university is a matching hint, not a gate, and
   * blocking onboarding on a flaky connection is worse than a missing field.
   */
  const finish = async () => {
    if (selectedId) {
      try {
        await save.mutateAsync(selectedId);
      } catch {
        // Non-blocking by design.
      }
    }
    goNext();
  };

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
        {universitiesQ.isLoading ? (
          <View style={styles.listState}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : universitiesQ.isError ? (
          <View style={styles.listState}>
            <Text style={styles.listStateError}>Couldn’t load universities.</Text>
            <Pressable hitSlop={8} onPress={() => universitiesQ.refetch()}>
              <Text style={styles.listStateRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.listState}>
            <Text style={styles.listStateText}>
              {query.trim() ? 'No universities match that search.' : 'No universities listed yet.'}
            </Text>
          </View>
        ) : (
          results.map((uni) => {
            const isSelected = uni._id === selectedId;
            return (
              <Pressable
                key={uni._id}
                onPress={() => setSelectedId(uni._id)}
                style={[styles.row, isSelected && styles.rowSelected]}>
                <View style={styles.rowLeft}>
                  <GraduationCap size={20} color={COLORS.textPrimary} />
                  <Text style={styles.rowLabel}>
                    {uni.abbreviation ? `${uni.name} (${uni.abbreviation})` : uni.name}
                  </Text>
                </View>
                {isSelected && <CheckCircle size={20} color={COLORS.focus} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          disabled={save.isPending}
          style={({ pressed }) => [
            styles.button,
            (pressed || save.isPending) && styles.buttonPressed,
          ]}
          onPress={finish}>
          <Text style={styles.buttonLabel}>{save.isPending ? 'Saving…' : 'Continue'}</Text>
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
  listState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  listStateText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listStateError: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#dc2626',
  },
  listStateRetry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.primary,
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
