import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  pillBg: '#f3eeff',
  border: '#e0e0ea',
};

type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  message: string;
  tag: string;
  time: string;
};

const ABOUT_YOU_REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Chioma. A',
    initials: 'CA',
    rating: 5,
    message: 'Super fast and reliable. Delivered my prints exactly on time.',
    tag: 'Printing & Scanning',
    time: '2 Days ago',
  },
  {
    id: '2',
    name: 'Amaka N.',
    initials: 'AN',
    rating: 5,
    message: 'Good work, delivered on time.',
    tag: 'Printing & Scanning',
    time: '2 Days ago',
  },
];

const YOU_GAVE_REVIEWS: Review[] = [
  {
    id: '3',
    name: 'Tunde .O',
    initials: 'TO',
    rating: 5,
    message: 'Excellent laptop repair. Fixed my screen and cleaned the keyboard.',
    tag: 'Hardware',
    time: '1 Week ago',
  },
  {
    id: '4',
    name: 'Hassan. A',
    initials: 'HA',
    rating: 4,
    message: 'Very polite and delivery was fast. Standard output.',
    tag: 'Logistics',
    time: '3 Days ago',
  },
];

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'about' | 'gave'>('about');

  const reviews = activeTab === 'about' ? ABOUT_YOU_REVIEWS : YOU_GAVE_REVIEWS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <Pressable
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}>
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About you
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'gave' && styles.tabActive]}
            onPress={() => setActiveTab('gave')}>
            <Text style={[styles.tabText, activeTab === 'gave' && styles.tabTextActive]}>
              You gave
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.card}>
            {/* Header info */}
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{review.initials}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{review.name}</Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Ionicons
                      key={idx}
                      name="star"
                      size={16}
                      color={idx < review.rating ? '#fbbf24' : '#e0e0ea'}
                      style={styles.star}
                    />
                  ))}
                </View>
              </View>
              <Pressable hitSlop={8} onPress={() => {}} style={styles.flagButton}>
                <Ionicons name="flag-outline" size={18} color="#a0a0ba" />
              </Pressable>
            </View>

            {/* Message Body */}
            <Text style={styles.message}>{review.message}</Text>

            {/* Footer row */}
            <View style={styles.cardFooter}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{review.tag}</Text>
              </View>
              <Text style={styles.timeText}>{review.time}</Text>
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
  flex: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.canvas,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  placeholderButton: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.sunken,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  flagButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.sunken,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
