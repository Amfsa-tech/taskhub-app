import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';
import { usePostTask } from '@/context/PostTaskContext';
import { pickImages } from '@/lib/image-picker';
import { useAuth } from '@/lib/auth/auth-context';
import { isCampusCategory } from '@/lib/api/categories';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
};

export default function PostDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, patch } = usePostTask();
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const { user } = useAuth();
  const isRemoteTask = /digital|remote/i.test(draft.mainCategory?.name ?? '');

  const [addressPrefilled, setAddressPrefilled] = useState(false);
  useEffect(() => {
    if (addressPrefilled || !user) return;
    setAddressPrefilled(true);
    if (draft.location) return;
    patch({
      location: [user.address, user.city, user.residentState].filter((value) => typeof value === 'string' && value.trim()).join(', '),
    });
  }, [addressPrefilled, draft.location, patch, user]);
  const [showImages, setShowImages] = useState(draft.images.length > 0);
  const [tagInput, setTagInput] = useState('');
  const budget = Number(draft.budget);
  const validBudget = Number.isFinite(budget) && budget >= 1000;
  const isCampus = Boolean(draft.mainCategory && isCampusCategory(draft.mainCategory));
  const suggestedBudget = isCampus ? "₦4,000" : "₦15,000";
  const suggestedTitle =
    draft.subCategories.map((service) => service.displayName).join(' and ') ||
    draft.mainCategory?.displayName ||
    'Describe the task';

  const canContinue =
    draft.title.trim().length >= 5 &&
    draft.description.trim().length >= 20 &&
    validBudget &&
    (isRemoteTask || Boolean(draft.location.trim())) &&
    (!isCampus || draft.university !== null);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || draft.tags.includes(tag)) return;
    patch({ tags: [...draft.tags, tag] });
    setTagInput('');
  };

  const addPhotos = async () => {
    const remaining = 5 - draft.images.length;
    if (remaining <= 0) return;
    const picked = await pickImages(remaining);
    if (picked.length) patch({ images: [...draft.images, ...picked].slice(0, 5) });
  };

  const removePhoto = (uri: string) =>
    patch({ images: draft.images.filter((img) => img.uri !== uri) });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={3} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Task details</Text>
            <Text style={styles.subtitle}>Tell us more about what you need.</Text>
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                accessibilityLabel="Title"
                style={styles.input}
                placeholder={suggestedTitle}
                placeholderTextColor={COLORS.placeholder}
                value={draft.title}
                onChangeText={(title) => patch({ title })}
              />
              {draft.title.length > 0 && draft.title.trim().length < 5 && (
                <Text style={styles.error}>Title must be at least 5 characters long.</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                accessibilityLabel="Description"
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe what you need..."
                placeholderTextColor={COLORS.placeholder}
                value={draft.description}
                onChangeText={(description) => patch({ description })}
                multiline
              />
              {draft.description.length > 0 && draft.description.trim().length < 20 && (
                <Text style={styles.error}>Description must be at least 20 characters long.</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Set Budget</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputValue}>₦</Text>
                <TextInput
                  accessibilityLabel="Set Budget"
                  style={styles.inlineInput}
                  placeholder="1,000"
                  placeholderTextColor={COLORS.placeholder}
                  value={draft.budget}
                  onChangeText={(budget) => patch({ budget })}
                  keyboardType="numeric"
                />
              </View>
              {draft.budget !== '' && !validBudget ? (
                <Text style={styles.error}>Minimum budget is ₦1,000</Text>
              ) : (
                <Text style={styles.helper}>Suggested budget {suggestedBudget}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bidding deadline (optional)</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Bidding deadline"
                style={styles.inputRow} onPress={() => setShowDeadlinePicker(true)}>
                <Text style={draft.biddingDeadline ? styles.inputValue : styles.inputPlaceholder}>
                  {draft.biddingDeadline || 'No deadline'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              </Pressable>
              {draft.biddingDeadline ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Remove bidding deadline" onPress={() => patch({ biddingDeadline: '' })} style={{ minHeight: 40, justifyContent: 'center' }}>
                  <Text style={{ color: COLORS.brand, fontFamily: 'Geist_600SemiBold', fontSize: 14 }}>Remove deadline</Text>
                </Pressable>
              ) : null}
              <Text style={styles.helper}>Last day taskers can bid. With no bids by then, the task closes and its budget returns to your wallet. Leave blank to keep bidding open.</Text>
              {showDeadlinePicker ? (
                <DateTimePicker
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  themeVariant="light"
                  value={draft.biddingDeadline ? new Date(`${draft.biddingDeadline}T12:00:00`) : new Date()}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDeadlinePicker(false);
                    if (event.type !== 'set' || !selectedDate) return;
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    patch({ biddingDeadline: `${year}-${month}-${day}` });
                  }}
                />
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Task address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  accessibilityLabel="Task address"
                  style={styles.inlineInput}
                  placeholder="Enter the full task address"
                  placeholderTextColor={COLORS.placeholder}
                  value={draft.location}
                  onChangeText={(location) => patch({ location })}
                />
              </View>
              <Text style={styles.helper}>Include a city or state if you choose.</Text>
            </View>

            {isCampus ? (
              <View style={styles.field}>
                <Text style={styles.label}>University</Text>
                <Pressable
                  style={styles.inputRow} accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/location-university', params: { forTask: 'true' } })
                  }>
                  <Text style={draft.university ? styles.inputValue : styles.inputPlaceholder}>
                    {draft.university?.name ?? 'Select your university'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.option, styles.optionCard]}>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Enable Bargain/Bidding</Text>
                <Text style={styles.helper}>Allows Taskers to make custom budget bids.</Text>
              </View>
              <Switch accessibilityLabel="Enable Bargain/Bidding" value={draft.isBiddingEnabled}
                onValueChange={(isBiddingEnabled) => patch({ isBiddingEnabled })} trackColor={{ true: '#ad97ff' }} />
            </View>

            <View style={styles.optionCard}>
              <View style={styles.option}>
                <Text style={styles.label}>Reference Images</Text>
                <Switch accessibilityLabel="Reference Images" value={showImages} onValueChange={(enabled) => {
                  setShowImages(enabled);
                  if (!enabled) patch({ images: [] });
                }} trackColor={{ true: '#ad97ff' }} />
              </View>
              {showImages && (
                <>
                  {draft.images.length < 5 && (
                    <Pressable style={styles.addTile} accessibilityRole="button" onPress={addPhotos}>
                      <Ionicons name="cloud-upload-outline" size={20} color={COLORS.textSecondary} />
                      <Text style={styles.addLabel}>Upload Task Photos</Text>
                    </Pressable>
                  )}
                  <View style={styles.photoRow}>
                    {draft.images.map((img, index) => (
                      <View key={img.uri} style={styles.thumb}>
                        <Image source={{ uri: img.uri }} style={styles.thumbImage} contentFit="cover" />
                        <Pressable style={styles.thumbRemove} hitSlop={6} accessibilityRole="button"
                          accessibilityLabel={`Remove photo ${index + 1}`} onPress={() => removePhoto(img.uri)}>
                          <Text style={styles.thumbRemoveText}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tags (optional)</Text>
              <View style={styles.inlineRow}>
                <TextInput accessibilityLabel="Tag" style={[styles.input, styles.flex]} value={tagInput}
                  placeholder="Enter a tag" placeholderTextColor={COLORS.placeholder}
                  onChangeText={setTagInput} onSubmitEditing={addTag} returnKeyType="done" />
                <Pressable accessibilityRole="button" onPress={addTag} style={styles.tagButton}>
                  <Text style={styles.tagText}>Add</Text>
                </Pressable>
              </View>
              <View style={styles.photoRow}>
                {draft.tags.map((tag) => (
                  <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Remove tag ${tag}`}
                    onPress={() => patch({ tags: draft.tags.filter((item) => item !== tag) })} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close" size={14} color={COLORS.brand} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton
            label="Next"
            disabled={!canContinue}
            onPress={() => router.push('/post-review')}
          />
        </View>
      </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fields: {
    gap: 16,
  },
  field: {
    gap: 4,
  },
  label: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 48,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12 },
  inlineInput: { flex: 1, minHeight: 48, color: COLORS.textPrimary, fontSize: 15 },
  inlineRow: { flexDirection: 'row', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  optionCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, gap: 8 },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.textPrimary },
  tagButton: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3eeff', borderRadius: 6, padding: 6 },
  tagText: { color: COLORS.brand, fontFamily: 'Geist_600SemiBold', fontSize: 13 },
  error: { color: '#b01515', fontSize: 12 },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(17,17,34,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    lineHeight: 18,
    color: '#ffffff',
  },
  addTile: {
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: COLORS.surface,
  },
  addLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  helper: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  inputValue: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  inputPlaceholder: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    color: COLORS.placeholder,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
