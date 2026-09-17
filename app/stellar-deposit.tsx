import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Clipboard, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { getStellarDepositInfo } from '@/lib/api/wallet';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', text: '#111122', secondary: '#5a5a70', border: '#e0e0ea', warning: '#92400e', warningBg: '#fffbea' };

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.copyCard}>
      <View style={styles.copyInfo}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value}</Text></View>
      <Pressable hitSlop={8} onPress={() => Clipboard.setString(value)}><Ionicons name="copy-outline" size={21} color={COLORS.brand} /></Pressable>
    </View>
  );
}

export default function StellarDepositScreen() {
  const query = useQuery({ queryKey: ['wallet', 'stellar-deposit'], queryFn: ({ signal }) => getStellarDepositInfo(signal) });
  const info = query.data?.data;
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Stellar Deposit" />
      {query.isLoading ? <View style={styles.state}><ActivityIndicator color={COLORS.brand} /></View> : query.isError || !info ? (
        <View style={styles.state}><Text style={styles.body}>Couldn’t load Stellar deposit details.</Text><Pressable onPress={() => query.refetch()}><Text style={styles.retry}>Retry</Text></Pressable></View>
      ) : (
        <View style={styles.content}>
          <View style={styles.network}><Ionicons name="planet-outline" size={22} color={COLORS.brand} /><View><Text style={styles.title}>Deposit via Stellar</Text><Text style={styles.body}>Network: {info.network}</Text></View></View>
          <CopyRow label="WALLET ADDRESS" value={info.walletAddress} />
          <CopyRow label="MEMO ID — REQUIRED" value={info.memoId} />
          <View style={styles.notice}><Ionicons name="warning-outline" size={20} color={COLORS.warning} /><Text style={styles.noticeText}>Include this exact memo with every transfer. A missing or incorrect memo can prevent automatic crediting.</Text></View>
          {info.exchangeRate ? <Text style={styles.body}>Current server rate: {info.exchangeRate}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.canvas }, state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, content: { padding: 16, gap: 16 }, network: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f3eeff', borderRadius: 16, padding: 16 }, title: { fontFamily: 'Geist_600SemiBold', fontSize: 17, color: COLORS.text }, body: { fontFamily: 'Geist_400Regular', fontSize: 14, lineHeight: 20, color: COLORS.secondary }, copyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16 }, copyInfo: { flex: 1, gap: 7 }, label: { fontFamily: 'Geist_700Bold', fontSize: 11, letterSpacing: 0.7, color: COLORS.secondary }, value: { fontFamily: 'Geist_500Medium', fontSize: 14, lineHeight: 20, color: COLORS.text }, notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.warningBg, borderRadius: 12, padding: 14 }, noticeText: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 19, color: COLORS.warning }, retry: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.brand } });
