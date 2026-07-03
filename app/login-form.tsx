import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { ArrowLeft } from '@/components/icons/arrow-left';
import { Eye } from '@/components/icons/eye';
import { GoogleLogo } from '@/components/icons/google-logo';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

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
  black: '#000000',
  googleText: '#404040',
};

export default function LoginFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: () =>
      signIn('user', { emailAddress: email.trim().toLowerCase(), password }),
    onSuccess: () => router.replace('/home'),
    onError: (err) => {
      if (err instanceof ApiError && err.emailVerificationRequired) {
        // Account exists but isn't verified — route to the OTP screen.
        router.push({ pathname: '/otp', params: { email: email.trim().toLowerCase() } });
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    },
  });

  const submit = () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    loginMutation.mutate();
  };

  const socialUnavailable = () =>
    Alert.alert('Coming soon', 'Social sign-in is not available yet.');

  const isSubmitting = loginMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Back */}
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>

          {/* Welcome */}
          <View style={styles.welcome}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputs}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.input}>
                <TextInput
                  style={styles.inputText}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.input}>
                <TextInput
                  style={[styles.inputText, styles.flex]}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable hitSlop={8} onPress={() => setShowPassword((s) => !s)}>
                  <Eye size={20} color={COLORS.iconSecondary} />
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable hitSlop={8} onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Login */}
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
              <Text style={styles.buttonLabel}>Login</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          {/* Social */}
          <View style={styles.social}>
            <Pressable
              style={({ pressed }) => [styles.socialButton, styles.googleButton, pressed && styles.pressed]}
              onPress={socialUnavailable}>
              <GoogleLogo size={20} />
              <Text style={styles.googleLabel}>Continue with Google</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.socialButton, styles.appleButton, pressed && styles.pressed]}
              onPress={socialUnavailable}>
              <Ionicons name="logo-apple" size={20} color={COLORS.onBrand} />
              <Text style={styles.appleLabel}>Continue with Apple</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable hitSlop={8} onPress={() => router.replace('/create-account')} style={styles.altRow}>
            <Text style={styles.altMuted}>
              Don’t have an account? <Text style={styles.altLink}>Create account</Text>
            </Text>
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
  welcome: { marginTop: 24, gap: 6 },
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
  inputs: { marginTop: 24, gap: 16 },
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
  forgot: {
    marginTop: 8,
    textAlign: 'right',
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.primary,
  },
  error: {
    marginTop: 12,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#dc2626',
  },
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.9 },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  divider: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.black,
  },
  social: { marginTop: 16, gap: 12 },
  socialButton: {
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.googleText,
  },
  appleButton: { backgroundColor: COLORS.black },
  appleLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  altRow: { height: 48, alignItems: 'center', justifyContent: 'center' },
  altMuted: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  altLink: { color: COLORS.primary },
});
