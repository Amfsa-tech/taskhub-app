import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ShieldImage = require('@/assets/images/3d-shield.png');

const COLORS = {
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  danger: '#ef4444',
  textLight: '#8e8e9f',
};

const REASONS = [
  'Changed my mind',
  'Found Someone else',
  'Task no longer needed',
  'Budget Issues',
  'Tasker was unresponsive',
  'Others',
];

interface CancelTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
}

export function CancelTaskModal({ visible, onClose, onConfirmCancel }: CancelTaskModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState('Changed my mind');
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedReason('Changed my mind');
      setIsCancelled(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirmCancel(selectedReason);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
          {isCancelled ? (
            <View style={styles.cancelledContainer}>
              <Image source={ShieldImage} style={styles.shieldImage} />
              <Text style={styles.cancelledTitle}>Task Cancelled</Text>
              <Text style={styles.cancelledSubtitle}>
                No worries. Your task has been cancelled and is no longer visible to taskers. You can post a new task anytime.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
                onPress={handleConfirm}>
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Cancel Task</Text>
                <Text style={styles.sectionLabel}>REASON FOR CANCELLATION</Text>
              </View>

              <View style={styles.body}>
                <View style={styles.reasonsList}>
                  {REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        style={styles.radioRow}
                        onPress={() => setSelectedReason(reason)}>
                        <Text style={styles.radioText}>{reason}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.buttons}>
                  <Pressable
                    style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
                    onPress={() => setIsCancelled(true)}>
                    <Text style={styles.confirmLabel}>Confirm Cancellation</Text>
                  </Pressable>

                  <Pressable style={styles.keepButton} hitSlop={8} onPress={onClose}>
                    <Text style={styles.keepLabel}>Keep Task</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
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
    gap: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  body: {
    gap: 24,
  },
  reasonsList: {
    gap: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  radioText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.brand,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  buttons: {
    gap: 8,
  },
  confirmButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  confirmLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  keepButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textLight,
  },
  // Cancelled feedback layout
  cancelledContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  shieldImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  cancelledTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cancelledSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  doneButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  doneLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
