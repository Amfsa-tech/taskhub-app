import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

export function DownloadMyData() {
  const { accountType, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { setBusy(false); setError(null); return () => { controller.current?.abort(); controller.current = null; }; }, [user?._id, accountType]);
  const download = async () => {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError(null);
    let removeFile: (() => void) | undefined;
    try {
      const response = await api.get<{ status: string; data: unknown }>('/api/auth/my-data', { cache: 'no-store', signal: request.signal });
      if (request.signal.aborted) return;
      if (response.status !== 'success' || !response.data) throw new Error('Could not prepare your data. Please try again.');
      const [{ File, Paths }, Sharing] = await Promise.all([import('expo-file-system'), import('expo-sharing')]);
      if (request.signal.aborted) return;
      if (!await Sharing.isAvailableAsync()) throw new Error('File saving is unavailable on this device. You can download your data from Settings on the TaskHub website.');
      if (request.signal.aborted) return;
      const file = new File(Paths.cache, `taskhub-my-data-${Date.now()}.json`);
      file.create(); removeFile = () => { if (file.exists) file.delete(); };
      file.write(JSON.stringify(response, null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your TaskHub data' });
    } catch (reason) { if (!request.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not download your data. Please try again.'); }
    finally {
      try { removeFile?.(); } catch { /* The OS can clear cached files before cleanup. */ }
      if (controller.current === request) controller.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  };
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !user }} disabled={busy || !user} onPress={() => void download()} style={({ pressed }) => [styles.button, (pressed || busy) && { opacity: 0.6 }]}>
      {busy ? <ActivityIndicator color="#6c3bff" /> : <Ionicons name="download-outline" size={20} color="#6c3bff" />}
      <Text style={styles.label}>{busy ? 'Preparing your data…' : 'Download my data'}</Text>
    </Pressable>
    <Text style={styles.help}>Save a copy of your personal information and account records.</Text>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  label: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111122' },
  help: { fontSize: 13, color: '#5a5a70', lineHeight: 19 },
  error: { fontSize: 13, color: '#b42318', lineHeight: 19 },
});
