import { Ionicons } from '@expo/vector-icons';
import { maskEmail } from '@/lib/mask-email';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { Eye } from '@/components/icons/eye';
import { ApiError } from '@/lib/api/client';
import { resetPassword } from '@/lib/auth/auth-api';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  iconSecondary: '#78788c',
  onBrand: '#ffffff',
  successBg: '#edfaf3',
  successBorder: '#a3eacc',
  successText: '#0d6639',
};

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

function PasswordField({ label, placeholder, value, onChangeText }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.input}>
        <TextInput
          style={[styles.inputText, styles.flex]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable hitSlop={8} onPress={() => setShow((s) => !s)}>
          <Eye size={20} color={COLORS.iconSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function CreateNewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, type } = useLocalSearchParams<{ email?: string; type?: string }>();
  const accountType = type === 'tasker' ? 'tasker' : 'user';
  const [code, setCode] = useState('');
  const [emailVisible, setEmailVisible] = useState(false);
  useEffect(() => setEmailVisible(false), [email]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsNewCode, setNeedsNewCode] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!email) throw new Error('Missing email address. Please start again.');
      return resetPassword({
        code: code.trim(),
        newPassword: password,
        emailAddress: email,
        type: accountType,
      });
    },
    onSuccess: () => router.replace('/reset-success'),
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not reset password. Please try again.');
      setNeedsNewCode(err instanceof ApiError && ['TOO_MANY_ATTEMPTS', 'CODE_EXPIRED'].includes(err.code ?? ''));
    },
  });

  const submit = () => {
    if (needsNewCode) {
      router.replace({ pathname: '/forgot-password', params: { type: accountType } });
      return;
    }
    setError(null);
    if (!/^\d{5}$/.test(code.trim())) {
      setError('Enter the reset code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    resetMutation.mutate();
  };

  const isSubmitting = resetMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Back */}
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Password</Text>
            <Text style={styles.subtitle}>
              Enter the reset code we emailed you and choose a new password
            </Text>
          </View>

          {/* Confirmation that the code was sent */}
          {email ? (
            <View style={styles.banner}>
              <Pressable accessibilityRole="button" accessibilityLabel={emailVisible ? 'Hide email address' : 'Show email address'} hitSlop={8} onPress={() => setEmailVisible((value) => !value)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                <Ionicons name={emailVisible ? 'eye-off-outline' : 'eye-outline'} size={19} color="#6c3bff" />
              </Pressable>
              <Text style={styles.bannerText}>
                A reset code was sent to <Text style={styles.bannerEmail}>{emailVisible ? email : maskEmail(email)}</Text>. Check your
                inbox (and spam), then enter it below.
              </Text>
            </View>
          ) : null}

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Reset code</Text>
              <View style={styles.input}>
                <TextInput
                  style={[styles.inputText, styles.flex]}
                  placeholder="Enter the code from your email"
                  placeholderTextColor={COLORS.placeholder}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <PasswordField
              label="New password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
            />
            <PasswordField
              label="Confirm password"
              placeholder="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={submit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <Text style={styles.buttonLabel}>{needsNewCode ? 'Request a new code' : 'Reset Password'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 14 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    alignSelf: 'flex-start',
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  header: { marginTop: 24, gap: 6 },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  banner: {
    marginTop: 20,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.successText,
  },
  bannerEmail: { fontFamily: 'Geist_600SemiBold' },
  fields: { marginTop: 24, gap: 16 },
  field: { gap: 4 },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  error: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#dc2626',
  },
});
