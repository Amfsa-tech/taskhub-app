import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Flag from '@/assets/icons/flag.svg';
import ImageSquare from '@/assets/icons/image-square.svg';
import PaperPlaneTilt from '@/assets/icons/paper-plane-tilt.svg';
import UserCircle from '@/assets/icons/user-circle.svg';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  sendTile: 'rgba(108,59,255,0.32)',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  onBrandSubtle: '#eaeaf0',
  brandText: '#6c3bff',
  border: '#e0e0ea',
};

type Message = { id: string; from: 'me' | 'them'; text: string; time: string };
type SystemBubble = { id: string; type: 'system'; variant: 'blue' | 'yellow' | 'green'; text: string; time: string };
type ChatItem = Message | SystemBubble;

const INITIAL_MESSAGES: ChatItem[] = [
  { id: '1', from: 'them', text: 'Hi! I can handle your printing task.', time: '2:30PM' },
  { id: '2', from: 'me', text: ' Great! How quickly can you do it?', time: '2:30PM' },
  { id: '3', from: 'them', text: "Within 30 minutes. I'm near Zik Hall right now.", time: '2:30PM' },
  { id: '4', from: 'me', text: "Perfect! It's 15 pages, black and white.", time: '2:30PM' },
  { id: '5', from: 'them', text: "No problem. I'll head to the printing shop now.", time: '2:30PM' },
];

const HIRE_QUICK_REPLIES = ["What's your rate?", 'How Long?', 'Thanks!'];
const QUICK_REPLIES = ['On my way!', 'How Long?', 'Thanks!', 'You are welcome'];

type HireStage = 'idle' | 'waiting' | 'accepted';

function formatTime() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}${period}`;
}

function Bubble({ message }: { message: Message }) {
  const mine = message.from === 'me';
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

function InlineBadge({ variant, text, time }: { variant: 'blue' | 'yellow' | 'green'; text: string; time?: string }) {
  const bgMap = { blue: '#eff6ff', yellow: '#fffbeb', green: '#f0fdf4' };
  const borderMap = { blue: '#dbeafe', yellow: '#fef3c7', green: '#dcfce7' };
  const textMap = { blue: '#1e40af', yellow: '#854d0e', green: '#166534' };
  const iconColorMap = { blue: '#2563eb', yellow: '#d97706', green: '#12b76a' };
  return (
    <View style={styles.inlineBadgeWrapper}>
      {time && <Text style={styles.statusTime}>{time}</Text>}
      <View style={[styles.inlineBadge, { backgroundColor: bgMap[variant], borderColor: borderMap[variant] }]}>
        <Ionicons name="shield-outline" size={18} color={iconColorMap[variant]} style={{ marginTop: 1 }} />
        <Text style={[styles.inlineBadgeText, { color: textMap[variant] }]}>{text}</Text>
      </View>
    </View>
  );
}

function StatusCard({ type, text, time }: { type: 'blue' | 'yellow' | 'green'; text: string; time: string }) {
  const cardStyles = [
    styles.statusCard,
    type === 'blue' && styles.statusCardBlue,
    type === 'yellow' && styles.statusCardYellow,
    type === 'green' && styles.statusCardGreen,
  ];

  const textStyles = [
    styles.statusText,
    type === 'blue' && styles.statusTextBlue,
    type === 'yellow' && styles.statusTextYellow,
    type === 'green' && styles.statusTextGreen,
  ];

  const iconColor = type === 'blue' ? '#2563eb' : type === 'yellow' ? '#d97706' : '#12b76a';

  return (
    <View style={styles.statusCardWrapper}>
      <Text style={styles.statusTime}>{time}</Text>
      <View style={cardStyles}>
        <Ionicons name="shield-outline" size={20} color={iconColor} style={styles.statusIcon} />
        <Text style={textStyles}>{text}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    showInviteBanner?: string;
    invitedTaskTitle?: string;
    taskTitle?: string;
    taskPrice?: string;
  }>();
  const name = params.name ?? 'Chioma A.';
  const isHireFlow = params.showInviteBanner === 'true';

  const [messages, setMessages] = useState<ChatItem[]>(
    isHireFlow ? [] : INITIAL_MESSAGES
  );
  const [draft, setDraft] = useState('');
  const [hireStage, setHireStage] = useState<HireStage>('idle');
  // legacy non-hire flow stage
  const [flowStage, setFlowStage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  // Stage 1 to 2 auto-transition after 3 seconds (non-hire flow)
  useEffect(() => {
    if (!isHireFlow && flowStage === 1) {
      const t = setTimeout(() => setFlowStage(2), 3000);
      return () => clearTimeout(t);
    }
  }, [flowStage, isHireFlow]);

  // When hire request is sent, simulate acceptance after 4s
  useEffect(() => {
    if (hireStage === 'waiting') {
      const t = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: String(prev.length + 1),
            type: 'system',
            variant: 'green',
            text: `${name} accepted your hire request! You can now proceed to payment.`,
            time: formatTime(),
          } as SystemBubble,
        ]);
        setTimeout(() => setHireStage('accepted'), 400);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [hireStage, name]);

  const send = (text: string) => {
    const body = text.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), from: 'me', text: body, time: formatTime() } as Message,
    ]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const sendHireRequest = () => {
    const time = formatTime();
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        type: 'system',
        variant: 'blue',
        text: `Hire request sent to ${name}. Waiting for their response…`,
        time,
      } as SystemBubble,
    ]);
    setHireStage('waiting');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title={name}
        right={
          <View style={styles.headerIcons}>
            <Pressable
              hitSlop={6}
              onPress={() => router.push({ pathname: '/tasker-profile', params: { name } })}>
              <UserCircle width={24} height={24} />
            </Pressable>
            <Pressable hitSlop={6} onPress={() => router.push('/report-issue')}>
              <Flag width={24} height={24} />
            </Pressable>
          </View>
        }
      />

      {/* Task Header details summary */}
      <Pressable style={styles.taskHeader} onPress={() => {}}>
        <View style={styles.taskHeaderLeft}>
          <Text style={styles.taskHeaderTitle}>{params.taskTitle || 'Deliver Package to Lekki'}</Text>
          <View style={styles.taskHeaderSubRow}>
            <Text style={styles.taskHeaderStatus}>Open</Text>
            <Text style={styles.taskHeaderPrice}>{params.taskPrice || '₦1,000'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 104}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          
          {/* Non-hire flow: legacy status cards */}
          {!isHireFlow && (
            <StatusCard
              type="blue"
              text="You have successfully hired tasker and task is currently in progress"
              time="10:30pm"
            />
          )}

          {!isHireFlow && flowStage >= 2 && (
            <StatusCard
              type="yellow"
              text="Tasker has completed task and is currently wait for you to confirm and release payment"
              time="10:35pm"
            />
          )}

          {!isHireFlow && flowStage === 4 && (
            <StatusCard
              type="green"
              text="You have successfully released payment"
              time="10:40pm"
            />
          )}

          {/* Chat + hire flow messages */}
          {messages.map((item) => {
            if ('type' in item && item.type === 'system') {
              return (
                <InlineBadge
                  key={item.id}
                  variant={item.variant}
                  text={item.text}
                  time={item.time}
                />
              );
            }
            return <Bubble key={item.id} message={item as Message} />;
          })}

          {/* Keep payments in TaskHub notice – shown in accepted state */}
          {hireStage === 'accepted' && (
            <InlineBadge
              key="keep-payments"
              variant="yellow"
              text="Keep payments inside TaskHub for protection."
            />
          )}
        </ScrollView>

        {/* Composer area */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 16 }]}>

          {/* === HIRE FLOW BOTTOM AREA === */}
          {isHireFlow && hireStage === 'idle' && (
            <Pressable
              style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.pressed]}
              onPress={sendHireRequest}>
              <Text style={styles.bottomActionText}>Send Hire Request</Text>
            </Pressable>
          )}

          {isHireFlow && hireStage === 'waiting' && (
            <View style={styles.waitingFooter}>
              <Text style={styles.waitingTitle}>Waiting for {name}….</Text>
              <Text style={styles.waitingSubtitle}>
                They'll accept or decline your hire request.
              </Text>
            </View>
          )}

          {isHireFlow && hireStage === 'accepted' && (
            <View style={styles.acceptedFooter}>
              <View style={styles.acceptedLeft}>
                <Ionicons name="checkmark-circle" size={22} color="#12b76a" />
                <View>
                  <Text style={styles.acceptedTitle}>Hire Request accepted!</Text>
                  <Text style={styles.acceptedSub}>You can now proceed to payment.</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.payNowBtn, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/task-agreement' as any,
                    params: {
                      step: 'payment',
                      taskerPrice: params.taskPrice || '₦1,000',
                      taskerName: name,
                    },
                  })
                }>
                <Text style={styles.payNowText}>Pay Now</Text>
              </Pressable>
            </View>
          )}

          {/* === LEGACY NON-HIRE FLOW ACTIONS === */}
          {!isHireFlow && flowStage === 2 && (
            <Pressable
              style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.pressed]}
              onPress={() => setFlowStage(3)}>
              <Text style={styles.bottomActionText}>Confirm completion & release payment</Text>
            </Pressable>
          )}

          {!isHireFlow && flowStage === 3 && (
            <Pressable
              style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.pressed]}
              onPress={() => setFlowStage(4)}>
              <Text style={styles.bottomActionText}>Release payment</Text>
            </Pressable>
          )}

          {/* Quick replies */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled">
            {(isHireFlow ? HIRE_QUICK_REPLIES : QUICK_REPLIES).map((reply) => (
              <Pressable key={reply} style={styles.chip} onPress={() => send(reply)}>
                <Text style={styles.chipText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            <Pressable style={styles.iconTile} onPress={() => {}}>
              <ImageSquare width={24} height={24} />
            </Pressable>
            <View style={styles.inputField}>
              <TextInput
                style={styles.inputText}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message"
                placeholderTextColor={COLORS.placeholder}
                onSubmitEditing={() => send(draft)}
                returnKeyType="send"
              />
            </View>
            <Pressable style={[styles.iconTile, styles.sendTile]} onPress={() => send(draft)}>
              <PaperPlaneTilt width={24} height={24} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // Task Header
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskHeaderLeft: {
    gap: 4,
  },
  taskHeaderTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  taskHeaderSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskHeaderStatus: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: '#0d6639',
  },
  taskHeaderPrice: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Messages
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.sunken,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
  },
  bubbleMine: {
    backgroundColor: COLORS.brand,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
  },
  bubbleText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  bubbleTextTheirs: { color: COLORS.textSecondary },
  bubbleTextMine: { color: COLORS.onBrand },
  bubbleTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
  },
  bubbleTimeTheirs: { color: COLORS.textSecondary },
  bubbleTimeMine: { color: COLORS.onBrandSubtle },
  // Status Cards
  statusCardWrapper: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  statusTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    width: '100%',
  },
  statusCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  statusCardYellow: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  statusCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  statusIcon: {
    marginTop: 2,
  },
  statusText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  statusTextBlue: {
    color: '#1e40af',
  },
  statusTextYellow: {
    color: '#854d0e',
  },
  statusTextGreen: {
    color: '#166534',
  },
  // Composer
  composer: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    gap: 12,
  },
  bottomActionBtn: {
    height: 48,
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  bottomActionText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendTile: {
    backgroundColor: COLORS.sendTile,
  },
  inputField: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.sunken,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  pressed: {
    opacity: 0.9,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteBannerText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#854d0e',
  },
  // Inline badge (hire flow system messages)
  inlineBadgeWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    width: '100%',
  },
  inlineBadgeText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  // Waiting state footer
  waitingFooter: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 4,
  },
  waitingTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  waitingSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Accepted state footer
  acceptedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  acceptedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acceptedTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: '#166534',
  },
  acceptedSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: '#166534',
    marginTop: 1,
  },
  payNowBtn: {
    backgroundColor: '#12b76a',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  payNowText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
});

