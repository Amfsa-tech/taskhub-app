import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// ─── Data ────────────────────────────────────────────────────────────────────

type CategoryId = 'campus' | 'local' | 'errands' | 'digital';

const CATEGORIES: {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    id: 'campus',
    title: 'Campus Task',
    subtitle: 'Printing, assignments, hostel help, tutorials.',
    icon: 'school',
    iconBg: '#3b5bff',
    iconColor: '#fff',
  },
  {
    id: 'local',
    title: 'Local Services',
    subtitle: 'Repairs, cleaning, electricians, home services.',
    icon: 'home',
    iconBg: '#f97316',
    iconColor: '#fff',
  },
  {
    id: 'errands',
    title: 'Errands & Deliveries',
    subtitle: 'Pickups, deliveries, shopping, quick runs.',
    icon: 'package-variant-closed',
    iconBg: '#6c3bff',
    iconColor: '#fff',
  },
  {
    id: 'digital',
    title: 'Digital / Remote',
    subtitle: 'Design, typing, editing, coding, remote help.',
    icon: 'laptop',
    iconBg: '#16a34a',
    iconColor: '#fff',
  },
];

type Service = { id: string; name: string; category: CategoryId };

const ALL_SERVICES: Service[] = [
  { id: 'printing', name: 'Printing & Photocopy', category: 'campus' },
  { id: 'assignment', name: 'Assignment', category: 'campus' },
  { id: 'binding', name: 'Project Binding', category: 'campus' },
  { id: 'pastq', name: 'Past Question', category: 'campus' },
  { id: 'research', name: 'Research Assistance', category: 'campus' },
  { id: 'dataentry', name: 'Data Entry', category: 'campus' },
  { id: 'fileconv', name: 'File Conversion', category: 'local' },
  { id: 'docedit', name: 'Document Editing', category: 'local' },
  { id: 'errand', name: 'Errand & Delivery', category: 'errands' },
  { id: 'socmed', name: 'Social media Design', category: 'local' },
  { id: 'content', name: 'Content Writing', category: 'digital' },
  { id: 'spreadsheet', name: 'Spreadsheet Work', category: 'local' },
  { id: 'uiux', name: 'UIUX Design', category: 'digital' },
  { id: 'graphic', name: 'Graphic Design', category: 'digital' },
  { id: 'video', name: 'Video Editing', category: 'digital' },
  { id: 'webdesign', name: 'Web Design', category: 'digital' },
  { id: 'repairs', name: 'Home Repairs', category: 'local' },
  { id: 'cleaning', name: 'Cleaning', category: 'local' },
];

const SECTION_LABELS: Record<CategoryId, string> = {
  campus: 'Campus Services',
  local: 'Local Services',
  errands: 'Errands & Deliveries',
  digital: 'Digital / Remote',
};

const POPULAR: Service['id'][] = ['printing', 'assignment', 'binding', 'pastq', 'research', 'dataentry'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskerServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'category' | 'services'>('category');
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // ── Category step helpers ─────────────────────────────────────────────────
  const toggleCategory = (id: CategoryId) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
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

  // Derive visible services: all services whose category is selected (or all if none selected)
  const activeCategories = selectedCategories.size > 0 ? selectedCategories : new Set(CATEGORIES.map((c) => c.id));

  const filteredServices = ALL_SERVICES.filter(
    (s) =>
      activeCategories.has(s.category) &&
      s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const popular = filteredServices.filter((s) => POPULAR.includes(s.id));
  const byCategory = Array.from(activeCategories).map((catId) => ({
    catId,
    services: filteredServices.filter((s) => s.category === catId),
  })).filter((g) => g.services.length > 0);

  // Selected chip labels
  const selectedChips = ALL_SERVICES.filter((s) => selectedServices.has(s.id)).map((s) => ({
    id: s.id,
    // shorten label for chips
    label: s.name.length > 12 ? s.name.slice(0, 10) + '…' : s.name,
  }));

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
            {CATEGORIES.map((cat) => {
              const selected = selectedCategories.has(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  onPress={() => toggleCategory(cat.id)}>
                  <View style={[styles.catIconWrap, { backgroundColor: cat.iconBg }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.iconColor} />
                  </View>
                  <View style={styles.catText}>
                    <Text style={styles.catTitle}>{cat.title}</Text>
                    <Text style={styles.catSubtitle}>{cat.subtitle}</Text>
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

        {/* Popular section — only when search is empty */}
        {search === '' && popular.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Popular</Text>
            <View style={styles.serviceCard}>
              {popular.map((s, idx) => (
                <View key={s.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <Pressable style={styles.serviceRow} onPress={() => toggleService(s.id)}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    {selectedServices.has(s.id) && (
                      <View style={styles.checkFill}>
                        <MaterialCommunityIcons name="check" size={13} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Per-category sections */}
        {byCategory.map(({ catId, services }) => {
          // Don't re-list popular items in category if showing popular section
          const items = search === '' ? services.filter((s) => !POPULAR.includes(s.id)) : services;
          if (items.length === 0) return null;
          return (
            <View key={catId} style={styles.section}>
              <Text style={styles.sectionLabel}>{SECTION_LABELS[catId as CategoryId]}</Text>
              <View style={styles.serviceCard}>
                {items.map((s, idx) => (
                  <View key={s.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <Pressable style={styles.serviceRow} onPress={() => toggleService(s.id)}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {selectedServices.has(s.id) && (
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
          style={[styles.saveBtn, selectedServices.size === 0 && styles.saveBtnDisabled]}
          disabled={selectedServices.size === 0}
          onPress={() => router.back()}>
          <Text style={[styles.saveBtnText, selectedServices.size === 0 && styles.saveBtnTextDisabled]}>
            Save
          </Text>
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
