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

const INITIAL_MESSAGES: Message[] = [
  { id: '1', from: 'them', text: 'Hi! I can handle your printing task.', time: '2:30PM' },
  { id: '2', from: 'me', text: ' Great! How quickly can you do it?', time: '2:30PM' },
  { id: '3', from: 'them', text: "Within 30 minutes. I'm near Zik Hall right now.", time: '2:30PM' },
  { id: '4', from: 'me', text: "Perfect! It's 15 pages, black and white.", time: '2:30PM' },
  { id: '5', from: 'them', text: "No problem. I'll head to the printing shop now.", time: '2:30PM' },
];

const QUICK_REPLIES = ['On my way!', 'How Long?', 'Thanks!', 'You are welcome'];

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
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? 'Chioma A.';

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [flowStage, setFlowStage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  // Stage 1 to 2 auto-transition after 3 seconds
  useEffect(() => {
    if (flowStage === 1) {
      const t = setTimeout(() => {
        setFlowStage(2);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [flowStage]);

  const send = (text: string) => {
    const body = text.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), from: 'me', text: body, time: formatTime() },
    ]);
    setDraft('');
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
          <Text style={styles.taskHeaderTitle}>Deliver Package to Lekki</Text>
          <View style={styles.taskHeaderSubRow}>
            <Text style={styles.taskHeaderStatus}>Open</Text>
            <Text style={styles.taskHeaderPrice}>₦1,000</Text>
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
          
          {/* Status logs */}
          <StatusCard
            type="blue"
            text="You have successfully hired tasker and task is currently in progress"
            time="10:30pm"
          />

          {flowStage >= 2 && (
            <StatusCard
              type="yellow"
              text="Tasker has completed task and is currently wait for you to confirm and release payment"
              time="10:35pm"
            />
          )}

          {flowStage === 4 && (
            <StatusCard
              type="green"
              text="You have successfully released payment"
              time="10:40pm"
            />
          )}

          {/* Chat conversations */}
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
        </ScrollView>

        {/* Composer area */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 16 }]}>
          
          {/* Contextual status button actions */}
          {flowStage === 2 && (
            <Pressable
              style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.pressed]}
              onPress={() => setFlowStage(3)}>
              <Text style={styles.bottomActionText}>Confirm completion & release payment</Text>
            </Pressable>
          )}

          {flowStage === 3 && (
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
            {QUICK_REPLIES.map((reply) => (
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
});
