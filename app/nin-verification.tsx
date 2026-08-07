import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { createDiditKycSession } from '@/lib/api/kyc';
import { useKycStatus, useVerificationStatus } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';

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

/**
 * Identity verification via Didit's hosted flow.
 *
 * "Start verification" asks the backend for a Didit session and opens the
 * returned URL in an in-app browser, where Didit does the ID + selfie capture.
 * The decision reaches the backend via webhook, so the screen refreshes status
 * when the browser closes (approval can lag the webhook by a moment — the
 * Refresh button covers that). No NIN is ever collected in our own UI, and no
 * vendor SDK is needed. See `lib/api/kyc.ts`.
 */
export default function NinVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accountType } = useAuth();

  // Account flag — provider-agnostic, the real answer to "am I verified?".
  const accountQ = useVerificationStatus();
  // Didit record detail — rejection reasons and masked NIN, when present.
  const recordQ = useKycStatus();

  const isVerified = accountQ.data?.data.isVerified === true;
  const record = recordQ.data?.data;
  const rejectionReasons = record?.rejectionReasons ?? [];
  const isRejected = record?.status === 'rejected';
  const isPending = record?.status === 'pending';

  const refresh = () => {
    accountQ.refetch();
    recordQ.refetch();
  };

  // The backend only issues sessions to taskers (identity verification is a
  // tasker requirement), so the start button is tasker-only too.
  const canStart = accountType === 'tasker' && !isVerified && !isPending;

  const startMutation = useMutation({
    mutationFn: () => createDiditKycSession(),
    onSuccess: async (res) => {
      // Didit's hosted flow does the ID + selfie capture in the browser; the
      // decision reaches the backend via webhook, so refresh when they return.
      await WebBrowser.openBrowserAsync(res.data.url);
      refresh();
    },
    onError: (err) =>
      Alert.alert(
        'Could not start verification',
        err instanceof Error ? err.message : 'Please try again later.',
      ),
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Identity Verification" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {accountQ.isLoading ? (
          <View style={styles.successContainer}>
            <ActivityIndicator color={COLORS.brand} />
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
                {isRejected ? 'Rejected' : isPending ? 'In review' : 'Not verified'}
              </Text>

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
