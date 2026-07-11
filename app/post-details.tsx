import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';
<<<<<<< HEAD
import { usePostTask } from '@/context/PostTaskContext';
import { pickImages } from '@/lib/image-picker';
=======
import { useTasks } from '@/context/TaskContext';
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b

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
<<<<<<< HEAD
  const { draft, patch } = usePostTask();

  const canContinue =
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    draft.budget.trim().length > 0;

  const addPhotos = async () => {
    const remaining = 5 - draft.images.length;
    if (remaining <= 0) return;
    const picked = await pickImages(remaining);
    if (picked.length) patch({ images: [...draft.images, ...picked].slice(0, 5) });
  };

  const removePhoto = (uri: string) =>
    patch({ images: draft.images.filter((img) => img.uri !== uri) });
=======
  const { draftTask, updateDraftTask } = useTasks();

  const [title, setTitle] = useState(draftTask?.title || '');
  const [description, setDescription] = useState(draftTask?.description || '');
  const [location, setLocation] = useState(draftTask?.location || '');
  const [budget, setBudget] = useState(draftTask?.budget || '');

  const handleNext = () => {
    updateDraftTask({
      title,
      description,
      location,
      budget,
    });
    router.push('/post-review');
  };
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={3} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
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
                style={styles.input}
                placeholder="Printing & Photocopy, Assignment"
                placeholderTextColor={COLORS.placeholder}
                value={draft.title}
                onChangeText={(title) => patch({ title })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe what you need..."
                placeholderTextColor={COLORS.placeholder}
                value={draft.description}
                onChangeText={(description) => patch({ description })}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Unilorin , First Gate"
                placeholderTextColor={COLORS.placeholder}
                value={draft.location}
                onChangeText={(location) => patch({ location })}
              />
              <Pressable hitSlop={6} onPress={() => { }}>
                <Text style={styles.useMap}>Use Map</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Set Budget</Text>
              <TextInput
                style={styles.input}
                placeholder="₦1,000"
                placeholderTextColor={COLORS.placeholder}
                value={draft.budget}
                onChangeText={(budget) => patch({ budget })}
                keyboardType="numeric"
              />
<<<<<<< HEAD
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Photos (optional)</Text>
              <View style={styles.photoRow}>
                {draft.images.map((img) => (
                  <View key={img.uri} style={styles.thumb}>
                    <Image source={{ uri: img.uri }} style={styles.thumbImage} contentFit="cover" />
                    <Pressable
                      style={styles.thumbRemove}
                      hitSlop={6}
                      onPress={() => removePhoto(img.uri)}>
                      <Text style={styles.thumbRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {draft.images.length < 5 ? (
                  <Pressable style={styles.addTile} onPress={addPhotos}>
                    <Text style={styles.addPlus}>+</Text>
                    <Text style={styles.addLabel}>Add</Text>
                  </Pressable>
                ) : null}
              </View>
=======
              {draftTask?.category === 'local' && (
                <Text style={styles.helper}>Suggested Price: ₦4,000</Text>
              )}
              {draftTask?.category === 'campus' && (
                <Text style={styles.helper}>Suggested Price: ₦1,000</Text>
              )}
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
<<<<<<< HEAD
          <PrimaryButton
            label="Next"
            disabled={!canContinue}
            onPress={() => router.push('/post-review')}
          />
=======
          <PrimaryButton label="Next" onPress={handleNext} />
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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
    width: '100%',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    width: '100%',
  },
  fields: {
    gap: 16,
  },
  field: {
    gap: 4,
  },
  label: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
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
    minHeight: 125,
    textAlignVertical: 'top',
  },
  useMap: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
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
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: COLORS.surface,
  },
  addPlus: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 22,
    lineHeight: 24,
    color: COLORS.brand,
  },
  addLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
  helper: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
