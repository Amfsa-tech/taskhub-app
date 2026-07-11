<<<<<<< HEAD
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
=======
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
<<<<<<< HEAD
  KeyboardAvoidingView,
  Linking,
=======
  Image,
  KeyboardAvoidingView,
  Modal,
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Flag from '@/assets/icons/flag.svg';
import PaperPlaneTilt from '@/assets/icons/paper-plane-tilt.svg';
import PaperClip from '@/assets/icons/Paperclip.svg';
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
<<<<<<< HEAD
  error: '#dc2626',
};

const QUICK_REPLIES = ['On my way!', 'How Long?', 'Thanks!', 'You are welcome'];

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
=======
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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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

<<<<<<< HEAD
function SystemNote({ text }: { text: string }) {
  return (
    <View style={styles.systemRow}>
      <Text style={styles.systemText}>{text}</Text>
=======
function AttachmentBubble({ message }: { message: any }) {
  const mine = message.from === 'me';

  const handleOpenLink = () => {
    if (message.attachmentType === 'location') {
      Alert.alert('Open Map', `Opening location in maps...`);
    } else {
      Alert.alert('Open File', `Opening attachment "${message.attachmentName}"...`);
    }
  };

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {message.attachmentType === 'location' ? (
        <View style={styles.locationCard}>
          <Pressable onPress={handleOpenLink}>
            <Image
              source={{ uri: message.attachmentUrl }}
              style={styles.locationMapImage}
              resizeMode="cover"
            />
          </Pressable>
          <View style={styles.locationFooter}>
            <View style={styles.locationTextCol}>
              <View style={styles.locationHeaderRow}>
                <Text style={styles.locationTitle}>
                  {message.locationName === 'Home' || message.locationName === 'Office'
                    ? message.locationName
                    : 'Current Location'}
                </Text>
                <Pressable onPress={handleOpenLink} hitSlop={8}>
                  <Ionicons name="open-outline" size={16} color={COLORS.brand} style={styles.openIcon} />
                </Pressable>
              </View>
              <Text style={styles.locationSubtitle}>{message.text}</Text>
            </View>
          </View>
          <Text style={[styles.bubbleTime, { paddingHorizontal: 12, paddingBottom: 8 }]}>
            {message.time}
          </Text>
        </View>
      ) : message.attachmentType === 'image' ? (
        <View style={[styles.imageCard, mine ? styles.imageCardMine : styles.imageCardTheirs]}>
          <Image
            source={{ uri: message.attachmentUrl }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
          <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs, { marginTop: 4 }]}>
            {message.time}
          </Text>
        </View>
      ) : (
        <Pressable
          style={[styles.docCard, mine ? styles.docCardMine : styles.docCardTheirs]}
          onPress={handleOpenLink}>
          <View style={styles.docRow}>
            <View style={styles.docIconBox}>
              <Ionicons
                name={
                  message.attachmentName.endsWith('.pdf')
                    ? 'document-text'
                    : message.attachmentName.endsWith('.xlsx') || message.attachmentName.endsWith('.csv')
                    ? 'grid'
                    : 'document'
                }
                size={24}
                color={COLORS.brand}
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docName, mine ? styles.docNameMine : styles.docNameTheirs]} numberOfLines={1}>
                {message.attachmentName}
              </Text>
              <Text style={styles.docMeta}>
                {message.attachmentName.split('.').pop()?.toUpperCase()}  •  1.2 MB
              </Text>
            </View>
            <Ionicons name="arrow-down-circle-outline" size={20} color={mine ? '#ffffff' : COLORS.textSecondary} />
          </View>
          <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs, { marginTop: 6 }]}>
            {message.time}
          </Text>
        </Pressable>
      )}
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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
<<<<<<< HEAD
  const queryClient = useQueryClient();
  const { accountType } = useAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const conversationId = params.id;
  const name = params.name ?? 'Chat';

  const { data, isLoading, isError, refetch } = useMessages(conversationId);
  const messages = data?.messages ?? [];

=======
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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
  const [draft, setDraft] = useState('');
  const [hireStage, setHireStage] = useState<HireStage>('idle');
  // legacy non-hire flow stage
  const [flowStage, setFlowStage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

<<<<<<< HEAD
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
=======
  // Attachment & location share state
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
    setDraft('');
    sendMutation.mutate({ text: body });
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

<<<<<<< HEAD
  const sendPhoto = async () => {
    if (!conversationId) return;
    const picked = await pickImages(1);
    if (picked.length) sendMutation.mutate({ attachments: picked });
=======
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

  const handleShareCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access location was denied. Sharing mock location instead.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleShareSavedLocation('Current Location', 'Zik hall, university of Ibadan', 7.4439, 3.9015);
              }
            }
          ]
        );
        setIsLocating(false);
        setIsLocationModalOpen(false);
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = locationData.coords;

      const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';
      let addressName = 'Coordinates: ' + latitude.toFixed(4) + ', ' + longitude.toFixed(4);

      if (GEOAPIFY_API_KEY) {
        try {
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            addressName = data.features[0].properties.formatted;
          }
        } catch (e) {
          console.warn('Reverse geocoding failed', e);
        }
      }

      const staticMapUrl = GEOAPIFY_API_KEY
        ? `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=300&center=lonlat:${longitude},${latitude}&zoom=15&marker=lonlat:${longitude},${latitude};color:%236c3bff;size:medium&apiKey=${GEOAPIFY_API_KEY}`
        : 'https://i.postimg.cc/mDtbSgD3/mock-map.png';

      setMessages((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          from: 'me',
          time: formatTime(),
          attachmentType: 'location',
          attachmentUrl: staticMapUrl,
          locationName: 'Current Location',
          text: addressName,
          lat: latitude,
          lon: longitude,
        } as any,
      ]);

      setIsLocationModalOpen(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      console.warn('Failed to get current location', err);
      handleShareSavedLocation('Current Location', 'Zik hall, university of Ibadan', 7.4439, 3.9015);
    } finally {
      setIsLocating(false);
    }
  };

  const handleShareSavedLocation = (nameStr: string, address: string, lat: number, lon: number) => {
    const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';
    const staticMapUrl = GEOAPIFY_API_KEY
      ? `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=300&center=lonlat:${lon},${lat}&zoom=15&marker=lonlat:${lon},${lat};color:%236c3bff;size:medium&apiKey=${GEOAPIFY_API_KEY}`
      : 'https://i.postimg.cc/mDtbSgD3/mock-map.png';

    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        from: 'me',
        time: formatTime(),
        attachmentType: 'location',
        attachmentUrl: staticMapUrl,
        locationName: nameStr,
        text: address,
        lat,
        lon,
      } as any,
    ]);

    setIsLocationModalOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handlePickDocument = (fileName: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        from: 'me',
        time: formatTime(),
        attachmentType: 'document',
        attachmentName: fileName,
      } as any,
    ]);
    setIsDocPickerOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleCapturePhoto = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        from: 'me',
        time: formatTime(),
        attachmentType: 'image',
        attachmentUrl: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=400&q=80',
      } as any,
    ]);
    setIsCameraOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleSelectGalleryPhoto = (url: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        from: 'me',
        time: formatTime(),
        attachmentType: 'image',
        attachmentUrl: url,
      } as any,
    ]);
    setIsImagePickerOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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
      <Pressable style={styles.taskHeader} onPress={() => { }}>
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
<<<<<<< HEAD
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
=======
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

            const msg = item as any;
            if (msg.attachmentType) {
              return <AttachmentBubble key={msg.id} message={msg} />;
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
                They{"'"}ll accept or decline your hire request.
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

>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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
<<<<<<< HEAD
            <Pressable style={styles.iconTile} onPress={sendPhoto}>
              <ImageSquare width={24} height={24} />
=======
            <Pressable style={styles.iconTile} onPress={() => setIsAttachmentModalOpen(true)}>
              <PaperClip width={24} height={24} />
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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

      {/* Send Attachment Modal */}
      <Modal
        visible={isAttachmentModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAttachmentModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsAttachmentModalOpen(false)}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Send Attachment</Text>
            
            <View style={styles.gridContainer}>
              <Pressable
                style={styles.gridItem}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  setIsCameraOpen(true);
                }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="camera-outline" size={24} color="#1d4ed8" />
                </View>
                <Text style={styles.gridLabel}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={styles.gridItem}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  setIsImagePickerOpen(true);
                }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#f3eeff' }]}>
                  <Ionicons name="image-outline" size={24} color="#6c3bff" />
                </View>
                <Text style={styles.gridLabel}>Choose Photo</Text>
              </Pressable>

              <Pressable
                style={styles.gridItem}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  setIsDocPickerOpen(true);
                }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#fffbea' }]}>
                  <Ionicons name="document-text-outline" size={24} color="#b45309" />
                </View>
                <Text style={styles.gridLabel}>Upload Document</Text>
              </Pressable>

              <Pressable
                style={styles.gridItem}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  setIsLocationModalOpen(true);
                }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="map-outline" size={24} color="#15803d" />
                </View>
                <Text style={styles.gridLabel}>Share Location</Text>
              </Pressable>
            </View>

            <Text style={styles.gridFooterText}>
              Supports PDF, DOC, DOCX, PPT, XLS, ZIP, Images
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* Share Location Modal */}
      <Modal
        visible={isLocationModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsLocationModalOpen(false)}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Share Location</Text>
              <Pressable hitSlop={8} onPress={() => setIsLocationModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <Pressable
              style={styles.locationOptionRow}
              onPress={handleShareCurrentLocation}>
              <View style={[styles.locationOptionIcon, { backgroundColor: '#eff6ff' }]}>
                {isLocating ? (
                  <ActivityIndicator size="small" color="#1d4ed8" />
                ) : (
                  <Ionicons name="navigate-outline" size={20} color="#1d4ed8" />
                )}
              </View>
              <View style={styles.locationOptionDetails}>
                <Text style={styles.locationOptionTitle}>Current Location</Text>
                <Text style={styles.locationOptionSubtitle}>
                  {isLocating ? 'Determining your coordinates...' : 'Share where you are right now'}
                </Text>
              </View>
            </Pressable>

            <Text style={styles.savedLabel}>SAVED ADDRESSES</Text>

            <Pressable
              style={styles.locationOptionRow}
              onPress={() => handleShareSavedLocation('Home', 'Block c , zik hall', 7.4439, 3.9015)}>
              <View style={[styles.locationOptionIcon, { backgroundColor: '#f3eeff' }]}>
                <Ionicons name="pin-outline" size={20} color={COLORS.brand} />
              </View>
              <View style={styles.locationOptionDetails}>
                <Text style={styles.locationOptionTitle}>Home</Text>
                <Text style={styles.locationOptionSubtitle}>Block c , zik hall</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.locationOptionRow}
              onPress={() => handleShareSavedLocation('Office', 'Chevron', 6.4281, 3.4219)}>
              <View style={[styles.locationOptionIcon, { backgroundColor: '#f3eeff' }]}>
                <Ionicons name="pin-outline" size={20} color={COLORS.brand} />
              </View>
              <View style={styles.locationOptionDetails}>
                <Text style={styles.locationOptionTitle}>Office</Text>
                <Text style={styles.locationOptionSubtitle}>Chevron</Text>
              </View>
            </Pressable>

          </View>
        </Pressable>
      </Modal>

      {/* Mock Document Picker Modal */}
      <Modal
        visible={isDocPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDocPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsDocPickerOpen(false)}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Document</Text>
              <Pressable hitSlop={8} onPress={() => setIsDocPickerOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <Pressable style={styles.fileRow} onPress={() => handlePickDocument('Assignment_Draft.pdf')}>
              <Ionicons name="document-text" size={24} color="#ef4444" />
              <Text style={styles.fileNameText}>Assignment_Draft.pdf</Text>
            </Pressable>
            
            <Pressable style={styles.fileRow} onPress={() => handlePickDocument('GST_Notes.xlsx')}>
              <Ionicons name="grid" size={24} color="#10b981" />
              <Text style={styles.fileNameText}>GST_Notes.xlsx</Text>
            </Pressable>

            <Pressable style={styles.fileRow} onPress={() => handlePickDocument('Project_Proposal.docx')}>
              <Ionicons name="document" size={24} color="#2563eb" />
              <Text style={styles.fileNameText}>Project_Proposal.docx</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Mock Camera Modal */}
      <Modal
        visible={isCameraOpen}
        animationType="fade"
        onRequestClose={() => setIsCameraOpen(false)}>
        <View style={styles.cameraContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80' }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.cameraOverlay}>
            <Pressable style={styles.cameraCloseBtn} onPress={() => setIsCameraOpen(false)}>
              <Ionicons name="close" size={30} color="#ffffff" />
            </Pressable>
            
            <View style={styles.cameraBottomBar}>
              <Pressable style={styles.shutterButton} onPress={handleCapturePhoto}>
                <View style={styles.shutterButtonInner} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mock Gallery Picker Modal */}
      <Modal
        visible={isImagePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsImagePickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsImagePickerOpen(false)}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Choose Photo</Text>
              <Pressable hitSlop={8} onPress={() => setIsImagePickerOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.galleryGrid}>
              {[
                'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=300&q=80',
              ].map((url, i) => (
                <Pressable key={i} style={styles.galleryItem} onPress={() => handleSelectGalleryPhoto(url)}>
                  <Image source={{ uri: url }} style={styles.galleryImage} />
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
  },
  // Composer
  composer: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    gap: 12,
  },
<<<<<<< HEAD
=======
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
>>>>>>> 9406da0f79bbbfd36c4dab6d39988089096b3e1b
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

  // Custom attachment bubble and modal styles
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e2ec',
    width: 250,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignSelf: 'flex-end',
    marginVertical: 4,
  },
  locationMapImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e5e5e5',
  },
  locationFooter: {
    padding: 12,
  },
  locationTextCol: {
    gap: 4,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#111122',
  },
  locationSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#5a5a70',
    lineHeight: 16,
  },
  openIcon: {
    marginLeft: 4,
  },
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 200,
    padding: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e2ec',
    marginVertical: 4,
  },
  imageCardMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(108,59,255,0.12)',
  },
  imageCardTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  attachmentImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  docCard: {
    borderRadius: 16,
    padding: 12,
    width: 240,
    borderWidth: 1,
    borderColor: '#e2e2ec',
    marginVertical: 4,
  },
  docCardMine: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.brand,
  },
  docCardTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
  },
  docNameMine: {
    color: '#ffffff',
  },
  docNameTheirs: {
    color: '#111122',
  },
  docMeta: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: '#a0a0ba',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginVertical: 8,
  },
  gridItem: {
    width: '47%',
    backgroundColor: COLORS.canvas,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gridFooterText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  locationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  locationOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationOptionDetails: {
    flex: 1,
    gap: 2,
  },
  locationOptionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  locationOptionSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  savedLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  fileNameText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  cameraCloseBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBottomBar: {
    alignItems: 'center',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  galleryItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});

