import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successText: '#0d6639',
  successBg: '#edfaf3',
  border: '#e0e0ea',
};

type Period = '7 Days' | '30 days' | '3 Months' | '6 Months' | '1 year';
const PERIOD_OPTIONS: Period[] = ['7 Days', '30 days', '3 Months', '6 Months', '1 year'];

const BAR_DATA: { month: string; pct: number }[] = [
  { month: 'JAN', pct: 0.6 },
  { month: 'FEB', pct: 0.42 },
  { month: 'MAR', pct: 0.85 },
  { month: 'APR', pct: 0.9 },
  { month: 'MAY', pct: 0.71 },
  { month: 'JUN', pct: 0.37 },
];

const MAX_BAR_H = 100;

const STAT_ITEMS = [
  { label: 'Jobs completed', value: '127', icon: 'briefcase-outline', iconColor: COLORS.brand, bg: COLORS.brandSubtle },
  { label: 'Acceptance rate', value: '82%', icon: 'check-circle-outline', iconColor: COLORS.successText, bg: COLORS.successBg },
  { label: 'Completion rate', value: '96%', icon: 'trending-up', iconColor: COLORS.brand, bg: COLORS.brandSubtle },
  { label: 'Average rating', value: '4.8/5', icon: 'star-outline', iconColor: '#e07b00', bg: '#fff4e5' },
  { label: 'Response Time', value: '~3 min', icon: 'clock-outline', iconColor: '#2563eb', bg: '#eff6ff' },
  { label: 'Repeat user', value: '34', icon: 'account-multiple-outline', iconColor: COLORS.brand, bg: COLORS.brandSubtle },
  { label: 'Profile Views', value: '312', icon: 'eye-outline', iconColor: '#c4001a', bg: '#fff1f1' },
  { label: 'Invitation Rate', value: '68%', icon: 'email-outline', iconColor: '#e07b00', bg: '#fff4e5' },
];

const INSIGHTS = [
  { icon: 'trending-up', color: COLORS.successText, text: 'Your earnings are up 12% from last month' },
  { icon: 'bell-outline', color: COLORS.brand, text: 'Your response time of ~3 min is faster than 80% of taskers' },
  { icon: 'star-outline', color: '#e07b00', text: 'Your 4.8 rating puts you in the top 15% of taskers' },
];

export default function PerformanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('7 Days');
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const periodBtnRef = useRef<View>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111122" />
        </Pressable>
        <Text style={styles.heading}>Performance</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>

        {/* Period filter */}
        <View
          ref={periodBtnRef}
          onLayout={() => {
            periodBtnRef.current?.measureInWindow((x, y, width, height) => {
              setDropPos({ top: y + height + 4, right: 16 });
            });
          }}>
          <Pressable
            style={styles.periodBtn}
            onPress={() => {
              periodBtnRef.current?.measureInWindow((x, y, width, height) => {
                setDropPos({ top: y + height + 4, right: 16 });
                setShowPeriodDrop(true);
              });
            }}>
            <Text style={styles.periodBtnText}>{period}</Text>
            <MaterialCommunityIcons
              name={showPeriodDrop ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>

        {/* Earnings Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>Monthly earnings</Text>
          <Text style={styles.chartAmount}>₦230,000</Text>

          <View style={styles.barChartArea}>
            {/* Y labels */}
            <View style={styles.yLabels}>
              {['100K', '80K', '60K', '40K', '20K', '0'].map((l) => (
                <Text key={l} style={styles.yLabel}>{l}</Text>
              ))}
            </View>

            {/* Bars */}
            <View style={styles.barsWrap}>
              {BAR_DATA.map((bar) => (
                <View key={bar.month} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: MAX_BAR_H * bar.pct }]} />
                  </View>
                  <Text style={styles.barLabel}>{bar.month}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Insights</Text>
          {INSIGHTS.map((insight, i) => (
            <View key={i} style={styles.insightRow}>
              <MaterialCommunityIcons name={insight.icon as any} size={18} color={insight.color} />
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>

        {/* View reviews */}
        <Pressable style={styles.reviewsRow}>
          <MaterialCommunityIcons name="star-outline" size={18} color="#e07b00" />
          <Text style={styles.reviewsText}>View reviews</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
        </Pressable>

      </ScrollView>

      {/* Period Dropdown */}
      <Modal
        visible={showPeriodDrop}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodDrop(false)}>
        <Pressable style={styles.dropBackdrop} onPress={() => setShowPeriodDrop(false)} />
        <View style={[styles.dropdown, { top: dropPos.top, right: dropPos.right }]}>
          {PERIOD_OPTIONS.map((opt, idx) => (
            <Pressable
              key={opt}
              style={[
                styles.dropItem,
                idx < PERIOD_OPTIONS.length - 1 && styles.dropItemBorder,
              ]}
              onPress={() => { setPeriod(opt); setShowPeriodDrop(false); }}>
              <Text style={[styles.dropItemText, period === opt && styles.dropItemTextActive]}>
                {opt}
              </Text>
              {period === opt && (
                <MaterialCommunityIcons name="check" size={16} color={COLORS.brand} />
              )}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    letterSpacing: -0.41,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  periodBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  chartLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chartAmount: {
    fontFamily: 'Geist_700Bold',
    fontSize: 26,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  barChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  yLabels: {
    gap: 9,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  yLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  barsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    height: MAX_BAR_H + 24,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: MAX_BAR_H,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
    backgroundColor: '#c4b0ff',
    width: '100%',
  },
  barLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  insightsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  insightsTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  reviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  reviewsText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  // Inline Dropdown
  dropBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  dropItemText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  dropItemTextActive: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.brand,
  },
});
