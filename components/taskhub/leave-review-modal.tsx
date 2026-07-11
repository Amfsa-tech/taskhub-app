import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  starOn: '#fbbf24',
  starOff: '#d1d1db',
  error: '#dc2626',
};

export function LeaveReviewModal({
  visible,
  taskTitle,
  pending,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  taskTitle?: string;
  pending?: boolean;
  onSubmit: (rating: number, reviewText: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setRating(0);
      setReviewText('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    if (rating < 1) {
      setError('Please select a rating.');
      return;
    }
    onSubmit(rating, reviewText.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={pending ? undefined : onClose}>
        <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Leave a review</Text>
            {taskTitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                How was “{taskTitle}”?
              </Text>
            ) : null}
          </View>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                hitSlop={6}
                onPress={() => {
                  setRating(n);
                  setError(null);
                }}>
                <Text style={[styles.star, n <= rating ? styles.starOn : styles.starOff]}>★</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share a few details (optional)"
            placeholderTextColor={COLORS.placeholder}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || pending) && styles.pressed,
              ]}
              disabled={pending}
              onPress={submit}>
              {pending ? (
                <ActivityIndicator color={COLORS.onBrand} />
              ) : (
                <Text style={styles.submitLabel}>Submit review</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancelButton} hitSlop={8} onPress={onClose} disabled={pending}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  star: {
    fontSize: 40,
    lineHeight: 46,
  },
  starOn: {
    color: COLORS.starOn,
  },
  starOff: {
    color: COLORS.starOff,
  },
  input: {
    minHeight: 96,
    backgroundColor: COLORS.sunken,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  error: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  buttons: {
    gap: 8,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.9,
  },
  submitLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.brand,
  },
});
