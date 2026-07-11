import { Ionicons } from '@expo/vector-icons';
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

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  success: '#12b76a',
  placeholder: '#a0a0ba',
};

export default function NinVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (nin.length !== 11 || !/^\d+$/.test(nin)) {
      setError('NIN must be exactly 11 digits');
      return;
    }

    setError('');
    setLoading(true);

    // Simulate verification delay
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScreenHeader title="NIN Verification" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {verified ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Verification Successful</Text>
            <Text style={styles.successDescription}>
              Your National Identification Number has been verified successfully. Your profile badge will update shortly.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => router.replace('/settings')}>
              <Text style={styles.btnText}>Back to Settings</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.instructions}>
              Enter your 11-digit National Identification Number (NIN) to verify your account identity.
            </Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>NATIONAL IDENTIFICATION NUMBER (NIN)</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={nin}
                onChangeText={(text) => {
                  setNin(text.replace(/[^\d]/g, ''));
                  setError('');
                }}
                placeholder="Enter 11 digits"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric"
                maxLength={11}
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                (nin.length !== 11 || loading) && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              disabled={nin.length !== 11 || loading}
              onPress={handleVerify}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.btnText}>Verify NIN</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  formContainer: {
    gap: 24,
  },
  instructions: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  input: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.canvas,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#ef4444',
  },
  btn: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    backgroundColor: '#cbcbda',
  },
  btnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
  },
  successIconBox: {
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  successDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
