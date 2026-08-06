import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { groupCategories, type Category } from '@/lib/api/categories';
import { useCategories } from '@/lib/api/queries';
import { updateTaskerCategories } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  brandMuted: '#e4d6ff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e4e4ee',
  selected: '#eff3ff',
};

// ─── Category presentation ───────────────────────────────────────────────────
//
// The backend category tree carries no icon or colour, so those are matched by
// name here with a neutral fallback. Everything else — which categories exist,
// what they're called, and which subcategories belong to them — comes from
// `GET /api/categories`.

const CATEGORY_STYLE: { match: string; icon: string; iconBg: string }[] = [
  { match: 'campus', icon: 'school', iconBg: '#3b5bff' },
  { match: 'local', icon: 'home', iconBg: '#f97316' },
  { match: 'errand', icon: 'package-variant-closed', iconBg: '#6c3bff' },
  { match: 'delivery', icon: 'package-variant-closed', iconBg: '#6c3bff' },
  { match: 'digital', icon: 'laptop', iconBg: '#16a34a' },
  { match: 'remote', icon: 'laptop', iconBg: '#16a34a' },
];

function styleFor(category: Category): { icon: string; iconBg: string } {
  const name = `${category.name} ${category.displayName}`.toLowerCase();
  return (
    CATEGORY_STYLE.find((c) => name.includes(c.match)) ?? {
      icon: 'shape-outline',
      iconBg: '#6c3bff',
    }
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskerServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  const categoriesQuery = useCategories();
  const groups = groupCategories(categoriesQuery.data?.categories ?? []);

  const [step, setStep] = useState<'category' | 'services'>('category');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Prefill from what the tasker already offers, once, after both the profile
  // and the category list have arrived.
  useEffect(() => {
    if (hydrated || groups.length === 0) return;
    const mains = (user?.mainCategories ?? []).map((c) => c._id);
    const subs = (user?.subCategories ?? []).map((c) => c._id);
    if (mains.length || subs.length) {
      setSelectedCategories(new Set(mains));
      setSelectedServices(new Set(subs));
    }
    setHydrated(true);
  }, [user, groups.length, hydrated]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTaskerCategories({
        mainCategories: Array.from(selectedCategories),
        subCategories: Array.from(selectedServices),
      }),
    onSuccess: async () => {
      await refreshProfile();
      // The feed is category-matched, so it is stale the moment this changes.
      queryClient.invalidateQueries({ queryKey: ['tasks', 'tasker'] });
      router.back();
    },
    onError: (e) =>
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.'),
  });

  // ── Category step helpers ─────────────────────────────────────────────────
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Drop any selected service whose parent category just went away.
    setSelectedServices((prev) => {
      if (selectedCategories.has(id)) {
        const group = groups.find((g) => g.main._id === id);
        if (group) {
          const next = new Set(prev);
          group.subs.forEach((sub) => next.delete(sub._id));
          return next;
        }
      }
      return prev;
    });
  };

  // ── Service step helpers ──────────────────────────────────────────────────
  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearAll = () => setSelectedServices(new Set());

  // Show subcategories of the selected mains (or everything if none picked).
  const activeGroups =
    selectedCategories.size > 0
      ? groups.filter((g) => selectedCategories.has(g.main._id))
      : groups;

  const term = search.trim().toLowerCase();
  const byCategory = activeGroups
    .map((g) => ({
      catId: g.main._id,
      label: g.main.displayName,
      services: g.subs.filter((sub) => sub.displayName.toLowerCase().includes(term)),
    }))
    .filter((g) => g.services.length > 0);

  const allSubs = groups.flatMap((g) => g.subs);
  const selectedChips = allSubs
    .filter((s) => selectedServices.has(s._id))
    .map((s) => ({
      id: s._id,
      label: s.displayName.length > 12 ? s.displayName.slice(0, 10) + '…' : s.displayName,
    }));

  if (categoriesQuery.isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  // ── Render: Category step ─────────────────────────────────────────────────
  if (step === 'category') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Services</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>What kind of tasks do you want to use TaskHub for?</Text>
          <Text style={styles.pageSubtitle}>Pick one or more. We'll personalize your experience.</Text>

          <View style={styles.categoryList}>
            {groups.map((group) => {
              const cat = group.main;
              const selected = selectedCategories.has(cat._id);
              const look = styleFor(cat);
              return (
                <Pressable
                  key={cat._id}
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  onPress={() => toggleCategory(cat._id)}>
                  <View style={[styles.catIconWrap, { backgroundColor: look.iconBg }]}>
                    <MaterialCommunityIcons name={look.icon as any} size={22} color="#fff" />
                  </View>
                  <View style={styles.catText}>
                    <Text style={styles.catTitle}>{cat.displayName}</Text>
                    <Text style={styles.catSubtitle} numberOfLines={2}>
                      {cat.description ||
                        group.subs.slice(0, 4).map((sub) => sub.displayName).join(', ')}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[
              styles.saveBtn,
              selectedCategories.size === 0 && styles.saveBtnDisabled,
            ]}
            disabled={selectedCategories.size === 0}
            onPress={() => setStep('services')}>
            <Text style={[styles.saveBtnText, selectedCategories.size === 0 && styles.saveBtnTextDisabled]}>
              {selectedCategories.size === 0
                ? 'Select a category'
                : `Continue with ${selectedCategories.size} Selected`}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Render: Services step ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => setStep('category')} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <Text style={styles.pageTitle}>Select a service</Text>
        <Text style={styles.pageSubtitle}>
          Pick all the services you can offer. You can change these anytime.
        </Text>

        {/* Selected chips */}
        {selectedServices.size > 0 && (
          <View style={styles.chipsSection}>
            <Text style={styles.chipsCount}>{selectedServices.size} Selected</Text>
            <Pressable onPress={clearAll}>
              <Text style={styles.clearAll}>Clear all</Text>
            </Pressable>
          </View>
        )}
        {selectedChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ gap: 8 }}>
            {selectedChips.map((chip) => (
              <Pressable key={chip.id} style={styles.chip} onPress={() => toggleService(chip.id)}>
                <Text style={styles.chipText}>{chip.label}</Text>
                <MaterialCommunityIcons name="close" size={14} color={COLORS.brand} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search service..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Per-category sections */}
        {byCategory.map(({ catId, label, services }) => {
          if (services.length === 0) return null;
          return (
            <View key={catId} style={styles.section}>
              <Text style={styles.sectionLabel}>{label}</Text>
              <View style={styles.serviceCard}>
                {services.map((s, idx) => (
                  <View key={s._id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <Pressable style={styles.serviceRow} onPress={() => toggleService(s._id)}>
                      <Text style={styles.serviceName}>{s.displayName}</Text>
                      {selectedServices.has(s._id) && (
                        <View style={styles.checkFill}>
                          <MaterialCommunityIcons name="check" size={13} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[
            styles.saveBtn,
            (selectedServices.size === 0 || saveMutation.isPending) && styles.saveBtnDisabled,
          ]}
          disabled={selectedServices.size === 0 || saveMutation.isPending}
          onPress={() => saveMutation.mutate()}>
          {saveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[styles.saveBtnText, selectedServices.size === 0 && styles.saveBtnTextDisabled]}>
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    letterSpacing: -0.41,
  },
  scroll: { padding: 16, gap: 12 },
  pageTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  // Category cards
  categoryList: { gap: 12, marginTop: 8 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
  },
  categoryCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.selected,
  },
  catIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: { flex: 1, gap: 2 },
  catTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  catSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  // Chips
  chipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chipsCount: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  clearAll: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.brand,
  },
  chipsScroll: { marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandSubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.brand,
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  // Service sections
  section: { gap: 6 },
  sectionLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 0,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  divider: { height: 1, backgroundColor: '#f2f2f7', marginHorizontal: 0 },
  serviceName: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  checkFill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom bar
  bottomBar: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#e0e0ea' },
  saveBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  saveBtnTextDisabled: { color: '#a0a0b0' },
});
