import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { ApiError } from '@/lib/api/client';
import { deleteAccount } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { getGoogleIdToken } from '@/lib/auth/google';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', text: '#111122', secondary: '#5a5a70', border: '#e0e0ea', danger: '#b01515' };
type Blocker = { code: string; message: string };

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        return await deleteAccount({ confirmation: 'DELETE', ...(password ? { password } : {}) });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'google_reauth_required') {
          const idToken = await getGoogleIdToken();
          return deleteAccount({ confirmation: 'DELETE', idToken });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await signOut();
      router.replace('/login');
    },
    onError: (error) => {
      const body = error instanceof ApiError ? error.body as { blockers?: Blocker[] } : undefined;
      setBlockers(body?.blockers || []);
      Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const confirmed = confirmation.trim().toUpperCase() === 'DELETE';
  const confirmDeletion = () => Alert.alert(
    'Permanently delete your account?',
    'This deletes both your client and tasker profiles, signs out every device, and cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete forever', style: 'destructive', onPress: () => mutation.mutate() },
    ],
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delete Account" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.warning}>
          <Text style={styles.title}>This permanently deletes Taskhub Connect</Text>
          <Text style={styles.body}>Your linked client and tasker roles are deleted together. Personal data, sessions, messages, KYC details, payout accounts, and uploaded media are removed. De-identified records required for completed payments may be retained.</Text>
        </View>
        <View style={styles.guardCard}>
          <Text style={styles.guardTitle}>Before you can delete</Text>
          <Text style={styles.body}>Your wallet must be empty and you cannot have active tasks, held escrow, pending withdrawals, or open disputes.</Text>
        </View>
        {blockers.length > 0 && (
          <View style={styles.blockers}>
            <Text style={styles.blockerTitle}>Items to resolve</Text>
            {blockers.map((blocker) => <Text key={blocker.code} style={styles.blockerText}>• {blocker.message}</Text>)}
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter your password, if you use one" placeholderTextColor="#a0a0ba" style={styles.input} autoCapitalize="none" />
          <Text style={styles.helper}>Google-only accounts will be asked to sign in with Google again.</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>TYPE DELETE TO CONFIRM</Text>
          <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="DELETE" placeholderTextColor="#a0a0ba" style={styles.input} autoCapitalize="characters" />
        </View>
        <Pressable style={({ pressed }) => [styles.button, (!confirmed || mutation.isPending) && styles.disabled, pressed && confirmed && styles.pressed]} disabled={!confirmed || mutation.isPending} onPress={confirmDeletion}>
          {mutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Permanently delete account</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 16, gap: 20 },
  warning: { backgroundColor: '#fff1f1', borderRadius: 16, padding: 16, gap: 6 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 17, color: COLORS.danger },
  body: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 21, color: COLORS.secondary },
  guardCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 6 },
  guardTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: COLORS.text },
  blockers: { backgroundColor: '#fff8e7', borderRadius: 16, padding: 16, gap: 6 },
  blockerTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#774d00' },
  blockerText: { fontFamily: 'Geist_400Regular', fontSize: 14, lineHeight: 20, color: '#774d00' },
  field: { gap: 8 },
  label: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: COLORS.secondary },
  input: { height: 48, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, fontFamily: 'Geist_500Medium', fontSize: 16, color: COLORS.text },
  helper: { fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 18, color: COLORS.secondary },
  button: { height: 48, borderRadius: 12, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9 },
  buttonText: { fontFamily: 'Geist_600SemiBold', fontSize: 17, color: '#ffffff' },
});
