import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { registerCaptchaRequester } from '@/lib/captcha';

// Load the native module only when configured and a protected request starts.
const Challenge = lazy(() => import('./turnstile-challenge'));
const enabled = Boolean(process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim());
type Pending = { resolve: (token: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };

export function CaptchaProvider() {
  const [open, setOpen] = useState(false);
  const pending = useRef<Pending | null>(null);
  const finish = (token?: string) => {
    const current = pending.current; pending.current = null;
    if (current) { clearTimeout(current.timer); if (token) current.resolve(token); else current.reject(new Error('Security check cancelled. Please try again when you are ready.')); }
    setOpen(false);
  };
  useEffect(() => {
    if (!enabled) return;
    const unregister = registerCaptchaRequester(() => new Promise<string>((resolve, reject) => {
      if (pending.current) { reject(new Error('A security check is already open. Please finish it first.')); return; }
      const timer = setTimeout(() => finish(), 180000);
      pending.current = { resolve, reject, timer }; setOpen(true);
    }));
    return () => {
      unregister();
      if (pending.current) { clearTimeout(pending.current.timer); pending.current.reject(new Error('Security check closed. Please try again.')); pending.current = null; }
    };
  }, []);
  if (!enabled) return null;
  return <Modal transparent visible={open} animationType="fade" onRequestClose={() => finish()}>
    <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.card}>
      <Text style={styles.title}>Quick security check</Text>
      <Text style={styles.body}>Complete this check to continue securely.</Text>
      {open && <Suspense fallback={<ActivityIndicator color="#6c3bff" />}><Challenge onToken={finish} /></Suspense>}
      <Pressable accessibilityRole="button" style={styles.cancel} onPress={() => finish()}><Text style={styles.cancelText}>Cancel</Text></Pressable>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', backgroundColor: '#0008', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 16, width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 21, color: '#111122' },
  body: { fontSize: 14, color: '#5a5a70' },
  cancel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0ea', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#6c3bff', fontFamily: 'Geist_600SemiBold' },
});
