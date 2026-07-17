import { PrimaryButton } from '@/components/taskhub/primary-button';
import { RateTaskerModal } from '@/components/taskhub/rate-tasker-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const PopperImage = require('@/assets/images/party_popper_3d.png');
const AVATAR = require('@/assets/images/taskers/tasker-1.png');
const SHIELD_IMAGE = require('@/assets/images/3d-shield.png');

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

const TIMELINE: TimelineItem[] = [
  { title: 'Task posted', time: '2:00PM', status: 'checked' },
  { title: 'Tasker Hired', time: '2:15PM', status: 'checked' },
  { title: 'Payment Secured', time: '2:16', status: 'checked' },
  { title: 'Tasker On the Way', time: '2:16', status: 'checked' },
  { title: 'In Progress', time: '2:16', status: 'checked' },
  { title: 'Awaiting confirmation', status: 'active' },
  { title: 'Completed', status: 'future' },
];

export default function TrackTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountType } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const isTasker = accountType === 'tasker';
  const [escrowStatus, setEscrowStatus] = useState<'pending' | 'secured'>('pending');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [taskStatusStep, setTaskStatusStep] = useState<'start_task' | 'started' | 'completed'>('start_task');

  const handleReleaseAndComplete = () => {
    setModalVisible(false);
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <Image source={PopperImage} style={styles.popperImage} contentFit="contain" />
        <Text style={styles.completedTitle}>Payment Released</Text>
        <Text style={styles.completedSubtitle}>
          ₦4,400 is held safely in escrow until the task is completed
        </Text>
        <View style={styles.completedButtons}>
          {!hasReviewed && (
            <PrimaryButton label="Rate Chioma. A" onPress={() => setRateModalVisible(true)} />
          )}
          <PrimaryButton
            label="Go to Dashboard"
            variant={!hasReviewed ? "secondary" : "primary"}
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
          taskerName="Chioma. A"
          taskerAvatar="https://i.pravatar.cc/150?img=47"
          onSubmit={(rating, comment) => {
            setHasReviewed(true);
            setRateModalVisible(false);
          }}
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

        {/* Tasker Card */}
        <View style={styles.card}>
          <View style={styles.taskerRow}>
            <View style={styles.avatarWrap}>
              <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
            </View>
            <View style={styles.taskerInfo}>
              <Text style={styles.taskerName}>Chioma. A</Text>
              <View style={styles.statsRow}>
                <Ionicons name="star" size={14} color="#fbbf24" style={styles.starIcon} />
                <Text style={styles.statsText}>4.9</Text>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.statsText}>Printing</Text>
              </View>
            </View>
            <View style={styles.actionsWrap}>
              <Pressable style={styles.actionIconBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.brand} />
              </Pressable>
              <Pressable style={styles.actionIconBtn}>
                <Ionicons name="call-outline" size={20} color={COLORS.brand} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Payment Secured Banner / Escrow Status Banner */}
        {isTasker ? (
          escrowStatus === 'pending' ? (
            <View style={[styles.securedBanner, styles.pendingBanner]}>
              <View style={[styles.walletIconWrap, styles.pendingWalletIconWrap]}>
                <Ionicons name="wallet-outline" size={20} color="#b45309" />
              </View>
              <View style={styles.securedInfo}>
                <Text style={[styles.securedTitle, { color: '#b45309' }]}>Waiting for customer to fund escrow</Text>
                <Text style={[styles.securedSubtitle, { color: '#b45309' }]}>₦500,000 Pending payment</Text>
              </View>
            </View>
          ) : (
            <View style={styles.securedBanner}>
              <View style={styles.walletIconWrap}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.successText} />
              </View>
              <View style={styles.securedInfo}>
                <Text style={styles.securedTitle}>Payment Secured</Text>
                <Text style={styles.securedSubtitle}>₦500,000 held in escrow</Text>
              </View>
            </View>
          )
        ) : (
          <View style={styles.securedBanner}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.successText} />
            </View>
            <View style={styles.securedInfo}>
              <Text style={styles.securedTitle}>Payment Secured</Text>
              <Text style={styles.securedSubtitle}>₦4,000 held in escrow</Text>
            </View>
          </View>
        )}

        {/* Task Timeline */}
        <Text style={styles.timelineHeader}>Task Timeline</Text>
        <View style={styles.timelineList}>
          {TIMELINE.map((item, index) => {
            const isChecked = item.status === 'checked';
            const isActive = item.status === 'active';
            const isFuture = item.status === 'future';
            const isLast = index === TIMELINE.length - 1;

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
          escrowStatus === 'pending' ? (
            <PrimaryButton
              label="Nudge Customer"
              onPress={() => {
                setReminderModalVisible(true);
                // Auto-advance to funded (secured) status after reminder is closed
                setTimeout(() => {
                  setReminderModalVisible(false);
                  setEscrowStatus('secured');
                }, 2500);
              }}
            />
          ) : (
            <PrimaryButton
              label={taskStatusStep === 'completed' ? "Task Completed" : "Update Status"}
              onPress={() => {
                if (taskStatusStep !== 'completed') {
                  setStatusSheetVisible(true);
                }
              }}
              disabled={taskStatusStep === 'completed'}
              variant={taskStatusStep === 'completed' ? "secondary" : "primary"}
            />
          )
        ) : (
          <PrimaryButton label="Confirm Completion" onPress={() => setModalVisible(true)} />
        )}
        <Pressable
          style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
          onPress={() => router.push('/report-issue')}>
          <Ionicons name="warning-outline" size={18} color={COLORS.dangerText} />
          <Text style={styles.reportLabel}>Report Issue</Text>
        </Pressable>
      </View>

      {/* Confirm Completion Modal (Customer Only) */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { marginBottom: insets.bottom + 16 }]} onPress={() => { }}>
            <Text style={styles.modalTitle}>Confirm Completion</Text>
            <Text style={styles.modalSubtitle}>
              Are you satisfied with the task? Once completed, the payment will be released to Chioma A.
            </Text>
            <View style={styles.modalButtons}>
              <PrimaryButton label="Release Payment & Complete" onPress={handleReleaseAndComplete} />
              <Pressable style={styles.notYetButton} hitSlop={8} onPress={() => setModalVisible(false)}>
                <Text style={styles.notYetLabel}>Not Yet</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reminder Sent Modal (Tasker Only) */}
      <Modal visible={reminderModalVisible} transparent animationType="fade" onRequestClose={() => setReminderModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setReminderModalVisible(false)}>
          <View style={styles.reminderModalBox}>
            <View style={{ position: 'relative', width: 80, height: 80 }}>
              <Image source={SHIELD_IMAGE} style={styles.shield3d} contentFit="contain" />
              <View style={styles.reminderBadge}>
                <Ionicons name="checkmark-sharp" size={12} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.reminderTitle}>Reminder Sent</Text>
            <Text style={styles.reminderSubtitle}>
              We've notified Aisha M.. You'll receive a notification when they respond.
            </Text>
          </View>
        </Pressable>
      </Modal>

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
                onPress={() => setTaskStatusStep('started')}>
                <Text style={styles.sheetButtonText}>Start Task</Text>
              </Pressable>
            ) : taskStatusStep === 'started' ? (
              <Pressable
                style={[styles.sheetButton, { backgroundColor: '#0d6639' }]}
                onPress={() => {
                  setTaskStatusStep('completed');
                  setStatusSheetVisible(false);
                  Alert.alert('Job Completed!', 'Excellent work! The customer has been notified to release payment.');
                }}>
                <Text style={styles.sheetButtonText}>Task Started</Text>
              </Pressable>
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
  shield3d: {
    width: 80,
    height: 80,
  },
});
