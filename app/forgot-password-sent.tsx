import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';

const COLORS = {
  canvas: '#f9f9fb',
  successBg: '#edfaf3',
  successBorder: '#a3eacc',
  successText: '#0d6639',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function ForgotPasswordSentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const target = email && email.length > 0 ? email : 'ellioteniolasamuel@gmail.com';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Back */}
        <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Back</Text>
        </Pressable>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address we will send you a reset link
          </Text>
        </View>

        {/* Confirmation card — tap to simulate opening the reset link */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/create-new-password')}>
          <Text style={styles.cardTitle}>Check your Email</Text>
          <Text style={styles.cardMessage}>
            A reset Link was sent to <Text style={styles.cardEmail}>{target}</Text>
          </Text>
        </Pressable>

        {/* Back to login */}
        <Pressable
          style={styles.backToLogin}
          hitSlop={8}
          onPress={() => router.replace('/login-form')}>
          <ArrowLeft size={18} color={COLORS.textSecondary} />
          <Text style={styles.backToLoginLabel}>Back to Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 24 },
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
  heading: { gap: 6 },
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
  card: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  cardPressed: { opacity: 0.9 },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.successText,
  },
  cardMessage: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.successText,
  },
  cardEmail: {
    fontFamily: 'Geist_600SemiBold',
  },
  backToLogin: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
