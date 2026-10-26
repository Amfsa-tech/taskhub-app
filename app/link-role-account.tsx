import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useAuth } from '@/lib/auth/auth-context';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', textPrimary: '#111122', textSecondary: '#5a5a70', border: '#e0e0ea' };

export default function LinkRoleAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountType, linkRoleAndSwitch, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [targetRole] = useState(() => accountType === 'user' ? 'tasker' : 'user');
  const target = targetRole === 'tasker' ? 'tasker' : 'customer';
  const needsProfileRetry = accountType === targetRole;
  useEffect(() => { if (needsProfileRetry) setPassword(''); }, [needsProfileRetry]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (needsProfileRetry) { await refreshProfile(); return; }
      await linkRoleAndSwitch(email, password);
      setPassword('');
    },
    onSuccess: () => router.replace('/(main)/home'),
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not link the account.'),
  });

  const submit = () => {
    setError(null);
    if (!needsProfileRetry && (!email.trim() || !password)) {
      setError('Enter the email and password for your existing account.');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScreenHeader title={`Link ${target} account`} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>Sign in to your existing {target} profile. Taskhub will verify both profiles, join them under one identity, and switch to it.</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} editable={!mutation.isPending && !needsProfileRetry} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="name@example.com" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} editable={!mutation.isPending && !needsProfileRetry} secureTextEntry autoCapitalize="none" autoComplete="current-password" placeholder="Password" />
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed, mutation.isPending && styles.disabled]} onPress={submit} disabled={mutation.isPending}>
          {mutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{needsProfileRetry ? 'Retry loading profile' : 'Verify, link and switch'}</Text>}
        </Pressable>
        <Text style={styles.note}>For security, email matching alone never links profiles. Social-only profiles already using the same connected Google or Apple identity are linked automatically by provider identity.</Text>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  description: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 21, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontFamily: 'Geist_600SemiBold', fontSize: 12, color: COLORS.textSecondary },
  input: { height: 48, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, fontFamily: 'Geist_500Medium', fontSize: 16, color: COLORS.textPrimary },
  error: { fontFamily: 'Geist_500Medium', fontSize: 14, color: '#b01515' },
  button: { height: 48, borderRadius: 12, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#ffffff' },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  note: { fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
});
