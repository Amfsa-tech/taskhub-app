import { PrimaryButton } from '@/components/taskhub/primary-button';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import { queryKeys, useCompletionCode, useTask } from '@/lib/api/queries';
import {
  changeTaskStatus,
  completeTaskerTask,
  formatNaira,
  startTaskerTask,
  rateTask,
  type Task,
  type TaskStatus,
} from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const PopperImage = require('@/assets/images/party_popper_3d.png');
const AVATAR = require('@/assets/images/taskers/tasker-1.png');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e0e0ea',
  successBg: '#edfaf3',
  successText: '#0d6639',
  dangerText: '#b01515',
};

type TimelineItem = {
  title: string;
  time?: string;
  status: 'checked' | 'active' | 'future';
};

/** Order the backend actually moves a task through. */
const STATUS_ORDER: TaskStatus[] = ['open', 'assigned', 'in-progress', 'completed'];

function clockTime(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${minutes}${suffix}`;
}

/**
 * Build the timeline from the task itself.
 *
 * The backend stores no per-step history — only `status` plus `createdAt` /
 * `completedAt` / `updatedAt` — so intermediate steps are shown as reached or
 * not, and only the stamps that genuinely exist carry a time. The design's
 * "Tasker On the Way" step has no backend equivalent and is dropped rather than
 * invented.
 */
function buildTimeline(task: Task): TimelineItem[] {
  if (task.status === 'cancelled') {
    return [
      { title: 'Task posted', time: clockTime(task.createdAt), status: 'checked' },
      { title: 'Cancelled', time: clockTime(task.updatedAt), status: 'active' },
    ];
  }

  const reached = STATUS_ORDER.indexOf(task.status);
  const mark = (index: number): TimelineItem['status'] =>
    index < reached ? 'checked' : index === reached ? 'active' : 'future';

  return [
    { title: 'Task posted', time: clockTime(task.createdAt), status: mark(0) },
    { title: 'Tasker hired', status: mark(1) },
    {
      title: 'Payment secured',
      status: task.escrowStatus && task.escrowStatus !== 'not_held' ? 'checked' : mark(1),
    },
    { title: 'In progress', status: mark(2) },
    {
      title: 'Completed',
      time: clockTime(task.completedAt),
      status: mark(3),
    },
  ];
}

function taskerDisplayName(task: Task): string {
  const t = task.assignedTasker;
  if (!t) return 'Tasker';
  const first = t.firstName?.trim() ?? '';
  const lastInitial = t.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

export default function TrackTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accountType } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const taskQ = useTask(id);
  const task = taskQ.data?.task;

  const [rateModalVisible, setRateModalVisible] = useState(false);

  const isTasker = accountType === 'tasker';

  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [taskerCode, setTaskerCode] = useState('');

  /*
   * Tasker-side state is *derived* from the task, never held locally. A task
   * only reaches a tasker once it is `assigned`, and assignment is the same
   * atomic call that funds escrow — so escrow is secured for every task they
   * can see here. There is no "waiting for the customer to fund" state in the
   * backend, and the old local `escrowStatus` invented one.
   */
  const escrowStatus: 'pending' | 'secured' =
    task?.escrowStatus === 'held' || task?.status === 'completed' ? 'secured' : 'pending';

  const taskStatusStep: 'start_task' | 'started' | 'completed' =
    task?.status === 'completed' ? 'completed' : task?.status === 'in-progress' ? 'started' : 'start_task';

  /**
   * The completion code exists only while the task is in progress, and only the
   * poster can read it. Handing it to the tasker is what completes the task —
   * the tasker submits it, and that release is what moves escrow.
   */
  const codeQ = useCompletionCode(id, !isTasker && task?.status === 'in-progress');

  const refreshTask = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
    ]);

  const startWork = useMutation({
    mutationFn: () => startTaskerTask(id as string),
    onSuccess: async () => {
      await refreshTask();
      setStatusSheetVisible(false);
      Alert.alert(
        'Task started',
        'The customer now has a 6-digit completion code. Ask them for it when the work is done — entering it releases your payment.',
      );
    },
    onError: (err) =>
      Alert.alert('Could not start', err instanceof Error ? err.message : 'Please try again.'),
  });

  const completeWork = useMutation({
    mutationFn: () => completeTaskerTask(id as string, taskerCode),
    onSuccess: async () => {
      await refreshTask();
      setStatusSheetVisible(false);
      setTaskerCode('');
      Alert.alert('Task completed', 'Payment has been released from escrow to your wallet.');
    },
    // A wrong code is a 400 with a specific message — surface it as-is.
    onError: (err) =>
      Alert.alert('Could not complete', err instanceof Error ? err.message : 'Please try again.'),
  });

  const cancel = useMutation({
    mutationFn: () => changeTaskStatus(id as string, 'cancelled'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      Alert.alert('Task cancelled', 'Any funds held in escrow have been returned to your wallet.');
    },
    onError: (err) =>
      Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Please try again.'),
  });

  const rate = useMutation({
    mutationFn: (v: { rating: number; reviewText: string }) =>
      rateTask(id as string, { rating: v.rating, reviewText: v.reviewText || undefined }),
    onSuccess: async () => {
      setRateModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.task(id as string) });
    },
    onError: (err) =>
      Alert.alert('Could not submit review', err instanceof Error ? err.message : 'Please try again.'),
  });

  const confirmCancel = () =>
    Alert.alert('Cancel task', 'This releases the tasker and refunds any escrow. Continue?', [
      { text: 'Keep task', style: 'cancel' },
      { text: 'Cancel task', style: 'destructive', onPress: () => cancel.mutate() },
    ]);

  // ---- Loading / error / missing id ----
  if (!id || taskQ.isLoading || taskQ.isError || !task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Track Task</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.fullscreenCenter}>
          {taskQ.isLoading ? (
            <ActivityIndicator color={COLORS.brand} />
          ) : (
            <>
              <Text style={styles.completedSubtitle}>
                {id ? 'Couldn’t load this task.' : 'No task was selected.'}
              </Text>
              {id ? (
                <Pressable hitSlop={8} onPress={() => taskQ.refetch()}>
                  <Text style={styles.myTasksLabel}>Retry</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  const timeline = buildTimeline(task);
  const taskerName = taskerDisplayName(task);
  const escrowHeld = Boolean(task.escrowStatus && task.escrowStatus !== 'not_held');
  const canCancel = ['open', 'assigned', 'in-progress'].includes(task.status);

  // ---- Terminal state: completed ----
  if (task.status === 'completed') {
    const alreadyRated = task.rating != null;
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <Image source={PopperImage} style={styles.popperImage} contentFit="contain" />
        <Text style={styles.completedTitle}>Task Completed</Text>
        <Text style={styles.completedSubtitle}>
          {formatNaira(task.budget)} has been released to {taskerName}.
        </Text>
        <View style={styles.completedButtons}>
          {!alreadyRated && (
            <PrimaryButton label={`Rate ${taskerName}`} onPress={() => setRateModalVisible(true)} />
          )}
          <PrimaryButton
            label="Go to Dashboard"
            variant={!alreadyRated ? 'secondary' : 'primary'}
            onPress={() => router.replace('/home')}
          />
          <Pressable
            style={({ pressed }) => [styles.myTasksButton, pressed && styles.pressed]}
            onPress={() => router.replace('/tasks')}>
            <Text style={styles.myTasksLabel}>Go To my Tasks</Text>
          </Pressable>
        </View>

        <RateTaskerModal
          visible={rateModalVisible}
          onClose={() => setRateModalVisible(false)}
          taskerName={taskerName}
          taskerAvatar={task.assignedTasker?.profilePicture || ''}
          onSubmit={(rating, comment) => rate.mutate({ rating, reviewText: comment })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Track Task</Text>
        <Pressable hitSlop={8} style={styles.backButton}>
          <Ionicons name="headset-outline" size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Tasker Card — only once someone is actually assigned. */}
        {task.assignedTasker ? (
          <View style={styles.card}>
            <View style={styles.taskerRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={
                    task.assignedTasker.profilePicture
                      ? { uri: task.assignedTasker.profilePicture }
                      : AVATAR
                  }
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>
              <View style={styles.taskerInfo}>
                <Text style={styles.taskerName}>{taskerName}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>{task.title}</Text>
                </View>
              </View>
              {/* Call is intentionally absent: the backend exposes no phone
                  number for an assigned tasker, and chat is the supported channel. */}
              <View style={styles.actionsWrap}>
                <Pressable style={styles.actionIconBtn} onPress={() => router.push('/messages')}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.brand} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.taskerRow}>
              <View style={styles.taskerInfo}>
                <Text style={styles.taskerName}>{task.title}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>No tasker assigned yet</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment Secured Banner / Escrow Status Banner */}
        {isTasker ? (
          escrowStatus === 'pending' ? (
            <View style={[styles.securedBanner, styles.pendingBanner]}>
              <View style={[styles.walletIconWrap, styles.pendingWalletIconWrap]}>
                <Ionicons name="wallet-outline" size={20} color="#b45309" />
              </View>
              <View style={styles.securedInfo}>
                <Text style={[styles.securedTitle, { color: '#b45309' }]}>Escrow not held</Text>
                <Text style={[styles.securedSubtitle, { color: '#b45309' }]}>
                  {formatNaira(task.budget)} — payment is not secured yet
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.securedBanner}>
              <View style={styles.walletIconWrap}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.successText} />
              </View>
              <View style={styles.securedInfo}>
                <Text style={styles.securedTitle}>Payment Secured</Text>
                <Text style={styles.securedSubtitle}>
                  {formatNaira(task.budget)} held in escrow
                </Text>
              </View>
            </View>
          )
        ) : escrowHeld ? (
          <View style={styles.securedBanner}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.successText} />
            </View>
            <View style={styles.securedInfo}>
              <Text style={styles.securedTitle}>Payment Secured</Text>
              <Text style={styles.securedSubtitle}>
                {formatNaira(task.budget)} held in escrow
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.securedBanner, styles.pendingBanner]}>
            <View style={[styles.walletIconWrap, styles.pendingWalletIconWrap]}>
              <Ionicons name="wallet-outline" size={20} color="#b45309" />
            </View>
            <View style={styles.securedInfo}>
              <Text style={[styles.securedTitle, { color: '#b45309' }]}>No escrow held yet</Text>
              <Text style={[styles.securedSubtitle, { color: '#b45309' }]}>
                Funds are held when you accept a bid
              </Text>
            </View>
          </View>
        )}

        {/* Completion code — the poster's half of the hand-off. */}
        {!isTasker && task.status === 'in-progress' ? (
          <View style={styles.card}>
            <Text style={styles.timelineHeader}>Completion code</Text>
            {codeQ.isLoading ? (
              <ActivityIndicator color={COLORS.brand} />
            ) : codeQ.isError || !codeQ.data?.data?.completionCode ? (
              <Text style={styles.securedSubtitle}>
                The code isn’t available yet. It appears once the tasker starts work.
              </Text>
            ) : (
              <>
                <Text style={styles.completionCode}>{codeQ.data.data.completionCode}</Text>
                <Text style={styles.securedSubtitle}>
                  Give this code to {taskerName} only when the work is done. Entering it releases
                  the payment from escrow.
                </Text>
              </>
            )}
          </View>
        ) : null}

        {/* Task Timeline */}
        <Text style={styles.timelineHeader}>Task Timeline</Text>
        <View style={styles.timelineList}>
          {timeline.map((item, index) => {
            const isChecked = item.status === 'checked';
            const isActive = item.status === 'active';
            const isFuture = item.status === 'future';
            const isLast = index === timeline.length - 1;

            return (
              <View key={item.title} style={styles.timelineRow}>
                <View style={styles.timelineLeftColumn}>
                  <View
                    style={[
                      styles.timelineDot,
                      isChecked && styles.timelineDotChecked,
                      isActive && styles.timelineDotActive,
                      isFuture && styles.timelineDotFuture,
                    ]}>
                    {isChecked && <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />}
                    {isActive && <View style={styles.timelineInnerDot} />}
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineText,
                      isActive && styles.timelineTextActive,
                      isFuture && styles.timelineTextFuture,
                    ]}>
                    {item.title}
                  </Text>
                  {item.time && <Text style={styles.timelineTime}>{item.time}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {isTasker ? (
          <PrimaryButton
            label={
              taskStatusStep === 'completed'
                ? 'Task Completed'
                : taskStatusStep === 'started'
                  ? 'Enter completion code'
                  : 'Start Task'
            }
            onPress={() => {
              if (taskStatusStep !== 'completed') setStatusSheetVisible(true);
            }}
            disabled={taskStatusStep === 'completed'}
            variant={taskStatusStep === 'completed' ? 'secondary' : 'primary'}
          />
        ) : (
          /*
           * The poster cannot mark a task complete: `PATCH /api/tasks/:id/status`
           * only allows them to cancel. Completion is the tasker submitting the
           * code above, which is what releases escrow — so the old "Confirm
           * Completion → Release Payment" button described a flow the backend
           * has never had. Cancel is the real action available here.
           */
          canCancel ? (
            <PrimaryButton
              label={cancel.isPending ? 'Cancelling…' : 'Cancel Task'}
              variant="secondary"
              disabled={cancel.isPending}
              onPress={confirmCancel}
            />
          ) : null
        )}
        <Pressable
          style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/report-issue',
              params: { taskId: task._id, taskTitle: task.title },
            })
          }>
          <Ionicons name="warning-outline" size={18} color={COLORS.dangerText} />
          <Text style={styles.reportLabel}>Report Issue</Text>
        </Pressable>
      </View>

      {/* Update Job Status Bottom Sheet (Tasker Only) */}
      <Modal visible={statusSheetVisible} transparent animationType="slide" onRequestClose={() => setStatusSheetVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStatusSheetVisible(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => { }}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Job Status</Text>

            {/* Job Details Card inside Sheet */}
            <View style={styles.sheetJobCard}>
              <Text style={styles.sheetJobTitle}>Design a flyer for an event</Text>
              <Text style={styles.sheetJobPrice}>₦500,000</Text>
            </View>

            {/* Checklist Items */}
            <View style={styles.checklist}>
              {/* Step 1: Accepted */}
              <View style={styles.checkRow}>
                <View style={[styles.circleCheck, styles.circleCheckActive]}>
                  <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                </View>
                <Text style={styles.checkText}>Accepted</Text>
              </View>

              {/* Step 2: Escrow Funded */}
              <View style={styles.checkRow}>
                <View style={[styles.circleCheck, styles.circleCheckActive]}>
                  <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                </View>
                <Text style={styles.checkText}>Escrow Funded</Text>
              </View>

              {/* Step 3: Start Task / Task Started */}
              <View style={styles.checkRow}>
                {taskStatusStep !== 'start_task' ? (
                  <View style={[styles.circleCheck, styles.circleCheckActive]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                  </View>
                ) : (
                  <View style={[styles.circleSelect, styles.circleSelectActive]}>
                    <View style={styles.circleInnerDot} />
                  </View>
                )}
                <Text style={[styles.checkText, taskStatusStep === 'start_task' && styles.checkTextActive]}>
                  {taskStatusStep !== 'start_task' ? 'Task Started' : 'Start task'}
                </Text>
              </View>

              {/* Step 4: Mark as completed */}
              <View style={styles.checkRow}>
                {taskStatusStep === 'completed' ? (
                  <View style={[styles.circleCheck, styles.circleCheckActive]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#ffffff" />
                  </View>
                ) : taskStatusStep === 'started' ? (
                  <View style={[styles.circleSelect, styles.circleSelectActive]}>
                    <View style={styles.circleInnerDot} />
                  </View>
                ) : (
                  <View style={styles.circleSelectDisabled} />
                )}
                <Text style={[
                  styles.checkText,
                  taskStatusStep === 'completed' && styles.checkTextActive,
                  taskStatusStep === 'start_task' && styles.checkTextDisabled
                ]}>
                  Mark as completed
                </Text>
              </View>
            </View>

            {/* Bottom Button in Sheet */}
            {taskStatusStep === 'start_task' ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: COLORS.brand }]}
                disabled={startWork.isPending}
                onPress={() => startWork.mutate()}>
                {startWork.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.sheetButtonText}>Start Task</Text>
                )}
              </Pressable>
            ) : taskStatusStep === 'started' ? (
              <>
                <Text style={styles.codeHint}>
                  Ask the customer for the 6-digit completion code on their tracking screen.
                  Entering it here releases your payment.
                </Text>
                <TextInput
                  style={styles.codeEntry}
                  value={taskerCode}
                  onChangeText={(t) => setTaskerCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="#9a9ab0"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Pressable
                  style={[
                    styles.sheetButton,
                    { backgroundColor: '#0d6639' },
                    (taskerCode.length !== 6 || completeWork.isPending) && { opacity: 0.5 },
                  ]}
                  disabled={taskerCode.length !== 6 || completeWork.isPending}
                  onPress={() => completeWork.mutate()}>
                  {completeWork.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.sheetButtonText}>Complete & get paid</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639', opacity: 0.6 }]}
                disabled>
                <Text style={styles.sheetButtonText}>Task Completed</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.canvas,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  taskerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sunken,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  taskerInfo: {
    flex: 1,
    gap: 4,
  },
  taskerName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  statsText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bullet: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.successBg,
    borderColor: '#d2f4e1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#d2f4e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securedInfo: {
    flex: 1,
    gap: 2,
  },
  securedTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.successText,
  },
  securedSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.successText,
  },
  completionCode: {
    fontFamily: 'Geist_700Bold',
    fontSize: 34,
    letterSpacing: 6,
    color: COLORS.brand,
    paddingVertical: 8,
  },
  timelineHeader: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotChecked: {
    backgroundColor: COLORS.brand,
  },
  timelineDotActive: {
    borderWidth: 2,
    borderColor: COLORS.brand,
    backgroundColor: '#ffffff',
  },
  timelineInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  timelineDotFuture: {
    backgroundColor: '#c8c8d3',
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -32,
    width: 2,
    backgroundColor: COLORS.brand,
    zIndex: 0,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  timelineText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  timelineTextActive: {
    color: COLORS.brand,
  },
  timelineTextFuture: {
    fontFamily: 'Geist_500Medium',
    color: COLORS.textSecondary,
  },
  timelineTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  reportButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reportLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.dangerText,
  },
  pressed: {
    opacity: 0.9,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalButtons: {
    width: '100%',
    gap: 8,
  },
  notYetButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notYetLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
  // Fullscreen Center layout for completed
  fullscreenCenter: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  popperImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  completedTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  completedButtons: {
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
  myTasksButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myTasksLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
  // Tasker Banner, Modal & Bottom Sheet styles
  pendingBanner: {
    backgroundColor: '#fffbea',
    borderColor: '#ffeeb2',
  },
  pendingWalletIconWrap: {
    backgroundColor: '#ffeeb2',
  },
  reminderModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reminderIconOuter: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f3eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  reminderTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  reminderSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
    gap: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0ea',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  sheetJobCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  sheetJobTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  sheetJobPrice: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  checklist: {
    gap: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  checkTextActive: {
    color: COLORS.brand,
    fontFamily: 'Geist_600SemiBold',
  },
  checkTextDisabled: {
    color: '#a0a0ba',
  },
  circleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCheckActive: {
    backgroundColor: COLORS.brand,
  },
  circleSelect: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelectActive: {
    borderColor: COLORS.brand,
    backgroundColor: '#ffffff',
  },
  circleInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  circleSelectDisabled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0ea',
  },
  sheetButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: '#ffffff',
  },
  codeHint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#5a5a70',
    marginTop: 4,
    marginBottom: 12,
  },
  codeEntry: {
    borderWidth: 1,
    borderColor: '#e0e0ea',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontFamily: 'Geist_700Bold',
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
    color: '#111122',
  },
  shield3d: {
    width: 80,
    height: 80,
  },
});
