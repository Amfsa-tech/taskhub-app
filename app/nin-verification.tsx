import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDuplicateIdentity, verificationRetryBlocked, verificationMessage } from '@/lib/verification-status';
import { SupportContactButton } from '@/components/taskhub/support-contact';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { createDiditKycSession, getKycStatus, type KycStatusResponse } from '@/lib/api/kyc';
import { queryKeys, useKycStatus, useVerificationStatus } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { pollVerificationResult, VERIFICATION_CHECKING_MESSAGE, VERIFICATION_PROCESSING_MESSAGE } from '@/lib/verification-result';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  success: '#12b76a',
  warning: '#b45309',
  error: '#dc2626',
  placeholder: '#a0a0ba',
};

/** Hosted capture submits identity; only the authenticated backend decides KYC. */
export default function NinVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accountType, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const accountQ = useVerificationStatus();
  const recordQ = useKycStatus();
  const refetchAccount = accountQ.refetch;
  const refetchRecord = recordQ.refetch;
  const mountedRef = useRef(false);
  const pollCleanupRef = useRef<(() => void) | null>(null);
  const browserPendingRef = useRef(false);
  const browserBackgroundedRef = useRef(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [resultPhase, setResultPhase] = useState<'idle' | 'checking' | 'processing'>('idle');

  const record = recordQ.data?.data;
  const decision = record;
  const duplicate = isDuplicateIdentity(decision) || decision?.isFraudFlagged === true;
  const retryBlocked = verificationRetryBlocked(decision);
  // The provider record is authoritative; a stale account flag cannot override it.
  const isVerified = !duplicate && record?.status === 'approved' && record.isVerified === true;
  const rejectionReasons = record?.rejectionReasons ?? [];
  const isRejected = record?.status === 'rejected';
  const isPending = !duplicate && record?.status === 'under_review';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      browserPendingRef.current = false;
      pollCleanupRef.current?.();
    };
  }, []);

  const checkResult = useCallback(() => {
    if (!mountedRef.current) return;
    pollCleanupRef.current?.();
    setBrowserOpen(false);
    setResultPhase('checking');
    pollCleanupRef.current = pollVerificationResult({
      fetchStatus: async (signal) => (await getKycStatus(signal)).data,
      onStatus: (status) => {
        queryClient.setQueryData<KycStatusResponse>(queryKeys.kycStatus(), (old) => ({ ...old, success: true, data: status }));
      },
      onSettled: (status) => {
        if (!mountedRef.current) return;
        setResultPhase(status ? 'idle' : 'processing');
        if (status?.status === 'approved' && status.isVerified) void refreshProfile().catch(() => {});
      },
    });
  }, [queryClient, refreshProfile]);

  const refresh = () => {
    if (resultPhase !== 'idle') checkResult();
    else { void refetchRecord(); void refetchAccount(); }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        if (browserPendingRef.current) browserBackgroundedRef.current = true;
      } else if (browserPendingRef.current && browserBackgroundedRef.current) {
        // Android's browser promise resolves on OPEN, so wait for app return.
        browserPendingRef.current = false;
        checkResult();
      } else if (!browserPendingRef.current) {
        void refetchRecord();
        void refetchAccount();
      }
    });
    return () => subscription.remove();
  }, [checkResult, refetchAccount, refetchRecord]);

  const canStart = accountType === 'tasker' && !isVerified && !retryBlocked
    && resultPhase === 'idle' && !browserOpen && !recordQ.isLoading && !recordQ.isError;

  const startMutation = useMutation({
    mutationFn: async () => {
      const latest = await refetchRecord();
      if (latest.error) throw latest.error;
      if (!latest.data) throw new Error('Could not check verification status. Please try again.');
      if (verificationRetryBlocked(latest.data.data)) throw new Error(verificationMessage(latest.data.data));
      return createDiditKycSession();
    },
    onSuccess: async (res) => {
      if (!mountedRef.current) return;
      if (!res.data.url) {
        Alert.alert('Verification is preparing', 'Please try again shortly.');
        return;
      }
      browserPendingRef.current = true;
      browserBackgroundedRef.current = false;
      setBrowserOpen(true);
      try {
        const result = await WebBrowser.openBrowserAsync(res.data.url);
        if (mountedRef.current && result.type !== 'opened' && browserPendingRef.current) {
          browserPendingRef.current = false;
          checkResult();
        }
      } catch (error) {
        browserPendingRef.current = false;
        if (mountedRef.current) setBrowserOpen(false);
        throw error;
      }
    },
    onError: (err) =>
      Alert.alert('Could not start verification', err instanceof Error ? err.message : 'Please try again later.'),
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Identity Verification" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {resultPhase !== 'idle' ? (
          <View style={styles.formContainer}>
            {resultPhase === 'checking' && <ActivityIndicator color={COLORS.brand} />}
            <Text accessibilityLiveRegion="polite" style={styles.instructions}>
              {resultPhase === 'checking' ? VERIFICATION_CHECKING_MESSAGE : VERIFICATION_PROCESSING_MESSAGE}
            </Text>
            {resultPhase === 'processing' && <Pressable style={styles.btnSecondary} onPress={refresh}><Text style={styles.btnSecondaryText}>Refresh status</Text></Pressable>}
          </View>
        ) : duplicate ? (
          <View style={styles.formContainer}>
            <Text accessibilityRole="alert" style={styles.errorText}>{verificationMessage(decision)}</Text>
            <SupportContactButton issue={{ action: 'verification', explanation: verificationMessage(decision) }} />
            {canStart && <Pressable style={styles.btn} disabled={startMutation.isPending} onPress={() => startMutation.mutate()}><Text style={styles.btnText}>Try again</Text></Pressable>}
            <Pressable style={styles.btnSecondary} onPress={refresh}><Text style={styles.btnSecondaryText}>Refresh status</Text></Pressable>
          </View>
        ) : recordQ.isLoading ? (
          <View style={styles.successContainer}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : recordQ.isError ? (
          <View style={styles.formContainer}>
            <Text style={styles.instructions}>Could not check your verification status. Please try again.</Text>
            <Pressable style={styles.btn} onPress={refresh}><Text style={styles.btnText}>Retry status check</Text></Pressable>
          </View>
        ) : isVerified ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Identity Verified</Text>
            <Text style={styles.successDescription}>
              Your identity has been verified{record?.maskedNin ? ` (NIN ${record.maskedNin})` : ''}.
              Your profile badge is active.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => router.replace('/settings')}>
              <Text style={styles.btnText}>Back to Settings</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.inputLabel}>CURRENT STATUS</Text>
              <Text
                style={[
                  styles.statusValue,
                  isRejected && { color: COLORS.error },
                  isPending && { color: COLORS.warning },
                ]}>
                {isRejected ? 'Rejected' : isPending ? 'Your verification is under review' : record?.status === 'in_progress' || record?.status === 'pending' ? 'Processing' : 'Not verified'}
              </Text>

              {isRejected && <Text accessibilityRole="alert" style={styles.errorText}>{verificationMessage(decision)}</Text>}
              {isRejected && rejectionReasons.length > 0 ? (
                <View style={styles.reasonList}>
                  {rejectionReasons.map((reason) => (
                    <Text key={reason} style={styles.reasonText}>
                      • {reason}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={styles.instructions}>
              {isPending
                ? 'Your documents are being reviewed. This usually takes a few minutes — check back shortly.'
                : 'Identity verification is a secure ID and selfie capture handled by our verification partner. It opens in your browser and takes about two minutes.'}
            </Text>

            {isRejected && <SupportContactButton issue={{ action: 'verification', explanation: verificationMessage(decision) }} />}
            {canStart ? (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  startMutation.isPending && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                disabled={startMutation.isPending}
                onPress={() => startMutation.mutate()}>
                {startMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.btnText}>
                    {isRejected ? 'Try again' : 'Start verification'}
                  </Text>
                )}
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                canStart ? styles.btnSecondary : styles.btn,
                (accountQ.isRefetching || recordQ.isRefetching) && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              disabled={accountQ.isRefetching || recordQ.isRefetching}
              onPress={refresh}>
              {accountQ.isRefetching || recordQ.isRefetching ? (
                <ActivityIndicator color={canStart ? COLORS.brand : '#ffffff'} size="small" />
              ) : (
                <Text style={canStart ? styles.btnSecondaryText : styles.btnText}>
                  Refresh status
                </Text>
              )}
            </Pressable>
          </View>
        )}
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  formContainer: {
    gap: 24,
  },
  instructions: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  input: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.canvas,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  statusValue: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  reasonList: {
    marginTop: 10,
    gap: 4,
  },
  reasonText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#ef4444',
  },
  btn: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.brand,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.brand,
  },
  btnDisabled: {
    backgroundColor: '#cbcbda',
  },
  btnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
  },
  successIconBox: {
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  successDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
