import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deletePreviousWork, uploadPreviousWork } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { pickImages } from '@/lib/image-picker';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e4e4ee',
  placeholder: '#d0d0da',
};

/**
 * The backend models a portfolio as **images only** — `Tasker.previousWork` is
 * an array of `{ url, publicId }` with no title, description or link field, and
 * `POST /api/auth/previous-work` accepts nothing but the files. So this screen
 * is a gallery, not a list of projects: the "Project Title" and "Portfolio
 * (Link)" inputs it used to show had nowhere to be saved.
 *
 * Uploads append (max 10 total) and deletes are by subdocument id.
 */
const MAX_ITEMS = 10;

export default function TaskerPortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  const items = user?.previousWork ?? [];
  const remaining = MAX_ITEMS - items.length;

  const afterChange = async () => {
    await refreshProfile();
    // A tasker's public profile embeds previousWork.
    queryClient.invalidateQueries({ queryKey: ['taskers'] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const picked = await pickImages(Math.min(remaining, 5));
      if (picked.length === 0) return null;
      return uploadPreviousWork(picked);
    },
    onSuccess: (result) => {
      if (result) afterChange();
    },
    onError: (e) =>
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePreviousWork(id),
    onSuccess: afterChange,
    onError: (e) =>
      Alert.alert('Could not remove', e instanceof Error ? e.message : 'Please try again.'),
  });

  const confirmDelete = (id?: string) => {
    if (!id) return;
    Alert.alert('Remove image?', 'This takes it off your public profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Add your portfolio</Text>
        <Text style={styles.pageSubtitle}>
          Show customers your best work. A portfolio helps customers trust you and increases your
          chances of getting hired.
        </Text>

        {items.length === 0 ? (
          <Pressable
            style={styles.addCard}
            disabled={uploadMutation.isPending}
            onPress={() => uploadMutation.mutate()}>
            <View style={styles.addIconWrap}>
              {uploadMutation.isPending ? (
                <ActivityIndicator color={COLORS.brand} />
              ) : (
                <MaterialCommunityIcons name="plus" size={28} color={COLORS.brand} />
              )}
            </View>
            <Text style={styles.addCardTitle}>Add Portfolio</Text>
            <Text style={styles.addCardSub}>Up to {MAX_ITEMS} images</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.countLabel}>
              {items.length} of {MAX_ITEMS} images
            </Text>
            <View style={styles.grid}>
              {items.map((item, index) => (
                <View key={item.publicId || item._id || index} style={styles.gridItem}>
                  <Image source={{ uri: item.url }} style={styles.gridImage} contentFit="cover" />
                  <Pressable
                    style={styles.removeBadge}
                    hitSlop={8}
                    onPress={() => confirmDelete(item._id)}>
                    <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}

              {remaining > 0 && (
                <Pressable
                  style={[styles.gridItem, styles.uploadTile]}
                  disabled={uploadMutation.isPending}
                  onPress={() => uploadMutation.mutate()}>
                  {uploadMutation.isPending ? (
                    <ActivityIndicator color={COLORS.brand} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="camera-outline"
                        size={22}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.uploadLabel}>Upload</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {remaining === 0 && (
              <Text style={styles.limitNote}>
                You&apos;ve reached the {MAX_ITEMS}-image limit. Remove one to add another.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  countLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.brandSubtle,
  },
  gridImage: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,17,34,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  limitNote: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 14,
  },
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
  scroll: { padding: 16, gap: 16 },
  pageTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Add card (empty state)
  addCard: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  addIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  addCardSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Existing item rows
  existingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  existingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  existingTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  existingLink: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Form: image row
  imageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  imagePlaceholder: {
    flex: 1,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E0E0E8',
  },
  // Form fields
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  fieldInput: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  // Bottom bar
  bottomBar: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
  },
  addBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#e0e0ea' },
  addBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  addBtnTextDisabled: { color: '#a0a0b0' },
});
