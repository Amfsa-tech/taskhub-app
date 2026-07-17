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
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e4e4ee',
  placeholder: '#d0d0da',
};

type PortfolioItem = {
  id: string;
  images: string[]; // URIs
  title: string;
  link: string;
};

export default function TaskerPortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // UI state: 'empty' | 'form'
  const [view, setView] = useState<'empty' | 'form'>('empty');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');

  const canAdd = title.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      images: [],
      title: title.trim(),
      link: link.trim(),
    };
    setPortfolioItems((prev) => [...prev, newItem]);
    setTitle('');
    setLink('');
    setView('empty');
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (view === 'empty') {
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
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Add your portfolio</Text>
          <Text style={styles.pageSubtitle}>
            Show customers your best work. A portfolio helps customers trust you and increases your chances of getting hired.
          </Text>

          {/* Existing items */}
          {portfolioItems.map((item) => (
            <View key={item.id} style={styles.existingItem}>
              <View style={styles.existingIconWrap}>
                <MaterialCommunityIcons name="image-multiple" size={20} color={COLORS.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.existingTitle}>{item.title}</Text>
                {item.link ? (
                  <Text style={styles.existingLink} numberOfLines={1}>{item.link}</Text>
                ) : null}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id))}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          ))}

          {/* Add card */}
          <Pressable style={styles.addCard} onPress={() => setView('form')}>
            <View style={styles.addIconWrap}>
              <MaterialCommunityIcons name="plus" size={28} color={COLORS.brand} />
            </View>
            <Text style={styles.addCardTitle}>Add Portfolio</Text>
            <Text style={styles.addCardSub}>Images, Links, documents</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Form state ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => setView('empty')} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Add your portfolio</Text>
        <Text style={styles.pageSubtitle}>
          Show customers your best work. A portfolio helps customers trust you and increases your chances of getting hired.
        </Text>

        {/* Image upload row */}
        <View style={styles.imageRow}>
          {/* Upload button */}
          <Pressable style={styles.uploadBox}>
            <MaterialCommunityIcons name="camera-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.uploadLabel}>Upload</Text>
          </Pressable>

          {/* Placeholder slots */}
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.imagePlaceholder} />
          ))}
        </View>

        {/* Project Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Project Title</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="E.g  Event Flyer Project"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Portfolio Link */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Portfolio (Link)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="behance.net/username"
            placeholderTextColor={COLORS.textSecondary}
            value={link}
            onChangeText={setLink}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
          disabled={!canAdd}
          onPress={handleAdd}>
          <Text style={[styles.addBtnText, !canAdd && styles.addBtnTextDisabled]}>
            Add portfolio
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
