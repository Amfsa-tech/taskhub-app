import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import MapPin from '@/assets/icons/map-pin.svg';
import Clock from '@/assets/icons/clock.svg';
import CaretDown from '@/assets/icons/caret-down.svg';
import CaretRight from '@/assets/icons/caret-right.svg';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  brandSubtle: '#f3eeff',
  onBrand: '#ffffff',
};

type TaskItem = {
  id: string;
  title: string;
  category: 'Local' | 'Errand' | 'Remote' | 'Campus';
  price: string;
  bidsCount: number;
  location: string;
  timeAgo: string;
};

const MOCK_TASKS: TaskItem[] = [
  {
    id: 'discover-1',
    title: 'Fix my Laptop Screen',
    category: 'Local',
    price: '₦20,000',
    bidsCount: 0,
    location: 'Remote', // matches design: location pin says 'Remote' for task 1
    timeAgo: '2mins ago',
  },
  {
    id: 'discover-2',
    title: 'Deliver Package to Lekki',
    category: 'Errand',
    price: '₦2,000',
    bidsCount: 5,
    location: 'Yaba → Lekki',
    timeAgo: '10mins ago',
  },
  {
    id: 'discover-3',
    title: 'Design a flyer for event',
    category: 'Remote',
    price: '₦2,000',
    bidsCount: 5,
    location: 'Remote',
    timeAgo: '18 May',
  },
];

const FILTER_PILLS = ['All', 'Campus', 'Local Services', 'Remote', 'Errands'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // New modal states
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortBy, setSortBy] = useState('Best Match');

  // Filter criteria states
  const [selectedDistance, setSelectedDistance] = useState('Any');
  const [selectedBudget, setSelectedBudget] = useState('Any');
  const [selectedCategory, setSelectedCategory] = useState('Remote');
  const [selectedUrgency, setSelectedUrgency] = useState('Any');

  const getPillIcon = (pill: string, active: boolean) => {
    const color = active ? COLORS.onBrand : COLORS.textSecondary;
    switch (pill) {
      case 'Campus':
        return <Ionicons name="school" size={14} color={color} style={{ marginRight: 4 }} />;
      case 'Local Services':
        return <Ionicons name="home" size={14} color={color} style={{ marginRight: 4 }} />;
      case 'Remote':
        return <Ionicons name="laptop" size={14} color={color} style={{ marginRight: 4 }} />;
      case 'Errands':
        return <Ionicons name="cube" size={14} color={color} style={{ marginRight: 4 }} />;
      default:
        return null;
    }
  };

  const renderTag = (category: TaskItem['category']) => {
    switch (category) {
      case 'Local':
        return (
          <View style={[styles.tag, styles.tagLocal]}>
            <Ionicons name="home" size={12} color="#1e88e5" style={{ marginRight: 4 }} />
            <Text style={styles.tagLocalText}>Local</Text>
          </View>
        );
      case 'Errand':
        return (
          <View style={[styles.tag, styles.tagErrand]}>
            <Ionicons name="cube" size={12} color="#b45309" style={{ marginRight: 4 }} />
            <Text style={styles.tagErrandText}>Errand</Text>
          </View>
        );
      case 'Remote':
        return (
          <View style={[styles.tag, styles.tagRemote]}>
            <Ionicons name="laptop" size={12} color="#0d6639" style={{ marginRight: 4 }} />
            <Text style={styles.tagRemoteText}>Remote</Text>
          </View>
        );
      case 'Campus':
        return (
          <View style={[styles.tag, styles.tagCampus]}>
            <Ionicons name="school" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.tagCampusText}>Campus</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search and Filters Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputWrap}>
          <MagnifyingGlass size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search task"
            placeholderTextColor={COLORS.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Pressable style={styles.sortButton} onPress={() => setSortSheetVisible(true)}>
          <Text style={styles.sortButtonText}>Sort</Text>
          <CaretDown width={10} height={10} color={COLORS.textSecondary} />
        </Pressable>

        <Pressable style={styles.filterButton} onPress={() => setFilterSheetVisible(true)}>
          <MaterialCommunityIcons name="tune" size={20} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}>
          {FILTER_PILLS.map((pill) => {
            const active = pill === activeFilter;
            return (
              <Pressable
                key={pill}
                onPress={() => setActiveFilter(pill)}
                style={[styles.pill, active && styles.pillActive]}>
                {getPillIcon(pill, active)}
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {pill}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Search results summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>3 tasks found · Best Match</Text>
      </View>

      {/* Task List */}
      <FlatList
        data={MOCK_TASKS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={styles.taskCard} onPress={() => router.push({ pathname: '/task-details', params: { id: item.id } })}>
            <View style={styles.taskCardTop}>
              {renderTag(item.category)}
              <Text style={styles.taskCardPrice}>{item.price}</Text>
            </View>
            <View style={styles.taskCardMain}>
              <Text style={styles.taskCardTitle}>{item.title}</Text>
              <Text style={styles.taskCardBids}>
                {item.bidsCount === 0 ? '0 Bids' : `${item.bidsCount} Bids`}
              </Text>
            </View>
            <View style={styles.taskCardMeta}>
              <View style={styles.taskMetaItem}>
                <MapPin width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.taskMetaText}>{item.location}</Text>
              </View>
              <View style={styles.taskMetaItem}>
                <Clock width={14} height={14} color={COLORS.textSecondary} />
                <Text style={styles.taskMetaText}>{item.timeAgo}</Text>
              </View>
              <CaretRight width={9} height={16} style={styles.caretRight} />
            </View>
          </Pressable>
        )}
      />

      {/* Sort By Bottom Sheet */}
      <Modal visible={sortSheetVisible} transparent animationType="slide" onRequestClose={() => setSortSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            <Pressable style={styles.closeButtonX} onPress={() => setSortSheetVisible(false)}>
              <Ionicons name="close" size={24} color="#5a5a70" />
            </Pressable>
            <Text style={styles.sheetTitle}>Sort By</Text>

            <View style={{ gap: 4, marginTop: 12 }}>
              {['Newest First', 'Nearest First', 'Highest Budget', 'Best Match'].map((option) => (
                <Pressable
                  key={option}
                  style={styles.actionRowBtn}
                  onPress={() => {
                    setSortBy(option);
                    setSortSheetVisible(false);
                  }}>
                  <Text style={[styles.actionRowText, sortBy === option && { color: COLORS.primary }]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Advanced Filter Bottom Sheet */}
      <Modal visible={filterSheetVisible} transparent animationType="slide" onRequestClose={() => setFilterSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterSheetVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            <Pressable style={styles.closeButtonX} onPress={() => setFilterSheetVisible(false)}>
              <Ionicons name="close" size={24} color="#5a5a70" />
            </Pressable>
            <Text style={styles.sheetTitle}>Advanced Filter</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420, width: '100%' }}>
              {/* Distance */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Distance</Text>
                <View style={styles.filterPillsRow}>
                  {['Any', '1km', '3km', '5km', '10km', 'Remote'].map((val) => {
                    const active = selectedDistance === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelectedDistance(val)}
                        style={[styles.filterPill, active && styles.filterPillActive]}>
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Budget Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Budget Range</Text>
                <View style={styles.filterPillsRow}>
                  {['Any', '₦1K–₦3K', '₦3k-5k', '₦5k-10k', '₦10k+'].map((val) => {
                    const active = selectedBudget === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelectedBudget(val)}
                        style={[styles.filterPill, active && styles.filterPillActive]}>
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Category */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.filterPillsRow}>
                  {['Campus', 'Local Services', 'Errands', 'Remote'].map((val) => {
                    const active = selectedCategory === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelectedCategory(val)}
                        style={[styles.dropdownPill, active && styles.dropdownPillActive]}>
                        <Ionicons name="chevron-down" size={14} color={active ? '#ffffff' : '#111122'} />
                        <Text style={[styles.dropdownPillText, active && styles.dropdownPillTextActive]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Urgency */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Urgency</Text>
                <View style={styles.filterPillsRow}>
                  {['Any', 'Urgent'].map((val) => {
                    const active = selectedUrgency === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelectedUrgency(val)}
                        style={[styles.filterPill, active && styles.filterPillActive]}>
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom buttons */}
            <View style={styles.filterActionsRow}>
              <Pressable
                style={styles.filterResetBtn}
                onPress={() => {
                  setSelectedDistance('Any');
                  setSelectedBudget('Any');
                  setSelectedCategory('Remote');
                  setSelectedUrgency('Any');
                  setFilterSheetVisible(false);
                }}>
                <Text style={styles.filterResetBtnText}>Reset</Text>
              </Pressable>
              <Pressable
                style={styles.filterApplyBtn}
                onPress={() => {
                  setFilterSheetVisible(false);
                }}>
                <Text style={styles.filterApplyBtnText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff0f3',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff0f3',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  sortButtonText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff0f3',
    borderRadius: 12,
    width: 44,
    height: 44,
  },
  categoriesWrapper: {
    marginTop: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#eff0f3',
  },
  pillActive: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.onBrand,
  },
  summaryRow: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 8,
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCardPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  taskCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  taskCardBids: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.primary,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  caretRight: {
    marginLeft: 'auto',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagLocal: {
    backgroundColor: '#eff6ff',
  },
  tagLocalText: {
    color: '#1e88e5',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagErrand: {
    backgroundColor: '#fffbea',
  },
  tagErrandText: {
    color: '#b45309',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagRemote: {
    backgroundColor: '#edfaf3',
  },
  tagRemoteText: {
    color: '#0d6639',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  tagCampus: {
    backgroundColor: '#f3eeff',
  },
  tagCampusText: {
    color: COLORS.primary,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    gap: 16,
  },
  closeButtonX: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 10,
  },
  sheetTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: '#111122',
    textAlign: 'left',
    marginBottom: 8,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    width: '100%',
  },
  actionRowText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#111122',
  },
  filterSection: {
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  filterSectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#111122',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#5a5a70',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
  },
  dropdownPillActive: {
    backgroundColor: COLORS.primary,
  },
  dropdownPillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#111122',
  },
  dropdownPillTextActive: {
    color: '#ffffff',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  filterResetBtn: {
    width: '48%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.primary,
  },
  filterApplyBtn: {
    width: '48%',
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
