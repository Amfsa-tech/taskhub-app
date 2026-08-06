import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Headset } from '@/components/icons/headset';
import { registerTasker } from '@/lib/auth/auth-api';

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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function ageOf(isoDate: string): number {
  const dob = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

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
  const { firstName, lastName, email, password, country } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    country?: string;
  }>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [residentState, setResidentState] = useState('');
  const [originState, setOriginState] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () =>
      registerTasker({
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        emailAddress: email ?? '',
        password: password ?? '',
        country: country || 'Nigeria',
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        residentState: residentState.trim(),
        originState: originState.trim(),
        address: address.trim(),
      }),
    onSuccess: (res) => {
      if (__DEV__ && res.emailToken) {
        console.log('[dev] email verification code:', res.emailToken);
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
    if (!email || !password || !firstName || !lastName) {
      setError('Your signup details were lost. Please go back and start again.');
      return;
    }
    if (
      !phoneNumber.trim() ||
      !dateOfBirth.trim() ||
      !residentState.trim() ||
      !originState.trim() ||
      !address.trim()
    ) {
      setError('Please fill in every field.');
      return;
    }
    if (!DATE_PATTERN.test(dateOfBirth.trim()) || Number.isNaN(Date.parse(dateOfBirth.trim()))) {
      setError('Enter your date of birth as YYYY-MM-DD, e.g 2002-04-15.');
      return;
    }
    if (ageOf(dateOfBirth.trim()) < 16) {
      setError('You must be at least 16 years old to register on TaskHub.');
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
            <Text style={styles.title}>Almost there</Text>
            <Text style={styles.subtitle}>
              A few more details to set up your tasker account — step 2 of 2
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
            <Field
              label="Date of birth"
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />
            <Field
              label="State of residence"
              placeholder="e.g Lagos"
              value={residentState}
              onChangeText={setResidentState}
            />
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
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
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
