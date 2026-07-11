import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  backdrop: 'rgba(17, 17, 34, 0.4)',
  border: '#e0e0ea',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  taskerName: string;
}

export function HireAgainModal({ visible, onClose, taskerName }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSelectExisting = () => {
    onClose();
    router.push({
      pathname: '/choose-existing-task' as any,
      params: { taskerName },
    });
  };

  const handleCreateInvite = () => {
    onClose();
    router.push({
      pathname: '/post',
      params: { inviteTasker: taskerName },
    });
  };

  // Extract first name (e.g. Chioma. A -> Chioma) for friendly headers
  const firstName = taskerName.split('.')[0].split(' ')[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Hire {firstName} again</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Choose how you'd like to work with {firstName}. You'll discuss the details first, then confirm the task before any payment is made.
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {/* Option 1: Select Existing Task */}
            <Pressable
              style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}
              onPress={handleSelectExisting}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet-outline" size={22} color={COLORS.brand} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Select Existing Task</Text>
                <Text style={styles.optionSubtitle}>Invite {firstName} to see one of your open task</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
            </Pressable>

            {/* Option 2: Create & Invite */}
            <Pressable
              style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}
              onPress={handleCreateInvite}>
              <View style={styles.iconContainer}>
                <Ionicons name="add-outline" size={22} color={COLORS.brand} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Create & Invite</Text>
                <Text style={styles.optionSubtitle}>Post New task and auto invite {firstName.toLowerCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
            </Pressable>
          </View>
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
    gap: 16,
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
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  options: {
    gap: 12,
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  optionSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  chevron: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
