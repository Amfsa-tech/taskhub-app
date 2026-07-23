import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { ArrowLeft } from '@/components/icons/arrow-left';
import { ArrowRight } from '@/components/icons/arrow-right';
import { CaretDown } from '@/components/icons/caret-down';
import { Check } from '@/components/icons/check';
import { Eye } from '@/components/icons/eye';
import { Headset } from '@/components/icons/headset';
import { registerUser } from '@/lib/auth/auth-api';
import { useSelectedCountry } from '@/lib/onboarding/country';

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
};

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, isPassword && styles.inputWithToggle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {isPassword ? (
          <Pressable
            style={styles.toggle}
            hitSlop={8}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <Eye size={20} color={showPassword ? COLORS.primary : COLORS.iconSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const country = useSelectedCountry();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () =>
      registerUser({
        fullName: fullName.trim(),
        emailAddress: email.trim().toLowerCase(),
        password,
        country,
      }),
    onSuccess: (res) => {
      // In non-production the backend echoes the 5-digit code — log it so the
      // OTP screen can be tested without a real inbox.
      if (__DEV__ && res.emailToken) {
        console.log('[dev] email verification code:', res.emailToken);
      }
      router.push({
        pathname: '/otp',
        params: { email: email.trim().toLowerCase(), password, type: 'user' },
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    },
  });

  const submit = () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }
    registerMutation.mutate();
  };

  const isSubmitting = registerMutation.isPending;

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
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
              <ArrowLeft size={18} color={COLORS.textSecondary} />
              <Text style={styles.tabLabel}>Back</Text>
            </Pressable>
            <Pressable style={styles.tabButton} hitSlop={8} onPress={() => {}}>
              <Headset size={18} color={COLORS.textSecondary} />
              <Text style={styles.tabLabel}>Support</Text>
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join NGTaskHub today</Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Field
              label="Full name"
              placeholder="e.g Elliot Eniola"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Field
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Field
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Country</Text>
              <Pressable
                style={styles.select}
                onPress={() => router.push('/country-selection')}
                accessibilityRole="button"
                accessibilityLabel={`Country: ${country}. Tap to change.`}>
                <Text style={styles.selectValue}>{country}</Text>
                <CaretDown size={18} color={COLORS.iconSecondary} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={styles.consent}
            hitSlop={4}
            onPress={() => setAgreed((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? <Check size={14} color={COLORS.onBrand} /> : null}
            </View>
            <Text style={styles.consentText}>
              Yes, I understand and agree to the{' '}
              <Text style={styles.consentLink}>Taskhub Terms of Service</Text> including the{' '}
              <Text style={styles.consentLink}>User Agreement</Text> and{' '}
              <Text style={styles.consentLink}>Privacy Policy.</Text>
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              (isSubmitting || !agreed) && styles.buttonDisabled,
            ]}
            onPress={submit}
            disabled={isSubmitting || !agreed}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <>
                <Text style={styles.buttonLabel}>Create Account</Text>
                <ArrowRight size={18} color={COLORS.onBrand} />
              </>
            )}
          </Pressable>

          <Pressable hitSlop={8} onPress={() => router.replace('/login-form')} style={styles.loginRow}>
            <Text style={styles.loginMuted}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  header: {
    marginTop: 24,
    gap: 6,
  },
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
  fields: {
    marginTop: 24,
    gap: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  inputWrap: {
    justifyContent: 'center',
  },
  input: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  selectValue: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.iconSecondary,
  },
  consentLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
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
    textAlign: 'center',
  },
  loginRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginMuted: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.iconSecondary,
  },
  loginLink: {
    color: COLORS.primary,
  },
});
