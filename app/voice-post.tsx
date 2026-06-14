import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Microphone from '@/assets/icons/microphone-white.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function VoicePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="" />

      <View style={styles.body}>
        <Text style={styles.prompt}>Describe what you need</Text>

        <View style={styles.center}>
          <LinearGradient
            colors={['#6c3bff', '#562fcc', '#412399']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.iconCircle}>
            <Microphone width={30} height={44} />
          </LinearGradient>

          <View style={styles.info}>
            <Text style={styles.title}>Voice Post</Text>
            <Text style={styles.subtitle}>Speak naturally — AI extracts every detail for you.</Text>
          </View>

          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>TRY SAYING</Text>
            <Text style={styles.exampleText}>
              &quot;Print my assignment and deliver to Zik Hall within the next hour&quot;
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label="Start Speaking" onPress={() => router.push('/voice-recording')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 29,
  },
  prompt: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  center: {
    marginTop: 33,
    alignItems: 'center',
    gap: 24,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 234,
  },
  exampleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  exampleLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  exampleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
