import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import {
  isMine,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type MessageAttachment,
} from '@/lib/api/chat';
import { useMessages } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { pickImages, type PickedImage } from '@/lib/image-picker';

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
  error: '#dc2626',
};

const QUICK_REPLIES = ['On my way!', 'How Long?', 'Thanks!', 'You are welcome'];

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}${period}`;
}

function isImageAttachment(a: MessageAttachment): boolean {
  return (a.type ?? '').startsWith('image') || !a.type;
}

function Bubble({
  mine,
  text,
  time,
  attachments,
}: {
  mine: boolean;
  text: string;
  time: string;
  attachments?: MessageAttachment[];
}) {
  const images = (attachments ?? []).filter(isImageAttachment);
  const files = (attachments ?? []).filter((a) => !isImageAttachment(a));
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {images.map((img) => (
          <Image key={img.url} source={{ uri: img.url }} style={styles.attachImage} contentFit="cover" />
        ))}
        {files.map((f) => (
          <Pressable key={f.url} onPress={() => Linking.openURL(f.url)}>
            <Text
              style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
              📎 {f.name || 'Attachment'}
            </Text>
          </Pressable>
        ))}
        {text ? (
          <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {text}
          </Text>
        ) : null}
        <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

function SystemNote({ text }: { text: string }) {
  return (
    <View style={styles.systemRow}>
      <Text style={styles.systemText}>{text}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accountType } = useAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const conversationId = params.id;
  const name = params.name ?? 'Chat';

  const { data, isLoading, isError, refetch } = useMessages(conversationId);
  const messages = data?.messages ?? [];

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Mark the conversation read on open, then refresh the inbox + badge.
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['chat'] }))
      .catch(() => {});
  }, [conversationId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (payload: { text?: string; attachments?: PickedImage[] }) =>
      sendMessage(conversationId as string, payload.text ?? '', payload.attachments),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
    onError: (err) =>
      Alert.alert('Message not sent', err instanceof Error ? err.message : 'Please try again.'),
  });

  const send = (text: string) => {
    const body = text.trim();
    if (!body || !conversationId) return;
    setDraft('');
    sendMutation.mutate({ text: body });
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const sendPhoto = async () => {
    if (!conversationId) return;
    const picked = await pickImages(1);
    if (picked.length) sendMutation.mutate({ attachments: picked });
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
        {isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>Couldn’t load messages.</Text>
            <Pressable hitSlop={8} onPress={() => refetch()}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {messages.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            ) : (
              messages.map((m: ChatMessage) =>
                m.senderType === 'system' ? (
                  <SystemNote key={m._id} text={m.text ?? ''} />
                ) : (
                  <Bubble
                    key={m._id}
                    mine={isMine(m, accountType)}
                    text={m.text ?? ''}
                    time={formatMessageTime(m.createdAt)}
                    attachments={m.attachments}
                  />
                ),
              )
            )}
          </ScrollView>
        )}

        {/* Composer area */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 16 }]}>
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
            <Pressable style={styles.iconTile} onPress={sendPhoto}>
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
    flexGrow: 1,
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
  attachImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bubbleTime: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
  },
  bubbleTimeTheirs: { color: COLORS.textSecondary },
  bubbleTimeMine: { color: COLORS.onBrandSubtle },
  systemRow: {
    alignItems: 'center',
  },
  systemText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.error,
  },
  retry: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brand,
  },
  // Composer
  composer: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    gap: 12,
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
