import { Ionicons } from '@expo/vector-icons';
import { maskEmail } from '@/lib/mask-email';
import { CaptchaNotice } from "@/components/taskhub/captcha-notice";
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { Headset } from '@/components/icons/headset';
import { ApiError } from '@/lib/api/client';
import { takePendingEmailLogin } from '@/lib/auth/pending-email-login';
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

const CODE_LENGTH = 5;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, retryAfter, type } = useLocalSearchParams<{
    email?: string;
    retryAfter?: string;
    type?: string;
  }>();
  const accountType: AccountType = type === 'tasker' ? 'tasker' : 'user';
  const { isAuthenticated, refreshProfile, signIn } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [emailVisible, setEmailVisible] = useState(false);
  useEffect(() => setEmailVisible(false), [email]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(() => Math.min(60, Math.max(0, Number(retryAfter) || 0)));

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

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
      if (isAuthenticated) {
        await refreshProfile();
        return 'existing-session' as const;
      }
      const pending = takePendingEmailLogin(accountType, email);
      if (pending) {
        try {
          if (pending.authenticate) {
            if (!await pending.authenticate()) return 'login-required' as const;
          } else {
            await signIn(accountType, { emailAddress: email, password: pending.password });
          }
          return pending.signup ? 'new-account' as const : 'existing-session' as const;
        } catch {
          return 'login-required' as const;
        }
      }
      return 'login-required' as const;
    },
    onSuccess: (result) => {
      // purpose-selection collects *user* interests; a fresh tasker goes
      // straight home, where the empty feed routes them to service selection.
      if (result === 'existing-session') {
        router.replace('/home');
      } else if (result === 'login-required') {
        router.replace({ pathname: '/login-form', params: { type: accountType } });
      } else {
        router.replace(accountType === 'tasker' ? '/home' : '/purpose-selection');
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      const attempts = err instanceof ApiError ? (err.body as { attemptsRemaining?: number })?.attemptsRemaining : undefined;
      setError(attempts != null ? `${message}. Attempts remaining: ${attempts}.` : message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => {
      if (!email) throw new Error('Missing email address. Please start again.');
      return resendVerification({ emailAddress: email, type: accountType });
    },
    onSuccess: () => {
      setCode('');
      setNotice('A new code was sent. Check your spam or junk folder if it does not arrive.');
      setResendSeconds(60);
    },
    onError: (err) => {
      const cooldown = err instanceof ApiError ? (err.body as { retryAfter?: number })?.retryAfter : undefined;
      if (cooldown && cooldown > 0) setResendSeconds(cooldown);
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    },
  });

  const verify = () => {
    setError(null);
    setNotice(null);
    if (code.length < CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code.`);
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
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.push('/help-support')}>
            <Headset size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Support</Text>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Verify your email</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.subtitle, { flex: 1 }]}>
            Enter the {CODE_LENGTH}-digit code for {email ? (emailVisible ? email : maskEmail(email)) : 'your email'}.
          </Text>
          {email ? <Pressable accessibilityRole="button" accessibilityLabel={emailVisible ? 'Hide email address' : 'Show email address'} accessibilityState={{ expanded: emailVisible }} hitSlop={8} onPress={() => setEmailVisible((value) => !value)} style={{ alignSelf: 'flex-start', padding: 8 }}>
          <Ionicons name={emailVisible ? 'eye-off-outline' : 'eye-outline'} size={19} color={COLORS.primary} />
        </Pressable> : null}
          </View>
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

        <CaptchaNotice />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

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
            onPress={() => {
              setError(null);
              setNotice(null);
              resendMutation.mutate();
            }}
            disabled={resendMutation.isPending || resendSeconds > 0}
            style={styles.resendRow}>
            <Text style={styles.resendMuted}>
              {resendMutation.isPending ? (
                'Sending…'
              ) : resendSeconds > 0 ? (
                `Resend in ${resendSeconds}s`
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
  notice: {
    marginTop: 16,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#0d6639',
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
