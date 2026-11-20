import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const biometricLabel = (label?: string) => /face/i.test(label ?? '') ? 'Face ID' : /touch/i.test(label ?? '') ? 'Touch ID' : 'Fingerprint';

export function BiometricIcon({ label, size = 44 }: { label?: string; size?: number }) {
  const face = biometricLabel(label) === 'Face ID';
  return Platform.OS === 'ios'
    ? <SymbolView name={face ? 'faceid' : 'touchid'} tintColor="#6c3bff" style={{ width: size, height: size }} />
    : <MaterialCommunityIcons name={face ? 'face-recognition' : 'fingerprint'} size={size} color="#6c3bff" />;
}

export function BiometricDialog({ visible, label, title, description, onClose, dismissible = true, children }: {
  visible: boolean;
  label?: string;
  title: string;
  description: string;
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const close = () => { if (dismissible) onClose(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable accessibilityLabel="Dismiss biometric dialog" accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View accessibilityViewIsModal style={styles.card}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close biometric dialog" disabled={!dismissible}
            onPress={close} style={[styles.close, !dismissible && styles.disabled]}>
            <MaterialCommunityIcons name="close" size={22} color="#78788c" />
          </Pressable>
          <View style={styles.iconHalo}>
            <View style={styles.iconCenter}><BiometricIcon label={label} /></View>
            <View style={styles.shield}><MaterialCommunityIcons name="shield-check" size={17} color="#6c3bff" /></View>
          </View>
          <Text style={styles.eyebrow}>SECURE SIGN-IN</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {children}
          <View style={styles.footer}>
            <MaterialCommunityIcons name="lock-outline" size={14} color="#78788c" />
            <Text style={styles.footerText}>Your device handles the biometric check.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#11112288' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 28, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#eee7ff' },
  close: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconHalo: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#faf7ff', borderWidth: 1, borderColor: '#eee7ff', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 4 },
  iconCenter: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#f3eeff', alignItems: 'center', justifyContent: 'center' },
  shield: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4d6ff', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#6c3bff', fontFamily: 'Geist_600SemiBold', fontSize: 10, letterSpacing: 1.6 },
  title: { color: '#111122', fontFamily: 'Geist_600SemiBold', fontSize: 23, lineHeight: 29, textAlign: 'center' },
  description: { color: '#5a5a70', fontFamily: 'Geist_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  footerText: { color: '#78788c', fontFamily: 'Geist_400Regular', fontSize: 11, flexShrink: 1 },
  disabled: { opacity: 0.4 },
});
