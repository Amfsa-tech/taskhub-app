import { Pressable, StyleSheet, Text, View } from 'react-native';

import BadgeGraduation from '@/assets/icons/badge-graduation.svg';
import BadgeHouse from '@/assets/icons/badge-house.svg';
import BadgePackage from '@/assets/icons/badge-package.svg';
import CaretRight from '@/assets/icons/caret-right-muted.svg';
import Clock from '@/assets/icons/clock.svg';
import Lightning from '@/assets/icons/lightning.svg';
import MapPin from '@/assets/icons/map-pin.svg';

const COLORS = {
  surface: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  bids: '#aa7fff',
};

export type BadgeKind = 'campus' | 'urgent' | 'local' | 'errand';

const BADGES: Record<
  BadgeKind,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  campus: { label: 'Campus', bg: '#f3eeff', text: '#4621c0', icon: <BadgeGraduation width={16} height={16} /> },
  urgent: { label: 'Urgent', bg: '#fff1f1', text: '#b01515', icon: <Lightning width={16} height={16} /> },
  local: { label: 'Local', bg: '#eff6ff', text: '#1d4ed8', icon: <BadgeHouse width={16} height={16} /> },
  errand: { label: 'Errand', bg: '#fffbea', text: '#b45309', icon: <BadgePackage width={16} height={16} /> },
};

export type Task = {
  badges: BadgeKind[];
  price: string;
  title: string;
  bids: string;
  location: string;
  date: string;
};

export const SAMPLE_TASKS: Task[] = [
  {
    badges: ['campus', 'urgent'],
    price: '₦1,000',
    title: 'Print My Assignment',
    bids: '3 Bids',
    location: 'UI Main gate',
    date: '18 May',
  },
  {
    badges: ['local'],
    price: '₦20,000',
    title: 'Fix my Laptop Screen',
    bids: '2 Bids',
    location: 'UI Main gate',
    date: '18 May',
  },
  {
    badges: ['errand'],
    price: '₦2,000',
    title: 'Deliver Package to Lekki',
    bids: '5 Bids',
    location: 'Ikorodu',
    date: '18 May',
  },
];

function Badge({ kind }: { kind: BadgeKind }) {
  const b = BADGES[kind];
  return (
    <View style={[styles.badge, { backgroundColor: b.bg }]}>
      {b.icon}
      <Text style={[styles.badgeText, { color: b.text }]}>{b.label}</Text>
    </View>
  );
}

export function TaskCard({ task, onPress }: { task: Task; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Badges + price */}
      <View style={styles.row}>
        <View style={styles.badges}>
          {task.badges.map((kind) => (
            <Badge key={kind} kind={kind} />
          ))}
        </View>
        <Text style={styles.price}>{task.price}</Text>
      </View>

      {/* Title + bids */}
      <View style={styles.row}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.bids}>{task.bids}</Text>
      </View>

      {/* Location + date + chevron */}
      <View style={styles.row}>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MapPin width={16} height={16} />
            <Text style={styles.metaText}>{task.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock width={16} height={16} />
            <Text style={styles.metaText}>{task.date}</Text>
          </View>
        </View>
        <CaretRight width={8} height={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  price: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  title: {
    flex: 1,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  bids: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    letterSpacing: -0.32,
    color: COLORS.bids,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
  },
});
