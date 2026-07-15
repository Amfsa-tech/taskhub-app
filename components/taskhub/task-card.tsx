import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import BadgeGraduation from '@/assets/icons/badge-graduation.svg';
import BadgeHouse from '@/assets/icons/badge-house.svg';
import BadgePackage from '@/assets/icons/badge-package.svg';
import CaretRight from '@/assets/icons/caret-right-muted.svg';
import Clock from '@/assets/icons/clock.svg';
import Lightning from '@/assets/icons/lightning.svg';
import MapPin from '@/assets/icons/map-pin.svg';

const COLORS = {
  surface: '#ffffff',
  sunken: '#f2f2f7',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  bids: '#aa7fff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  success: '#15803d',
  successLight: '#f0fdf4',
  warning: '#b45309',
  warningLight: '#fffbea',
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

export type InProgressTask = {
  id: string;
  status: 'awaiting_payment' | 'in_progress';
  price: string;
  title: string;
  location: string;
  date: string;
};

export type CompletedTask = {
  id: string;
  completedAt: string;
  price: string;
  title: string;
  tasker: {
    name: string;
    avatar: string;
    rating: number;
    jobs: number;
  };
  reviewStatus: 'none' | 'reviewed';
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

export const SAMPLE_IN_PROGRESS_TASKS: InProgressTask[] = [
  {
    id: '1',
    status: 'awaiting_payment',
    price: '₦20,000',
    title: 'Fix my Laptop Screen',
    location: 'UI Main gate',
    date: '18 May',
  },
  {
    id: '2',
    status: 'in_progress',
    price: '₦1,000',
    title: 'Print My Assignment',
    location: 'UI Main gate',
    date: '18 May',
  },
];

export const SAMPLE_COMPLETED_TASKS: CompletedTask[] = [
  {
    id: '1',
    completedAt: 'May 10, 2026',
    price: '₦1,000',
    title: 'Print My Assignment',
    tasker: {
      name: 'Chioma. A',
      avatar: 'https://i.pravatar.cc/150?img=47',
      rating: 4.9,
      jobs: 127,
    },
    reviewStatus: 'none',
  },
  {
    id: '2',
    completedAt: 'May 10, 2026',
    price: '₦20,000',
    title: 'Fix my Laptop Screen',
    tasker: {
      name: 'Chioma. A',
      avatar: 'https://i.pravatar.cc/150?img=47',
      rating: 4.9,
      jobs: 127,
    },
    reviewStatus: 'reviewed',
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

export function InProgressTaskCard({ task, onPress }: { task: InProgressTask; onPress?: () => void }) {
  const isAwaiting = task.status === 'awaiting_payment';
  
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: isAwaiting ? COLORS.warningLight : '#eff6ff' }]}>
          <Text style={[styles.badgeText, { color: isAwaiting ? COLORS.warning : '#1d4ed8' }]}>
            {isAwaiting ? 'Awaiting Payment Release' : 'In Progress'}
          </Text>
        </View>
        <Text style={styles.price}>{task.price}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.title}>{task.title}</Text>
      </View>

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
        <View style={styles.trackAction}>
          <Text style={styles.trackText}>Track</Text>
          <Text style={{color: COLORS.brand, fontSize: 16, marginTop: -2}}>{'>'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function CompletedTaskCard({
  task,
  onPress,
  onHireAgain,
  onLeaveReview,
  onReceipt,
}: {
  task: CompletedTask;
  onPress?: () => void;
  onHireAgain?: () => void;
  onLeaveReview?: () => void;
  onReceipt?: () => void;
}) {
  // Show only the stats we actually have — never a misleading "0 Jobs".
  // The task list endpoint doesn't return the tasker's job count, so it
  // arrives as 0 from `taskToCompletedCard`.
  const stats = [
    task.tasker.rating > 0 ? String(task.tasker.rating) : null,
    task.tasker.jobs > 0 ? `${task.tasker.jobs} Jobs` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: COLORS.successLight }]}>
          <Text style={[styles.badgeText, { color: COLORS.success }]}>Completed · {task.completedAt}</Text>
        </View>
        <Text style={styles.price}>{task.price}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.title}>{task.title}</Text>
      </View>

      {/* Tasker Info */}
      <View style={styles.taskerBlock}>
        <Image source={{ uri: task.tasker.avatar }} style={styles.avatar} />
        <View style={styles.taskerInfo}>
          <Text style={styles.taskerName}>{task.tasker.name}</Text>
          {stats ? (
            <View style={styles.taskerStats}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.statsText}>{stats}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {task.reviewStatus === 'none' ? (
          <Pressable style={[styles.btn, styles.btnReview]} onPress={onLeaveReview}>
            <Text style={[styles.btnText, { color: '#ffffff' }]}>Leave review</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.btnReviewed]} onPress={onLeaveReview}>
            <Text style={[styles.btnText, { color: COLORS.success }]}>Reviewed</Text>
          </Pressable>
        )}
        <Pressable style={[styles.btn, styles.btnHireAgain]} onPress={onHireAgain}>
          <Text style={[styles.btnText, { color: COLORS.brand }]}>Hire Again</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnReceipt]} onPress={onReceipt}>
          <Text style={[styles.btnText, { color: COLORS.textPrimary }]}>Receipt</Text>
        </Pressable>
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
  trackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.brand,
  },
  taskerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.sunken,
    padding: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e5e5',
  },
  taskerInfo: {
    gap: 2,
  },
  taskerName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  taskerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 12,
  },
  statsText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
  },
  btnReview: {
    backgroundColor: COLORS.brand,
  },
  btnReviewed: {
    backgroundColor: COLORS.successLight,
  },
  btnHireAgain: {
    backgroundColor: COLORS.brandLight,
  },
  btnReceipt: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
});
