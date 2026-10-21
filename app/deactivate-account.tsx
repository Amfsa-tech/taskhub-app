import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { ApiError } from '@/lib/api/client';
import { deleteAccount } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { getGoogleIdToken } from '@/lib/auth/google';
import { getAppleCredential } from '@/lib/auth/apple';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', text: '#111122', secondary: '#5a5a70', border: '#e0e0ea', danger: '#b01515' };
type Blocker = { code: string; message: string };

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [dialog, setDialog] = useState<{ kind: 'confirm' | 'error'; message: string } | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        return await deleteAccount({ confirmation: 'DELETE', ...(password ? { password } : {}) });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'google_reauth_required') {
          const idToken = await getGoogleIdToken();
          return deleteAccount({ confirmation: 'DELETE', idToken });
        }
        if (error instanceof ApiError && error.code === 'apple_reauth_required') {
          const credential = await getAppleCredential();
          return deleteAccount({
            confirmation: 'DELETE',
            appleIdentityToken: credential.identityToken,
            appleNonce: credential.nonce,
          });
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
      setDialog({ kind: 'error', message: error instanceof Error ? error.message : 'Please try again.' });
    },
  });

  const confirmed = confirmation.trim().toUpperCase() === 'DELETE';
  const confirmDeletion = () => setDialog({
    kind: 'confirm',
    message: 'This deletes both your client and tasker profiles, signs out every device, and cannot be undone.',
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delete Account" />
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
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
          <Text style={styles.helper}>Accounts without a password will be asked to sign in with their connected Google or Apple account again.</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>TYPE DELETE TO CONFIRM</Text>
          <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="DELETE" placeholderTextColor="#a0a0ba" style={styles.input} autoCapitalize="characters" />
        </View>
        <Pressable style={({ pressed }) => [styles.button, (!confirmed || mutation.isPending) && styles.disabled, pressed && confirmed && styles.pressed]} disabled={!confirmed || mutation.isPending} onPress={confirmDeletion}>
          {mutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Permanently delete account</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
      <Modal transparent visible={dialog !== null} animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard} accessibilityViewIsModal>
            <Text style={styles.dialogTitle}>{dialog?.kind === 'confirm' ? 'Permanently delete your account?' : 'Could not delete account'}</Text>
            <Text style={styles.body}>{dialog?.message}</Text>
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancel} onPress={() => setDialog(null)} accessibilityRole="button">
                <Text style={styles.dialogCancelText}>{dialog?.kind === 'confirm' ? 'Cancel' : 'Close'}</Text>
              </Pressable>
              {dialog?.kind === 'confirm' && (
                <Pressable style={styles.dialogDelete} onPress={() => { setDialog(null); mutation.mutate(); }} accessibilityRole="button">
                  <Text style={styles.buttonText}>Delete forever</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(17,17,34,0.55)', justifyContent: 'center', padding: 24 },
  dialogCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, gap: 16 },
  dialogTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 20, color: COLORS.text },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  dialogCancel: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  dialogCancelText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.text },
  dialogDelete: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.danger },
});
