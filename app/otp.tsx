import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { Headset } from '@/components/icons/headset';
import { resendVerification, verifyEmail } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import type { AccountType } from '@/lib/auth/types';

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
  const { email, password, type } = useLocalSearchParams<{
    email?: string;
    password?: string;
    type?: string;
  }>();
  const accountType: AccountType = type === 'tasker' ? 'tasker' : 'user';
  const { signIn } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const focusInput = () => inputRef.current?.focus();

  const onChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
  };

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error('Missing email address. Please start again.');
      await verifyEmail({ code, emailAddress: email, type: accountType });
      // When we arrived from sign-up we have the password, so log in
      // automatically. When we arrived from an unverified login we don't —
      // send the user back to log in with their now-verified account.
      if (password) {
        await signIn(accountType, { emailAddress: email, password });
        return true;
      }
      return false;
    },
    onSuccess: (loggedIn) => {
      router.replace(loggedIn ? '/purpose-selection' : '/login-form');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => {
      if (!email) throw new Error('Missing email address. Please start again.');
      return resendVerification({ emailAddress: email, type: accountType });
    },
    onSuccess: () => {
      setCode('');
      Alert.alert('Code sent', 'We sent a new verification code to your email.');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    },
  });

  const verify = () => {
    setError(null);
    if (code.length < CODE_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    verifyMutation.mutate();
  };

  const isVerifying = verifyMutation.isPending;

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isVerifying && styles.buttonDisabled,
            ]}
            onPress={verify}
            disabled={isVerifying}>
            {isVerifying ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <Text style={styles.buttonLabel}>Verify</Text>
            )}
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            style={styles.resendRow}>
            <Text style={styles.resendMuted}>
              {resendMutation.isPending ? (
                'Sending…'
              ) : (
                <>
                  Didn’t receive a code? <Text style={styles.resendLink}>Resend</Text>
                </>
              )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  error: {
    marginTop: 16,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#dc2626',
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
