import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/taskhub/primary-button';

const COLORS = {
  canvas: '#f9f9fb',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successGreen: '#10b981',
};

export default function ChangePasswordSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleContinue = () => {
    // Navigate back to home/dashboard
    router.replace('/home');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Success check badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={56} color="#ffffff" />
          </View>
        </View>

        {/* Text descriptions */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Password changed</Text>
          <Text style={styles.subtitle}>You can now continue to dashboard</Text>
        </View>

        {/* Continue Action */}
        <View style={styles.buttonContainer}>
          <PrimaryButton label="Continue" onPress={handleContinue} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    width: '100%',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.successGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    width: 300,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingTop: 8,
  },
});
