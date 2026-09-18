import { useMutation } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
import { isAppleSignInAvailable, setPendingAppleSignup } from '@/lib/auth/apple';
import { setPendingGoogleSignup } from '@/lib/auth/google';

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
  const { type } = useLocalSearchParams<{ type?: string }>();
  // Carried from the purpose/login screens; picks between the user and tasker
  // backend endpoints (same payload either way).
  const accountType = type === 'tasker' ? 'tasker' : 'user';
  const { signIn, signInWithApple, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const loginMutation = useMutation({
    mutationFn: () =>
      signIn(accountType, { emailAddress: email.trim().toLowerCase(), password }),
    onSuccess: () => router.replace('/home'),
    onError: (err) => {
      if (err instanceof ApiError && err.emailVerificationRequired) {
        // Account exists but isn't verified — route to the OTP screen, carrying
        // the password so verification can log the user straight in.
        router.push({
          pathname: '/otp',
          params: { email: email.trim().toLowerCase(), password, type: accountType },
        });
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

  const handleGoogle = async () => {
    if (googleBusy) return;
    setError(null);
    setGoogleBusy(true);
    try {
      const outcome = await signInWithGoogle(accountType);
      if (outcome.kind === 'signed-in') {
        if (outcome.roleFallback) {
          Alert.alert('Role not created yet', `Your ${accountType} role is not set up, so Taskhub opened your ${outcome.accountType} role.`);
        }
        router.replace('/home');
      } else if (accountType === 'tasker') {
        setPendingGoogleSignup({ idToken: outcome.idToken, profile: outcome.profile });
        router.push({
          pathname: '/tasker-details' as any,
          params: { social: 'google', firstName: outcome.profile.givenName, lastName: outcome.profile.familyName, email: outcome.profile.email, country: 'Nigeria' },
        });
      } else {
        // No account yet — carry the verified token to the completion screen.
        setPendingGoogleSignup({ idToken: outcome.idToken, profile: outcome.profile });
        router.push('/google-complete-signup');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'SIGN_IN_CANCELLED' || code === '-5') {
        // User dismissed the Google chooser — no-op.
      } else {
        setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleApple = async () => {
    if (appleBusy) return;
    setError(null);
    setAppleBusy(true);
    try {
      const outcome = await signInWithApple(accountType);
      if (outcome.kind === 'signed-in') {
        if (outcome.roleFallback) {
          Alert.alert('Role not created yet', `Your ${accountType} role is not set up, so Taskhub opened your ${outcome.accountType} role.`);
        }
        router.replace('/home');
      } else if (accountType === 'tasker') {
        setPendingAppleSignup({ signupToken: outcome.signupToken, profile: outcome.profile });
        router.push({
          pathname: '/tasker-details' as any,
          params: { social: 'apple', firstName: outcome.profile.givenName, lastName: outcome.profile.familyName, email: outcome.profile.email, country: 'Nigeria' },
        });
      } else {
        setPendingAppleSignup({ signupToken: outcome.signupToken, profile: outcome.profile });
        router.push('/google-complete-signup');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(err instanceof Error ? err.message : 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setAppleBusy(false);
    }
  };

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
            <Text style={styles.subtitle}>
              {accountType === 'tasker' ? 'Sign in to your tasker account' : 'Sign in to your account'}
            </Text>
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

          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/forgot-password', params: { type: accountType } })}>
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
              style={({ pressed }) => [
                styles.socialButton,
                styles.googleButton,
                (pressed || googleBusy) && styles.pressed,
              ]}
              onPress={handleGoogle}
              disabled={googleBusy}>
              {googleBusy ? (
                <ActivityIndicator color={COLORS.googleText} />
              ) : (
                <>
                  <GoogleLogo size={20} />
                  <Text style={styles.googleLabel}>Continue with Google</Text>
                </>
              )}
            </Pressable>
            {appleAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleApple}
                accessibilityLabel={appleBusy ? 'Signing in with Apple' : 'Continue with Apple'}
              />
            ) : null}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            hitSlop={8}
            onPress={() => router.replace({ pathname: '/create-account', params: { type: accountType } })}
            style={styles.altRow}>
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
  appleButton: { width: '100%', height: 48 },
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
