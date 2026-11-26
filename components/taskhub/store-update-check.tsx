import TaskHubLogo from '@/assets/images/taskhub-logo.svg';
import { checkStoreUpdate, storeName, type StoreUpdate } from '@/lib/store-updates';
import { withStoreTimeout } from '@/lib/store-update-utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type State = 'closed' | 'checking' | 'available' | 'current' | 'error';
export function StoreUpdateCheck() {
  const [state, setState] = useState<State>('closed');
  const [result, setResult] = useState<StoreUpdate>();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const busy = useRef(false);
  const insets = useSafeAreaInsets();
  useEffect(() => () => { request.current++; }, []);
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  const close = () => { request.current++; busy.current = false; setOpening(false); setState('closed'); };
  const check = async () => {
    if (busy.current) return;
    busy.current = true;
    const id = ++request.current;
    setState('checking'); setResult(undefined); setError('');
    try {
      const update = await withStoreTimeout(checkStoreUpdate());
      if (id !== request.current) return;
      setResult(update); setState(update.available ? 'available' : 'current');
    } catch {
      if (id !== request.current) return;
      setError(`We could not check the ${storeName}. Check your connection and try again. Store checks require an installed store build.`);
      setState('error');
    } finally { if (id === request.current) busy.current = false; }
  };
  const openStore = async () => {
    if (!result || busy.current) return;
    const id = request.current;
    busy.current = true;
    setOpening(true); setError('');
    try { await Linking.openURL(result.storeUrl); }
    catch { if (id === request.current) setError(`Could not open the ${storeName}. Please try again.`); }
    finally { if (id === request.current) { busy.current = false; setOpening(false); } }
  };
  return <>
    <Pressable accessibilityRole="button" onPress={() => void check()} style={styles.row}>
      <View style={styles.icon}><Ionicons name="cloud-download-outline" size={19} color="#6c3bff" /></View>
      <Text style={styles.rowLabel}>Check for updates</Text>
      <Ionicons name="chevron-forward" size={16} color="#a0a0ba" />
    </Pressable>
    <Modal visible={state !== 'closed'} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(24, insets.top), paddingBottom: Math.max(24, insets.bottom) }]}>
          <View accessibilityViewIsModal style={styles.card}>
            <LinearGradient colors={['#6c3bff', '#4621c0']} style={styles.hero}>
              {state === 'checking' ? <ActivityIndicator size="large" color="#fff" /> : <View style={styles.logo}><TaskHubLogo width={112} height={50} /></View>}
              <Text accessibilityRole="header" style={styles.title}>{state === 'checking' ? 'Checking for store updates' : state === 'available' ? 'New update available' : state === 'current' ? 'You’re up to date' : 'Unable to check for updates'}</Text>
              <Text style={styles.description}>{state === 'checking' ? `Please wait while we check the ${storeName} for the latest version.` : state === 'available' ? `A new version is available on the ${storeName}. Please update from the store to get the latest features and improvements.` : state === 'current' ? `You have the latest version available to you on the ${storeName}.` : error}</Text>
            </LinearGradient>
            <View style={styles.actions}>
              {error && state !== 'error' ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {state === 'available' ? <Pressable accessibilityRole="button" disabled={opening} onPress={() => void openStore()} style={[styles.primary, opening && { opacity: 0.5 }]}>{opening ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Update from Store</Text>}</Pressable> : null}
              {state === 'error' ? <Pressable accessibilityRole="button" onPress={() => void check()} style={styles.primary}><Text style={styles.primaryText}>Try again</Text></Pressable> : null}
              <Pressable accessibilityRole="button" onPress={close} style={styles.secondary}><Text style={styles.secondaryText}>{state === 'checking' ? 'Cancel' : 'Close'}</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3eeff' },
  rowLabel: { flex: 1, fontFamily: 'Geist_500Medium', fontSize: 15, color: '#111122' },
  overlay: { flex: 1, backgroundColor: 'rgba(17,17,34,0.5)' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' },
  hero: { padding: 28, alignItems: 'center', gap: 20 },
  logo: { backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 23, lineHeight: 29, textAlign: 'center', color: '#fff' },
  description: { fontFamily: 'Geist_400Regular', fontSize: 14, lineHeight: 22, textAlign: 'center', color: '#fff' },
  actions: { padding: 20, gap: 12 },
  primary: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: '#6c3bff', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  secondary: { minHeight: 44, padding: 12, alignItems: 'center' },
  secondaryText: { color: '#6c3bff', fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  error: { color: '#b01515', fontSize: 14, lineHeight: 20 },
});
