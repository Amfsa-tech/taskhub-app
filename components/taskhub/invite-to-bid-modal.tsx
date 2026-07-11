import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PaperPlane from '@/assets/icons/paper-plane-tilt.svg';
import { CheckCircle } from '@/components/icons/check-circle';

const COLORS = {
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  backdrop: 'rgba(17, 17, 34, 0.4)',
};

export function InviteToBidModal({
  visible,
  taskerName,
  onClose,
  onSend,
}: {
  visible: boolean;
  taskerName: string;
  onClose: () => void;
  onSend?: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  // Prefill the personal note whenever the sheet opens for a tasker.
  useEffect(() => {
    if (visible) {
      setMessage(`Hi ${taskerName}, I'd like you to bid on my task`);
      setIsSent(false);
    }
  }, [visible, taskerName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
          {isSent ? (
            <View style={styles.successContainer}>
              <CheckCircle size={64} color="#12b76a" />
              <Text style={styles.successTitle}>Invite sent</Text>
              <Text style={styles.successSubtitle}>You have successfully sent an invite to a tasker</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Invite to Bid</Text>
                <Text style={styles.subtitle}>Send a personal invite to {taskerName}</Text>
              </View>

              <View style={styles.body}>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={`Hi ${taskerName}, i'd like you to bid on my task`}
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.buttons}>
                  <Pressable
                    style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
                    onPress={() => {
                      onSend?.(message);
                      setIsSent(true);
                      setTimeout(() => {
                        onClose();
                      }, 2000);
                    }}>
                    <PaperPlane width={18} height={18} />
                    <Text style={styles.sendLabel}>Send Invite</Text>
                  </Pressable>

                  <Pressable style={styles.cancelButton} hitSlop={8} onPress={onClose}>
                    <Text style={styles.cancelLabel}>Cancel</Text>
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
  body: {
    gap: 24,
  },
  input: {
    height: 104,
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
  buttons: {
    gap: 8,
  },
  sendButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.9,
  },
  sendLabel: {
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
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  successTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
