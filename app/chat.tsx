import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
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

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? 'Chioma A.';

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
        </ScrollView>

        {/* Composer area */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 16 }]}>
          {/* Contextual action buttons */}
          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, styles.actionSecondary]} onPress={() => {}}>
              <Text style={styles.actionSecondaryLabel}>View Bid</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionPrimary]} onPress={() => {}}>
              <Text style={styles.actionPrimaryLabel}>Hire Now</Text>
            </Pressable>
          </View>

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
  // Composer
  composer: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondary: { backgroundColor: COLORS.sunken },
  actionPrimary: { backgroundColor: COLORS.brand },
  actionSecondaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brandText,
  },
  actionPrimaryLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.onBrand,
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
});
