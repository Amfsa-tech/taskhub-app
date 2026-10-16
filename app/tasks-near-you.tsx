import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Clock from '@/assets/icons/clock.svg';
import MapPin from '@/assets/icons/map-pin.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTaskerFeed } from '@/lib/api/queries';
import { formatNaira, formatRelativeTime, locationLabel, type TaskerFeedTask } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  error: '#dc2626',
};

function NearbyTaskCard({ task, onPress }: { task: TaskerFeedTask; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {task.applicationInfo?.applicationMode === 'bidding' ? 'Bidding' : 'Fixed'}
          </Text>
        </View>
        <Text style={styles.price}>{formatNaira(task.budget)}</Text>
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin width={14} height={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{locationLabel(task)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock width={14} height={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatRelativeTime(task.createdAt)}</Text>
        </View>
      </View>
      {task.taskerBidInfo?.hasBid ? <Text style={styles.applied}>Applied</Text> : null}
    </Pressable>
  );
}

export default function TasksNearYouScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountType } = useAuth();
  const feed = useTaskerFeed(accountType === 'tasker');
  const tasks = (feed.data?.pages ?? []).flatMap((page) => page?.tasks ?? []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Available tasks" />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => feed.refetch()}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <Text style={styles.intro}>
            Open tasks matched to your services, regardless of location.
          </Text>
        }
        ListEmptyComponent={
          accountType !== 'tasker' ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Tasker account required</Text>
              <Text style={styles.stateCopy}>Switch to your linked tasker account to browse nearby work.</Text>
            </View>
          ) : feed.isLoading ? (
            <View style={styles.state}><ActivityIndicator color={COLORS.brand} /></View>
          ) : feed.isError ? (
            <View style={styles.state}>
              <Text style={styles.errorText}>Could not load available tasks.</Text>
              <Pressable hitSlop={8} onPress={() => feed.refetch()}><Text style={styles.retry}>Retry</Text></Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>No matching tasks yet</Text>
              <Text style={styles.stateCopy}>No open tasks match your services yet. Tasks from any location can appear here.</Text>
              <Pressable style={styles.servicesButton} onPress={() => router.push('/tasker-services')}>
                <Text style={styles.servicesLabel}>Update my services</Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={COLORS.brand} /> : null}
        renderItem={({ item }) => (
          <NearbyTaskCard
            task={item}
            onPress={() => router.push({ pathname: '/task-details', params: { id: item._id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12, flexGrow: 1 },
  intro: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 21, color: COLORS.textSecondary, paddingBottom: 4 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modeBadge: { backgroundColor: COLORS.brandSubtle, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  modeText: { fontFamily: 'Geist_600SemiBold', fontSize: 12, color: COLORS.brand },
  price: { fontFamily: 'Geist_700Bold', fontSize: 17, color: COLORS.textPrimary },
  taskTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 17, lineHeight: 22, color: COLORS.textPrimary },
  metaRow: { gap: 7 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flexShrink: 1, fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.textSecondary },
  applied: { alignSelf: 'flex-start', fontFamily: 'Geist_600SemiBold', fontSize: 13, color: COLORS.brand },
  state: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  stateTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 18, color: COLORS.textPrimary, textAlign: 'center' },
  stateCopy: { fontFamily: 'Geist_400Regular', fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center' },
  errorText: { fontFamily: 'Geist_500Medium', fontSize: 15, color: COLORS.error },
  retry: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.brand },
  servicesButton: { minHeight: 46, marginTop: 6, paddingHorizontal: 18, borderRadius: 12, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  servicesLabel: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.surface },
  footerLoader: { paddingVertical: 20 },
  pressed: { opacity: 0.9 },
});
