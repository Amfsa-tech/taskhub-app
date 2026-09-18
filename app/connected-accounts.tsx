import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/icons/google-logo';
import { getConnectedProviders, linkAppleProvider, linkGoogleProvider } from '@/lib/auth/auth-api';
import { getAppleCredential, isAppleSignInAvailable } from '@/lib/auth/apple';
import { getGoogleIdToken } from '@/lib/auth/google';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', textPrimary: '#111122', textSecondary: '#5a5a70', border: '#e0e0ea', success: '#0d6639' };

export default function ConnectedAccountsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const providersQ = useQuery({ queryKey: ['connected-providers'], queryFn: getConnectedProviders });
  const connected = new Set(providersQ.data?.providers || []);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['connected-providers'] });
  const googleMutation = useMutation({
    mutationFn: async () => linkGoogleProvider(await getGoogleIdToken({ chooseAccount: true })),
    onSuccess: async () => {
      await refresh();
      Alert.alert('Google connected', 'You can now use this Google account to sign in to both Taskhub roles.');
    },
    onError: (error) => Alert.alert('Could not connect Google', error instanceof Error ? error.message : 'Please try again.'),
  });
  const appleMutation = useMutation({
    mutationFn: async () => linkAppleProvider(await getAppleCredential()),
    onSuccess: async () => {
      await refresh();
      Alert.alert('Apple connected', 'You can now use Sign in with Apple for this Taskhub account.');
    },
    onError: (error) => {
      if ((error as { code?: string })?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Could not connect Apple', error instanceof Error ? error.message : 'Please try again.');
      }
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Connected Accounts</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.intro}>Connected sign-in methods belong to your whole Taskhub identity, including both customer and tasker roles.</Text>
        {providersQ.isLoading ? (
          <ActivityIndicator color={COLORS.brand} />
        ) : providersQ.isError ? (
          <Pressable style={styles.retry} onPress={() => providersQ.refetch()}><Text style={styles.retryText}>Try again</Text></Pressable>
        ) : (
          <View style={styles.card}>
            <View style={styles.providerRow}>
              <View style={styles.providerIdentity}>
                <View style={styles.iconTile}><GoogleLogo size={20} /></View>
                <View><Text style={styles.providerName}>Google</Text><Text style={styles.providerStatus}>{connected.has('google') ? 'Connected' : 'Not connected'}</Text></View>
              </View>
              {connected.has('google') ? <Ionicons name="checkmark-circle" size={24} color={COLORS.success} /> : (
                <Pressable style={styles.connectButton} onPress={() => googleMutation.mutate()} disabled={googleMutation.isPending}>
                  {googleMutation.isPending ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.connectText}>Connect</Text>}
                </Pressable>
              )}
            </View>
            {appleAvailable ? <View style={styles.divider} /> : null}
            {appleAvailable ? (
              <View style={styles.appleSection}>
                <View style={styles.providerIdentity}>
                  <View style={styles.iconTile}><Ionicons name="logo-apple" size={22} color="#000000" /></View>
                  <View><Text style={styles.providerName}>Apple</Text><Text style={styles.providerStatus}>{connected.has('apple') ? 'Connected' : 'Not connected'}</Text></View>
                </View>
                {connected.has('apple') ? <Ionicons name="checkmark-circle" size={24} color={COLORS.success} /> : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={() => appleMutation.mutate()}
                  />
                )}
              </View>
            ) : null}
          </View>
        )}
        <Text style={styles.note}>Taskhub never joins accounts from matching email addresses alone. Connecting a provider requires a fresh Google or Apple authentication.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 20, color: COLORS.textPrimary },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  intro: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 21, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 },
  providerRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  appleSection: { minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  providerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  iconTile: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f2f2f7', alignItems: 'center', justifyContent: 'center' },
  providerName: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.textPrimary },
  providerStatus: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border },
  connectButton: { minWidth: 82, height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  connectText: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#ffffff' },
  appleButton: { width: 140, height: 44 },
  note: { fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  retry: { height: 48, borderRadius: 12, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#ffffff' },
});
