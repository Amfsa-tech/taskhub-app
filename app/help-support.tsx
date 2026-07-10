import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taskhub/screen-header';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e0e0ea',
  danger: '#b01515',
  success: '#15803d',
  successLight: '#f0fdf4',
  info: '#1d4ed8',
  infoLight: '#eff6ff',
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'post-task',
    question: 'How do i post a task',
    answer: 'Tap the "Post" button on the home screen and follow the steps to describe your task, set a budget, and publish it.',
  },
  {
    id: 'verification',
    question: 'How are taskers verified?',
    answer: 'All taskers go through face verification and optional NIN verification before they can accept tasks.',
  },
  {
    id: 'payment',
    question: 'When do i pay?',
    answer: 'Payment is held in escrow when you accept a bid. Funds are released to the tasker after you confirm task completion.',
  },
  {
    id: 'cancel',
    question: 'How do i cancel a task?',
    answer: 'Open the task detail, tap the menu icon, and select "Cancel Task". Cancellation policies may apply.',
  },
  {
    id: 'dispute',
    question: 'What if there us a dispute',
    answer: 'Use the "Report Issue" option in the task detail or contact support directly. Our team resolves disputes within 24 hours.',
  },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Expanded state starts closed by default
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const toggleFAQ = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleContact = (type: string) => {
    Alert.alert(`Contact via ${type}`, `Connecting you to TaskHub support...`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Help & Support" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        
        {/* Support Grid (Live chat, Call us, Email Us) */}
        <View style={styles.supportRow}>
          <Pressable style={styles.supportCard} onPress={() => handleContact('Live Chat')}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.brandLight }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.brand} />
            </View>
            <Text style={styles.supportLabel}>Live chat</Text>
          </Pressable>

          <Pressable style={styles.supportCard} onPress={() => handleContact('Call Us')}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="call-outline" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.supportLabel}>Call us</Text>
          </Pressable>

          <Pressable style={styles.supportCard} onPress={() => handleContact('Email Us')}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="mail-outline" size={22} color={COLORS.info} />
            </View>
            <Text style={styles.supportLabel}>Email Us</Text>
          </Pressable>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqCard}>
          {FAQ_ITEMS.map((faq, index) => {
            const isExpanded = expandedState[faq.id];
            return (
              <View key={faq.id}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable style={styles.faqRow} onPress={() => toggleFAQ(faq.id)}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </Pressable>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Report Issue Button */}
        <Pressable
          style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
          onPress={() => router.push('/report-issue')}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
          <Text style={styles.reportText}>Report Issue</Text>
        </Pressable>

      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  supportCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginTop: 8,
    paddingLeft: 4,
  },
  faqCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  faqAnswerContainer: {
    paddingBottom: 16,
    paddingRight: 8,
  },
  faqAnswer: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  reportButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  reportText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.danger,
  },
  pressed: {
    opacity: 0.7,
  },
});
