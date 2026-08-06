import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTaskerBids, useTaskerTasks, useTaskerTransactions } from '@/lib/api/queries';
import { formatNaira } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';



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

const PERIOD_DAYS: Record<Period, number> = {
  '7 Days': 7,
  '30 days': 30,
  '3 Months': 90,
  '6 Months': 180,
  '1 year': 365,
};

const MAX_BAR_H = 100;

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Earnings buckets derived from the tasker's own transaction list.
 *
 * There is **no analytics endpoint** — no aggregate, no per-period totals — so
 * everything on this screen is computed from `GET /api/wallet/tasker/transactions`
 * and `GET /api/tasks/tasker/tasks`. That has one consequence worth keeping in
 * mind: those lists are paged, so a very long history is truncated to what was
 * fetched. Short windows are exact; the 1-year view can undercount.
 */
function bucketEarnings(
  transactions: { amount: number; type: string; status: string; createdAt: string }[],
  period: Period,
  now: Date,
): { label: string; value: number }[] {
  const days = PERIOD_DAYS[period];
  const byDay = days <= 30;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const credits = transactions.filter(
    (t) => t.type === 'credit' && t.status === 'success' && new Date(t.createdAt) >= cutoff,
  );

  const buckets = new Map<string, { label: string; value: number; order: number }>();

  if (byDay) {
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      buckets.set(key, { label: String(d.getDate()), value: 0, order: -i });
    }
  } else {
    const months = Math.round(days / 30);
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, { label: MONTH_LABELS[d.getMonth()], value: 0, order: -i });
    }
  }

  for (const tx of credits) {
    const d = new Date(tx.createdAt);
    const key = byDay
      ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      : `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.value += tx.amount;
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .map(({ label, value }) => ({ label, value }));
}

function compactNaira(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(Math.round(value));
}

export default function PerformanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('30 days');
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const periodBtnRef = useRef<View>(null);

  const { user } = useAuth();
  const transactionsQ = useTaskerTransactions();
  const tasksQ = useTaskerTasks();
  const bidsQ = useTaskerBids();

  const transactions = transactionsQ.data?.transactions ?? [];
  const tasks = tasksQ.data?.tasks ?? [];
  const bids = bidsQ.data?.bids ?? [];

  const bars = bucketEarnings(transactions, period, new Date());
  const periodTotal = bars.reduce((sum, b) => sum + b.value, 0);
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const cancelled = tasks.filter((t) => t.status === 'cancelled').length;
  const finished = completed + cancelled;

  const acceptedBids = bids.filter((b) => b.status === 'accepted').length;

  // Only the metrics the data can actually support. Response time, profile
  // views, repeat customers and invitation rate were on this screen as fixed
  // strings; nothing in the backend records them, so they are gone rather than
  // shown as invented numbers.
  const stats = [
    {
      label: 'Jobs completed',
      value: String(completed),
      icon: 'briefcase-outline',
      iconColor: COLORS.brand,
      bg: COLORS.brandSubtle,
    },
    {
      label: 'Completion rate',
      value: finished > 0 ? `${Math.round((completed / finished) * 100)}%` : '—',
      icon: 'trending-up',
      iconColor: COLORS.brand,
      bg: COLORS.brandSubtle,
    },
    {
      label: 'Bids won',
      value: bids.length > 0 ? `${Math.round((acceptedBids / bids.length) * 100)}%` : '—',
      icon: 'check-circle-outline',
      iconColor: COLORS.successText,
      bg: COLORS.successBg,
    },
    {
      label: 'Average rating',
      value: user?.averageRating ? `${user.averageRating.toFixed(1)}/5` : '—',
      icon: 'star-outline',
      iconColor: '#e07b00',
      bg: '#fff4e5',
    },
  ];

  const loading = transactionsQ.isLoading || tasksQ.isLoading || bidsQ.isLoading;

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
          <Text style={styles.chartLabel}>Earnings · {period}</Text>
          <Text style={styles.chartAmount}>{formatNaira(periodTotal)}</Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 40 }} color={COLORS.brand} />
          ) : (
            <View style={styles.barChartArea}>
              {/* Y labels — scaled to the tallest bar in the window */}
              <View style={styles.yLabels}>
                {[1, 0.8, 0.6, 0.4, 0.2, 0].map((f) => (
                  <Text key={f} style={styles.yLabel}>
                    {compactNaira(maxBar * f)}
                  </Text>
                ))}
              </View>

              {/* Bars */}
              <View style={styles.barsWrap}>
                {bars.map((bar, i) => (
                  <View key={`${bar.label}-${i}`} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: MAX_BAR_H * (bar.value / maxBar) }]} />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* View reviews */}
        <Pressable style={styles.reviewsRow} onPress={() => router.push('/my-reviews')}>
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
