import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  border: '#e0e0ea',
  starActive: '#fbbf24',
  starInactive: '#d0d0db',
  inputBg: '#f4f4f7',
  disabled: '#eaeaf0',
  disabledText: '#a0a0ba',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  taskerName: string;
  taskerAvatar: string;
  onSubmit: (rating: number, comment: string) => void;
}

export function RateTaskerModal({ visible, onClose, taskerName, taskerAvatar, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const handleStarPress = (index: number) => {
    setRating(index);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
    // Reset state after submitting
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const firstName = taskerName.split('.')[0].split(' ')[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate {firstName}</Text>
            <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Tasker Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: taskerAvatar }} style={styles.avatar} />
          </View>

          {/* Stars Rating Row */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((index) => {
              const active = rating >= index;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleStarPress(index)}
                  hitSlop={8}
                  style={styles.starPressable}>
                  <Ionicons
                    name={active ? 'star' : 'star-outline'}
                    size={36}
                    color={active ? COLORS.starActive : COLORS.starInactive}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Experience Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Share your Experience (optional)..."
              placeholderTextColor="#a0a0ba"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitBtn,
              rating === 0 ? styles.submitBtnDisabled : styles.submitBtnEnabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0}>
            <Text
              style={[
                styles.submitBtnText,
                { color: rating === 0 ? COLORS.disabledText : '#ffffff' },
              ]}>
              Submit Review
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e5e5e5',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  starPressable: {
    padding: 2,
  },
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 100,
  },
  input: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    flex: 1,
    padding: 0,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnEnabled: {
    backgroundColor: COLORS.brand,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
  },
});
