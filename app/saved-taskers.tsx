import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReadyToHireModal } from '@/components/taskhub/ready-to-hire-modal';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  pillBg: '#f3eeff',
  successBg: '#edfaf3',
  successText: '#0d6639',
};

type SavedTasker = {
  id: string;
  name: string;
  rating: string;
  jobs: string;
  distance: string;
  tags: string[];
  avatar: any;
  price: string;
};

const SAVED_TASKERS: SavedTasker[] = [
  {
    id: '1',
    name: 'Chioma. A',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    tags: ['Printing', 'Phone Repair'],
    avatar: require('@/assets/images/chats/chat-1.png'),
    price: '₦1,500',
  },
  {
    id: '2',
    name: 'Tunde .O',
    rating: '4.8',
    jobs: '94 Jobs',
    distance: '0.8km',
    tags: ['Printing', 'Programming'],
    avatar: require('@/assets/images/chats/chat-2.jpg'),
    price: '₦1,800',
  },
];

export default function SavedTaskersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ReadyToHireModal state
  const [hireName, setHireName] = useState<string | null>(null);
  const [hireAvatar, setHireAvatar] = useState<any>(null);
  const [hirePrice, setHirePrice] = useState<string | null>(null);

  const handleHirePress = (tasker: SavedTasker) => {
    setHireName(tasker.name);
    setHireAvatar(tasker.avatar);
    setHirePrice(tasker.price);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Taskers</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Scrollable list */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {SAVED_TASKERS.map((tasker) => (
          <View key={tasker.id} style={styles.card}>
            {/* Header info row */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrap}>
                <Image source={tasker.avatar} style={styles.avatar} contentFit="cover" />
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userDetails}>
                  <Text style={styles.name}>{tasker.name}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-sharp" size={10} color={COLORS.successText} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>

                {/* Rating & details */}
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#fbbf24" style={styles.starIcon} />
                  <Text style={styles.metaText}>{tasker.rating}</Text>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.metaText}>{tasker.jobs}</Text>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.metaText}>{tasker.distance}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {tasker.tags.map((tag) => (
                    <View key={tag} style={styles.pill}>
                      <Text style={styles.pillText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Hire button */}
            <Pressable
              style={({ pressed }) => [styles.hireButton, pressed && styles.pressed]}
              onPress={() => handleHirePress(tasker)}>
              <Text style={styles.hireLabel}>Hire Now</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Ready to Hire modal */}
      <ReadyToHireModal
        visible={hireName !== null}
        taskerName={hireName ?? ''}
        taskerAvatar={hireAvatar ?? null}
        taskerPrice={hirePrice}
        onClose={() => setHireName(null)}
      />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.successText,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bullet: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.brand,
  },
  hireButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.9,
  },
});
