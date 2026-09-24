import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { CaretDown } from '@/components/icons/caret-down';
import { Check } from '@/components/icons/check';
import { useAuth } from '@/lib/auth/auth-context';
import { clearPendingAppleSignup, getPendingAppleSignup } from '@/lib/auth/apple';
import { clearPendingGoogleSignup, getPendingGoogleSignup } from '@/lib/auth/google';
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

export default function GoogleCompleteSignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeAppleSignup, completeGoogleSignup } = useAuth();
  const country = useSelectedCountry();

  // Captured once — set by the login screen before navigating here.
  const [pendingGoogle] = useState(getPendingGoogleSignup);
  const [pendingApple] = useState(getPendingAppleSignup);
  const pending = pendingApple ?? pendingGoogle;
  const providerName = pendingApple ? 'Apple' : 'Google';
  const [fullName, setFullName] = useState(pending?.profile.name ?? '');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: () => {
      if (pendingApple?.signupToken) {
        return completeAppleSignup({
          signupToken: pendingApple.signupToken,
          type: 'user',
          fullName: fullName.trim(),
          country,
        });
      }
      if (!pendingGoogle?.idToken) throw new Error('Your social sign-in session expired. Please try again.');
      return completeGoogleSignup({
        idToken: pendingGoogle.idToken,
        type: 'user',
        fullName: fullName.trim(),
        country,
      });
    },
    onSuccess: () => {
      clearPendingGoogleSignup();
      clearPendingAppleSignup();
      router.replace('/purpose-selection');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not complete sign up. Please try again.');
    },
  });

  const submit = () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }
    completeMutation.mutate();
  };

  const isSubmitting = completeMutation.isPending;

  // Defensive: reached without a pending Google session (e.g. deep link / reload).
  if (!pending) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.replace('/login')}>
            <ArrowLeft size={18} color={COLORS.textSecondary} />
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Session expired</Text>
          <Text style={styles.subtitle}>
            Please tap “Continue with {providerName}” again to finish creating your account.
          </Text>
        </View>
      </View>
    );
  }

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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter Name</Text>
            <Text style={styles.subtitle}>Enter your full name to complete sign up</Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g Elliot Eniola"
                placeholderTextColor={COLORS.placeholder}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

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
          <View style={styles.consent}>
            <Pressable
              hitSlop={8}
              onPress={() => setAgreed((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityLabel="Agree to the legal terms"
              accessibilityState={{ checked: agreed }}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <Check size={14} color={COLORS.onBrand} /> : null}
              </View>
            </Pressable>
            <Text style={styles.consentText}>
              Yes, I understand and agree to the{' '}
              <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/terms')}>Taskhub Terms of Service</Text> including the{' '}
              <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/legal')}>User Agreement</Text> and{' '}
              <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/privacy')}>Privacy Policy.</Text>
            </Text>
          </View>

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
              <Text style={styles.buttonLabel}>Complete sign up</Text>
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
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
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
  fields: { marginTop: 24, gap: 16 },
  field: { gap: 4 },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
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
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
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
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.9 },
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
