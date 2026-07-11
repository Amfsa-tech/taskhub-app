import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e2e2ec',
};

type BlockedUser = {
  id: string;
  name: string;
  reason: string;
  initials: string;
};

const INITIAL_BLOCKED: BlockedUser[] = [
  {
    id: '1',
    name: 'Femi Ade',
    reason: 'Inappropriate behavior',
    initials: 'FA',
  },
  {
    id: '2',
    name: 'Kola Bello',
    reason: 'Spam',
    initials: 'KB',
  },
];

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(INITIAL_BLOCKED);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: () => {
            setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
            Alert.alert('Success', `${user.name} has been unblocked.`);
          },
        },
      ]
    );
  };

  const filtered = blockedUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Blocked User" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#a0a0ba" />
          <TextInput
            placeholder="Search blocked users..."
            placeholderTextColor="#a0a0ba"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#a0a0ba" />
            </Pressable>
          )}
        </View>

        {/* User Card List */}
        {filtered.length > 0 ? (
          <View style={styles.card}>
            {filtered.map((user, index) => (
              <View key={user.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.userRow}>
                  {/* Initials Avatar */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.initials}</Text>
                  </View>

                  {/* User details */}
                  <View style={styles.details}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.reason}>{user.reason}</Text>
                  </View>

                  {/* Unblock button */}
                  <Pressable
                    style={({ pressed }) => [styles.unblockBtn, pressed && styles.pressed]}
                    onPress={() => handleUnblock(user)}>
                    <Text style={styles.unblockBtnText}>Unblock</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No blocked users found.</Text>
          </View>
        )}

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  searchBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  reason: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  unblockBtn: {
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: COLORS.brand,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
