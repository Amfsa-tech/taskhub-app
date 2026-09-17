import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { formatNaira } from '@/lib/api/tasks';
import { getSpendingAnalytics, transactionTitle } from '@/lib/api/wallet';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', text: '#111122', secondary: '#5a5a70', border: '#e0e0ea', success: '#0d6639', danger: '#b01515' };

export default function SpendingAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const analytics = useQuery({
    queryKey: ['wallet', 'spending-analytics'],
    queryFn: ({ signal }) => getSpendingAnalytics(signal),
  });
  const data = analytics.data?.data;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Spending Analytics" />
      {analytics.isLoading ? (
        <View style={styles.state}><ActivityIndicator color={COLORS.brand} /></View>
      ) : analytics.isError || !data ? (
        <View style={styles.state}>
          <Text style={styles.secondary}>Couldn’t load your spending analytics.</Text>
          <Pressable onPress={() => analytics.refetch()}><Text style={styles.retry}>Retry</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Total spent</Text>
            <Text style={styles.heroValue}>{formatNaira(data.totalSpent)}</Text>
            <Text style={styles.heroMeta}>{data.transactionCount} settled transactions</Text>
          </View>
          <View style={styles.grid}>
            <View style={styles.metric}><Text style={styles.metricLabel}>Funded</Text><Text style={[styles.metricValue, { color: COLORS.success }]}>{formatNaira(data.totalFunded)}</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>Net wallet flow</Text><Text style={[styles.metricValue, { color: data.net >= 0 ? COLORS.success : COLORS.danger }]}>{formatNaira(data.net)}</Text></View>
          </View>
          <Text style={styles.heading}>BREAKDOWN</Text>
          <View style={styles.card}>
            {data.breakdownByPurpose.length ? data.breakdownByPurpose.map((item, index) => (
              <View key={item.purpose} style={[styles.row, index > 0 && styles.divider]}>
                <View style={styles.rowIcon}><Ionicons name="receipt-outline" size={18} color={COLORS.brand} /></View>
                <View style={styles.rowInfo}><Text style={styles.rowTitle}>{transactionTitle({ paymentPurpose: item.purpose, description: undefined } as any)}</Text><Text style={styles.secondary}>{item.count} transactions</Text></View>
                <Text style={styles.rowAmount}>{formatNaira(item.total)}</Text>
              </View>
            )) : <Text style={styles.secondary}>No settled transactions yet.</Text>}
          </View>
          {data.monthly.length ? <>
            <Text style={styles.heading}>MONTHLY ACTIVITY</Text>
            <View style={styles.card}>
              {data.monthly.map((month, index) => (
                <View key={month.month} style={[styles.row, index > 0 && styles.divider]}>
                  <View style={styles.rowInfo}><Text style={styles.rowTitle}>{month.month}</Text><Text style={styles.secondary}>Funded {formatNaira(month.funded)}</Text></View>
                  <Text style={styles.rowAmount}>{formatNaira(month.spent)} spent</Text>
                </View>
              ))}
            </View>
          </> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas }, state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, content: { padding: 16, gap: 16 },
  hero: { backgroundColor: COLORS.brand, borderRadius: 16, padding: 20, gap: 5 }, heroLabel: { fontFamily: 'Geist_500Medium', fontSize: 14, color: '#e4d6ff' }, heroValue: { fontFamily: 'Geist_700Bold', fontSize: 32, color: '#fff' }, heroMeta: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#f3eeff' },
  grid: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, gap: 6 }, metricLabel: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.secondary }, metricValue: { fontFamily: 'Geist_700Bold', fontSize: 18 },
  heading: { fontFamily: 'Geist_700Bold', fontSize: 11, letterSpacing: 0.7, color: COLORS.secondary, marginTop: 4 }, card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }, divider: { borderTopWidth: 1, borderTopColor: COLORS.border }, rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3eeff', alignItems: 'center', justifyContent: 'center' }, rowInfo: { flex: 1, gap: 3 }, rowTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.text, textTransform: 'capitalize' }, rowAmount: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: COLORS.text }, secondary: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.secondary }, retry: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.brand },
});
