import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  biometricBridgeAvailable,
  confirmBiometricEnrollment,
  disableBiometrics,
  getBiometricStatus,
  getDeviceBiometricStatus,
  startBiometricEnrollment,
} from '@/lib/auth/biometrics';

export function BiometricSetting() {
  const { user, accountType } = useAuth();
  const key = ['biometrics', accountType, user?._id] as const;
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<{ challengeId: string; label: string; accountId: string }>();
  const [code, setCode] = useState('');
  const status = useQuery({
    queryKey: key,
    enabled: !!user && !!accountType && biometricBridgeAvailable(),
    retry: false,
    queryFn: async () => {
      const results = await Promise.all([getDeviceBiometricStatus(), getBiometricStatus()]);
      return { device: results[0], server: results[1].data };
    },
  });
  const device = status.data?.device;
  const local = device?.local;
  const onThisAccount = !!local && local.accountId === user?._id && local.accountType === accountType;
  const enabled = onThisAccount && !!status.data?.server.devices.some(({ credentialId }) => credentialId === local.credentialId);
  const activeChallenge = challenge?.accountId === user?._id ? challenge : undefined;
  const cancel = () => {
    setChallenge(undefined);
    setCode('');
    change.reset();
  };
  const change = useMutation({
    mutationFn: async (action: 'start' | 'confirm' | 'disable') => {
      if (!user || !accountType) throw new Error('Sign in to change biometric settings.');
      if (action === 'disable' && onThisAccount) {
        await disableBiometrics(local.credentialId);
      } else if (action === 'start') {
        if (onThisAccount && !enabled) await disableBiometrics(local.credentialId);
        const result = await startBiometricEnrollment();
        setChallenge({ ...result, accountId: user._id });
      } else if (action === 'confirm' && activeChallenge) {
        await confirmBiometricEnrollment(activeChallenge.challengeId, code, {
          accountId: user._id,
          accountType,
          label: activeChallenge.label,
        });
        setChallenge(undefined);
        setCode('');
      }
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  if (!biometricBridgeAvailable() || !user || !accountType || (status.error instanceof ApiError && status.error.status === 404)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.label}>
          <Text style={styles.title}>Enable biometrics</Text>
          <Text style={styles.hint}>
            {status.isPending ? 'Checking this device…' : local && !onThisAccount
              ? 'Another profile has biometric sign-in enabled on this device.'
              : device?.available ? `Sign in on this device with ${device.label}.` : 'Set up biometrics in your device settings.'}
          </Text>
        </View>
        <Switch accessibilityLabel="Enable biometrics" value={enabled} trackColor={{ true: '#6c3bff' }}
          disabled={status.isPending || change.isPending || !!activeChallenge || !!(local && !onThisAccount) || (!device?.available && !enabled)}
          onValueChange={(value) => change.mutate(value ? 'start' : 'disable')} />
      </View>
      {status.isError && (
        <Pressable accessibilityRole="button" onPress={() => void status.refetch()}>
          <Text style={styles.action}>Could not check biometric settings. Tap to retry.</Text>
        </Pressable>
      )}
      {activeChallenge && (
        <View style={styles.challenge}>
          <Text style={styles.hint}>Enter the 5-digit code we sent to your email.</Text>
          <TextInput accessibilityLabel="Email verification code" style={styles.input} keyboardType="number-pad"
            autoComplete="one-time-code" maxLength={5} value={code} editable={!change.isPending}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))} />
          <View style={styles.row}>
            <Pressable accessibilityRole="button" disabled={change.isPending} onPress={cancel}>
              <Text style={styles.action}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={change.isPending || code.length !== 5}
              accessibilityState={{ disabled: change.isPending || code.length !== 5 }}
              onPress={() => change.mutate('confirm')}>
              <Text style={styles.action}>{change.isPending ? 'Confirming…' : 'Confirm'}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {change.error && <Text style={styles.error} accessibilityRole="alert">{change.error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, borderBottomColor: '#e0e0ea', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flex: 1, gap: 4 },
  title: { color: '#111122', fontSize: 15, fontWeight: '600' },
  hint: { color: '#5a5a70', fontSize: 13 },
  challenge: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: '#f9f9fb' },
  input: { backgroundColor: '#ffffff', color: '#111122', borderColor: '#e0e0ea', borderWidth: 1, borderRadius: 12, padding: 12 },
  action: { color: '#6c3bff', fontSize: 14, fontWeight: '600', paddingVertical: 6 },
  error: { color: '#b01515', fontSize: 13 },
});
