import { useMutation } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BiometricDialog, BiometricIcon, biometricLabel } from './biometric-dialog';

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
  const emailConfirmation = login.error instanceof ApiError && login.error.emailVerificationRequired;
  const label = biometricLabel(credential.label);
  const method = label === 'Fingerprint' ? 'fingerprint' : label;
  const closeError = () => { login.reset(); if (revoked) setCredential(null); };
  return (
    <View style={styles.group}>
      {!revoked && <Pressable accessibilityRole="button" disabled={disabled || login.isPending}
        accessibilityLabel={`Sign in with ${method}`}
        style={({ pressed }) => [styles.button, (pressed || disabled || login.isPending) && styles.dimmed]} onPress={() => login.mutate()}>
        <View style={styles.icon}><BiometricIcon label={label} size={27} /></View>
        <View style={styles.copy}>
          <Text style={styles.label}>{login.isPending ? 'Signing in…' : `Sign in with ${method}`}</Text>
          <Text style={styles.hint}>Quick, secure access on this device</Text>
        </View>
        {login.isPending ? <ActivityIndicator color="#6c3bff" /> : <MaterialCommunityIcons name="chevron-right" size={22} color="#6c3bff" />}
      </Pressable>}
      <BiometricDialog visible={!!login.error && !emailConfirmation} label={label}
        title={revoked ? 'Sign in with your password' : `Couldn’t sign in with ${method}`}
        description={revoked ? 'You can turn biometric sign-in on again in Settings after signing in.' : 'You can try the biometric check again or use your password.'}
        dismissible={!login.isPending} onClose={closeError}>
        {login.error && <Text accessibilityRole="alert" style={styles.error}>{login.error.message}</Text>}
        {!revoked && <Pressable accessibilityRole="button" style={styles.retry} disabled={disabled || login.isPending} onPress={() => login.mutate()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" style={styles.password} onPress={closeError}><Text style={styles.label}>Use password instead</Text></Pressable>
      </BiometricDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignSelf: 'stretch', gap: 6 },
  button: { borderRadius: 16, borderWidth: 1, borderColor: '#e4d6ff', padding: 14, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#f3eeff', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  label: { color: '#6c3bff', fontSize: 15, fontFamily: 'Geist_600SemiBold' },
  hint: { color: '#78788c', fontSize: 12, fontFamily: 'Geist_400Regular' },
  dimmed: { opacity: 0.5 },
  error: { alignSelf: 'stretch', color: '#b01515', backgroundColor: '#fff1f1', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19 },
  retry: { alignSelf: 'stretch', minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#6c3bff', marginTop: 8 },
  retryText: { color: '#ffffff', fontSize: 15, fontFamily: 'Geist_600SemiBold' },
  password: { minHeight: 44, justifyContent: 'center' },
});
