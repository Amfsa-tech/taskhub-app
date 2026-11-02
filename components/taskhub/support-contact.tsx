import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_PHONE_NUMBERS, getSupportContactUrl } from '@/lib/support-contact';

export function SupportContactModal({ visible, onClose, message }: { visible: boolean; onClose: () => void; message?: string }) {
  const [opening, setOpening] = useState(false);
  const openContact = async (contact: typeof SUPPORT_PHONE_NUMBERS[number]) => {
    if (opening) return;
    setOpening(true);
    try {
      await Linking.openURL(getSupportContactUrl(contact, message));
      onClose();
    } catch {
      Alert.alert(contact.kind === 'whatsapp' ? 'Could not open WhatsApp' : 'Could not open the dialer', `Please try again, or contact support using ${contact.label}.`);
    } finally {
      setOpening(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        <Pressable style={styles.modal} onPress={() => {}} accessible={false} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">Customer Support</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close support channels">
              <Ionicons name="close" size={24} color="#5a5a70" />
            </Pressable>
          </View>
          <Text style={styles.description}>Choose WhatsApp chat or a phone call.</Text>
          <ScrollView contentContainerStyle={styles.options}>
            {SUPPORT_PHONE_NUMBERS.map((contact) => (
              <Pressable key={contact.href} accessibilityRole="link" accessibilityLabel={`${contact.actionLabel}, ${contact.label}`}
                disabled={opening} accessibilityState={{ disabled: opening }}
                onPress={() => void openContact(contact)} style={({ pressed }) => [styles.option, (pressed || opening) && styles.pressed]}>
                <Ionicons name={contact.kind === "whatsapp" ? "logo-whatsapp" : "call-outline"} size={24} color="#15803d" />
                <View style={styles.copy}>
                  <Text style={styles.channel}>{contact.actionLabel}</Text>
                  <Text style={styles.description}>{contact.label}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#5a5a70" />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SupportContactButton({ label = 'Contact Support', message, style }: { label?: string; message?: string; style?: StyleProp<ViewStyle> }) {
  const [visible, setVisible] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setVisible(true)} style={({ pressed }) => [styles.trigger, style, pressed && styles.pressed]}>
      <Ionicons name="help-buoy-outline" size={20} color="#15803d" />
      <Text style={styles.triggerLabel}>{label}</Text>
    </Pressable>
    <SupportContactModal visible={visible} onClose={() => setVisible(false)} message={message} />
  </>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#ffffff', borderRadius: 24, padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontFamily: 'Geist_600SemiBold', fontSize: 20, color: '#111122' },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  description: { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#5a5a70', flexShrink: 1 },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderWidth: 1, borderColor: '#e0e0ea', borderRadius: 12, padding: 16 },
  copy: { flex: 1, gap: 4 },
  channel: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111122' },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0ea', backgroundColor: '#ffffff' },
  triggerLabel: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#15803d', flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
