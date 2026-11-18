import { useMutation } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { readBiometricCredential, type BiometricCredential } from '@/lib/auth/biometrics';
import { setPendingBiometricLogin } from '@/lib/auth/pending-email-login';

export function BiometricLoginButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const { signInWithBiometrics } = useAuth();
  const [credential, setCredential] = useState<BiometricCredential | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    void readBiometricCredential().then((value) => { if (active) setCredential(value); }).catch(() => {});
    return () => { active = false; };
  }, []));
  const login = useMutation({
    mutationFn: signInWithBiometrics,
    onSuccess: (user) => { if (user) router.replace('/home'); },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.emailVerificationRequired) return;
      const data = error.body as { emailAddress?: string; user_type?: string; retryAfter?: number };
      if (!data.emailAddress || (data.user_type !== 'user' && data.user_type !== 'tasker')) return;
      setPendingBiometricLogin(data.user_type, data.emailAddress, signInWithBiometrics);
      router.push({ pathname: '/otp', params: { email: data.emailAddress, type: data.user_type, retryAfter: String(data.retryAfter ?? 0) } });
    },
  });
  if (!credential) return null;
  const revoked = login.error instanceof ApiError && login.error.code === 'BIOMETRIC_NOT_AVAILABLE';
  return (
    <View style={styles.group}>
      {!revoked && <Pressable accessibilityRole="button" disabled={disabled || login.isPending}
        style={styles.button} onPress={() => login.mutate()}>
        <Text style={styles.label}>{login.isPending ? 'Signing in…' : `Sign in with ${credential.label}`}</Text>
      </Pressable>}
      {login.error && <Text accessibilityRole="alert" style={styles.error}>{login.error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignSelf: 'stretch', gap: 6 },
  button: { borderRadius: 16, borderWidth: 1, borderColor: '#e0e0ea', padding: 14, backgroundColor: '#ffffff', alignItems: 'center' },
  label: { color: '#6c3bff', fontSize: 15, fontWeight: '600' },
  error: { color: '#b01515', backgroundColor: '#ffffff', padding: 8, fontSize: 13, textAlign: 'center' },
});
