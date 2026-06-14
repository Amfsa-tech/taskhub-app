import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { Headset } from '@/components/icons/headset';

const COLORS = {
  canvas: '#f9f9fb',
  slot: '#e8e8e8',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  onBrand: '#ffffff',
};

const CODE_LENGTH = 6;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');

  const focusInput = () => inputRef.current?.focus();

  const onChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
  };

  const verify = () => router.replace('/purpose-selection');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => {}}>
            <Headset size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Support</Text>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6 digit Code to {email ?? 'ellioteniolsamuel@gmail.com'}
          </Text>
        </View>

        {/* Code input */}
        <Pressable style={styles.slots} onPress={focusInput}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const active = i === code.length;
            return (
              <View key={i} style={[styles.slot, active && styles.slotActive]}>
                <Text style={styles.slotText}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
          />
        </Pressable>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={verify}>
            <Text style={styles.buttonLabel}>Verify</Text>
          </Pressable>

          <Pressable hitSlop={8} onPress={() => setCode('')} style={styles.resendRow}>
            <Text style={styles.resendMuted}>
              Didn’t receive a code? <Text style={styles.resendLink}>Resend</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  heading: {
    marginTop: 24,
    gap: 6,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  slots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 24,
  },
  slot: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.slot,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slotActive: {
    borderColor: COLORS.primary,
  },
  slotText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  buttons: {
    marginTop: 24,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  resendRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendMuted: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  resendLink: {
    color: COLORS.primary,
  },
});
