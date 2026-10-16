import { useMutation } from '@tanstack/react-query';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { ArrowRight } from '@/components/icons/arrow-right';
import { Check } from '@/components/icons/check';
import { Headset } from '@/components/icons/headset';
import { signupAgeError } from '@/lib/auth/age';
import { registerTasker } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { clearPendingAppleSignup, getPendingAppleSignup } from '@/lib/auth/apple';
import { clearPendingGoogleSignup, getPendingGoogleSignup } from '@/lib/auth/google';

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
  keyboardType?: 'default' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'words';
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'words',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

/**
 * Step 2 of tasker signup. `POST /api/auth/tasker-register` requires all ten
 * fields at once, so the basics ride in from /create-account as params and the
 * single register call happens here.
 */
export default function TaskerDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeAppleSignup, completeGoogleSignup, createRoleAndSwitch, user } = useAuth();
  const { firstName, lastName, email, password, country, social, linked } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    country?: string;
    social?: 'apple' | 'google';
    linked?: string;
  }>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(
    linked === 'true' && typeof user?.dateOfBirth === 'string'
      ? user.dateOfBirth.slice(0, 10)
      : '',
  );
  const [residentState, setResidentState] = useState('');
  const [city, setCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const isSocial = social === 'apple' || social === 'google';
  const isLinkedRole = linked === 'true';
  const requiresConsent = isSocial || isLinkedRole;

  const registerMutation = useMutation({
    mutationFn: async () => {
      const details = {
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        country: country || 'Nigeria',
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        residentState: residentState.trim(),
        city: city.trim(),
        originState: originState.trim(),
        address: address.trim(),
      };
      if (social === 'apple') {
        const pending = getPendingAppleSignup();
        if (!pending) throw new Error('Your Apple sign-in session expired. Please try again.');
        return completeAppleSignup({ signupToken: pending.signupToken, type: 'tasker', ...details });
      }
      if (social === 'google') {
        const pending = getPendingGoogleSignup();
        if (!pending) throw new Error('Your Google sign-in session expired. Please try again.');
        return completeGoogleSignup({ idToken: pending.idToken, type: 'tasker', ...details });
      }
      if (isLinkedRole) {
        return createRoleAndSwitch({ user_type: 'tasker', ...details });
      }
      return registerTasker({ ...details, emailAddress: email ?? '', password: password ?? '' });
    },
    onSuccess: () => {
      if (isSocial || isLinkedRole) {
        clearPendingAppleSignup();
        clearPendingGoogleSignup();
        router.replace(
          isLinkedRole
            ? { pathname: '/tasker-services', params: { onboarding: 'tasker' } }
            : '/(main)/home',
        );
        return;
      }
      router.push({
        pathname: '/otp',
        params: { email, password, type: 'tasker' },
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    },
  });

  const submit = () => {
    setError(null);
    if ((!isSocial && !isLinkedRole && (!email || !password)) || !firstName || !lastName) {
      setError('Your signup details were lost. Please go back and start again.');
      return;
    }
    if (requiresConsent && !agreed) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }
    if (
      !phoneNumber.trim() ||
      (!isLinkedRole && !dateOfBirth.trim()) ||
      !residentState.trim() ||
      !city.trim() ||
      !originState.trim() ||
      !address.trim()
    ) {
      setError('Please fill in every field.');
      return;
    }
    if (!isLinkedRole) {
      const ageError = signupAgeError(dateOfBirth);
      if (ageError) {
        setError(ageError);
        return;
      }
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
        <KeyboardAwareScrollView
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
            <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.push('/help-support')}>
              <Headset size={18} color={COLORS.textSecondary} />
              <Text style={styles.tabLabel}>Support</Text>
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Almost there</Text>
            <Text style={styles.subtitle}>
              A few more details to set up your tasker account, step 2 of 2
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Field
              label="Phone number"
              placeholder="e.g 08012345678"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            {!isLinkedRole && (
              <Field
                label="Date of birth"
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            )}
            <Field
              label="State of residence"
              placeholder="e.g Lagos"
              value={residentState}
              onChangeText={setResidentState}
            />
            <Field label="City" placeholder="e.g Ikeja" value={city} onChangeText={setCity} />
            <Field
              label="State of origin"
              placeholder="e.g Oyo"
              value={originState}
              onChangeText={setOriginState}
            />
            <Field
              label="Home address"
              placeholder="e.g 12 Allen Avenue, Ikeja"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {requiresConsent ? (
            <View style={styles.consent}>
              <Pressable
                hitSlop={8}
                onPress={() => setAgreed((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityLabel="Agree to the legal terms"
                accessibilityState={{ checked: agreed }}>
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed ? <Check size={14} color="#ffffff" /> : null}
                </View>
              </Pressable>
              <Text style={styles.consentText}>
                I agree to the{' '}
                <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/terms')}>Taskhub Terms of Service</Text>,{' '}
                <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/legal')}>User Agreement</Text>, and{' '}
                <Text style={styles.consentLink} onPress={() => void Linking.openURL('https://www.ngtaskhub.com/privacy')}>Privacy Policy</Text>.
              </Text>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={submit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <>
                <Text style={styles.buttonLabel}>Create Account</Text>
                <ArrowRight size={18} color={COLORS.onBrand} />
              </>
            )}
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
    paddingBottom: 24,
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
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.iconSecondary,
  },
  consentLink: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
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
});
