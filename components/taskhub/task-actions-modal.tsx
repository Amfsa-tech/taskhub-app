import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  danger: '#b01515',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onBoost?: () => void;
  onCancel?: () => void;
  onReport?: () => void;
}

export function TaskActionsModal({
  visible,
  onClose,
  onEdit,
  onBoost,
  onCancel,
  onReport,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Task Actions</Text>
          </View>

          <View style={styles.body}>
            {/* Edit Task */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onEdit?.();
              }}>
              <Ionicons name="pencil-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Edit Task</Text>
            </Pressable>

            {/* Boost Task */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onBoost?.();
              }}>
              <Ionicons name="rocket-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Boost Task</Text>
            </Pressable>

            {/* Cancel Task */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onCancel?.();
              }}>
              <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
              <Text style={styles.actionTextDanger}>Cancel task</Text>
            </Pressable>

            {/* Report Issue */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onReport?.();
              }}>
              <Ionicons name="warning-outline" size={22} color={COLORS.danger} />
              <Text style={styles.actionTextDanger}>Report Issue</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  body: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  actionText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  actionTextDanger: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.danger,
  },
  pressed: {
    opacity: 0.7,
  },
});
