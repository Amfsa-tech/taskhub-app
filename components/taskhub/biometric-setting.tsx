import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BiometricDialog, biometricLabel } from './biometric-dialog';
import type { AccountType, AuthUser } from '@/lib/auth/types';

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
  if (!biometricBridgeAvailable() || !user || !accountType) return null;
  return <AccountBiometricSetting key={`${accountType}:${user._id}`} user={user} accountType={accountType} />;
}

function AccountBiometricSetting({ user, accountType }: { user: AuthUser; accountType: AccountType }) {
  const key = ['biometrics', accountType, user?._id] as const;
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<{ challengeId: string; label: string; accountId: string }>();
  const [code, setCode] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
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
  const label = biometricLabel(activeChallenge?.label ?? device?.label);
  const method = label === 'Fingerprint' ? 'fingerprint' : label;
  const cancel = () => {
    if (change.isPending) return;
    setSetupOpen(false);
    setSetupComplete(false);
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
        setSetupComplete(true);
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
          onValueChange={(value) => {
            if (value) { setSetupOpen(true); setSetupComplete(false); setCode(''); }
            change.mutate(value ? 'start' : 'disable');
          }} />
      </View>
      {status.isError && (
        <Pressable accessibilityRole="button" onPress={() => void status.refetch()}>
          <Text style={styles.action}>Could not check biometric settings. Tap to retry.</Text>
        </Pressable>
      )}
      <BiometricDialog visible={setupOpen} label={label} onClose={cancel} dismissible={!change.isPending}
        title={setupComplete ? `${label} is ready` : `Set up ${method} sign-in`}
        description={setupComplete ? 'You can now sign in quickly on this device. Your password is still available whenever you need it.'
          : activeChallenge ? `Confirm it’s you. Enter the 5-digit code sent to ${user.emailAddress}.`
            : 'Confirm your email to securely enable biometric sign-in for this profile.'}>
        {setupComplete ? <>
          <View style={styles.success}><MaterialCommunityIcons name="check-circle" size={22} color="#15803d" /><Text style={styles.successText}>Enabled on this device</Text></View>
          <Pressable accessibilityRole="button" style={styles.primary} disabled={change.isPending} onPress={cancel}><Text style={styles.primaryText}>Done</Text></Pressable>
        </> : <>
          {activeChallenge && <View style={styles.codeGroup}>
            <Text style={styles.codeLabel}>EMAIL VERIFICATION CODE</Text>
            <View style={styles.digits}>
              {[0, 1, 2, 3, 4].map(index => <View key={index} accessible={false} style={[styles.digit, index === code.length && styles.activeDigit]}>
                <Text style={styles.digitText}>{code[index] ?? ''}</Text>
              </View>)}
              <TextInput accessibilityLabel="Email verification code" style={styles.codeInput} keyboardType="number-pad"
                autoFocus autoComplete="one-time-code" textContentType="oneTimeCode" caretHidden selectionColor="transparent" underlineColorAndroid="transparent"
                maxLength={5} value={code} editable={!change.isPending}
                onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 5))} />
            </View>
            <Text style={styles.codeHint}>This code confirms setup. Your device will handle future biometric checks.</Text>
          </View>}
          {change.error && <Text style={styles.dialogError} accessibilityRole="alert">{change.error.message}</Text>}
          {change.isPending && !activeChallenge ? <View style={styles.loading} accessibilityLiveRegion="polite"><ActivityIndicator color="#6c3bff" /><Text style={styles.hint}>Sending your email code…</Text></View>
            : <Pressable accessibilityRole="button" disabled={change.isPending || (!!activeChallenge && code.length !== 5)}
              accessibilityState={{ disabled: change.isPending || (!!activeChallenge && code.length !== 5) }}
              style={[styles.primary, (change.isPending || (!!activeChallenge && code.length !== 5)) && styles.disabled]}
              onPress={() => change.mutate(activeChallenge ? 'confirm' : 'start')}>
              {change.isPending && <ActivityIndicator color="#ffffff" size="small" />}
              <Text style={styles.primaryText}>{change.isPending ? 'Confirming…' : activeChallenge ? `Enable ${method}` : 'Try again'}</Text>
            </Pressable>}
          <Pressable accessibilityRole="button" disabled={change.isPending} style={styles.secondary} onPress={cancel}><Text style={styles.action}>Not now</Text></Pressable>
        </>}
      </BiometricDialog>
      {change.error && !setupOpen && <Text style={styles.error} accessibilityRole="alert">{change.error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, borderBottomColor: '#e0e0ea', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flex: 1, gap: 4 },
  title: { color: '#111122', fontSize: 15, fontWeight: '600' },
  hint: { color: '#5a5a70', fontSize: 13 },
  codeGroup: { alignSelf: 'stretch', gap: 12, marginTop: 8 },
  codeLabel: { color: '#78788c', fontSize: 10, fontFamily: 'Geist_600SemiBold', letterSpacing: 1, textAlign: 'center' },
  digits: { flexDirection: 'row', gap: 8, position: 'relative' },
  digit: { flex: 1, height: 54, borderWidth: 1, borderColor: '#e0e0ea', borderRadius: 12, backgroundColor: '#f9f9fb', alignItems: 'center', justifyContent: 'center' },
  activeDigit: { borderWidth: 2, borderColor: '#6c3bff', backgroundColor: '#faf7ff' },
  digitText: { fontFamily: 'Geist_600SemiBold', fontSize: 23, color: '#111122' },
  codeInput: { ...StyleSheet.absoluteFillObject, color: 'transparent', backgroundColor: 'transparent', fontSize: 24 },
  codeHint: { color: '#78788c', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  primary: { alignSelf: 'stretch', minHeight: 50, padding: 14, borderRadius: 14, backgroundColor: '#6c3bff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  primaryText: { color: '#ffffff', fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  secondary: { padding: 8, minHeight: 44, justifyContent: 'center' },
  loading: { paddingVertical: 20, gap: 10, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  dialogError: { alignSelf: 'stretch', color: '#b01515', backgroundColor: '#fff1f1', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19 },
  success: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  successText: { color: '#15803d', fontSize: 14, fontFamily: 'Geist_500Medium' },
  action: { color: '#6c3bff', fontSize: 14, fontWeight: '600', paddingVertical: 6 },
  error: { color: '#b01515', fontSize: 13 },
});
