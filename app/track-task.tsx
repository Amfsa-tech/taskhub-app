import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/taskhub/primary-button';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
          <PrimaryButton label="Go to Dashboard" onPress={() => router.replace('/home')} />
          <Pressable
            style={({ pressed }) => [styles.myTasksButton, pressed && styles.pressed]}
            onPress={() => router.replace('/tasks')}>
            <Text style={styles.myTasksLabel}>Go To my Tasks</Text>
          </Pressable>
        </View>
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

        {/* Payment Secured Banner */}
        <View style={styles.securedBanner}>
          <View style={styles.walletIconWrap}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.successText} />
          </View>
          <View style={styles.securedInfo}>
            <Text style={styles.securedTitle}>Payment Secured</Text>
            <Text style={styles.securedSubtitle}>₦4,000 held in escrow</Text>
          </View>
        </View>

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
        <PrimaryButton label="Confirm Completion" onPress={() => setModalVisible(true)} />
        <Pressable
          style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
          onPress={() => router.push('/report-issue')}>
          <Ionicons name="warning-outline" size={18} color={COLORS.dangerText} />
          <Text style={styles.reportLabel}>Report Issue</Text>
        </Pressable>
      </View>

      {/* Confirm Completion Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
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
});
