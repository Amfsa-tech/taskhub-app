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
  brand: '#6c3bff',
  dark: '#111122',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

// Static waveform bar heights to mimic the Figma waveform graphic.
const WAVEFORM = [10, 18, 26, 14, 32, 22, 36, 20, 30, 16, 24, 12, 28, 18, 10];

export default function VoiceRecordingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="" />

      <View style={styles.body}>
        <Text style={styles.prompt}>Listening...</Text>

        <View style={styles.center}>
          <LinearGradient
            colors={['#6c3bff', '#562fcc', '#412399']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.iconCircle}>
            <Microphone width={30} height={44} />
          </LinearGradient>

          <View style={styles.waveBlock}>
            <Text style={styles.timer}>00:31</Text>
            <View style={styles.waveform}>
              {WAVEFORM.map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>
          </View>

          <View style={styles.promptCard}>
            <Text style={styles.promptText}>
              &quot;Print my assignment and deliver to Zik Hall within the next hour&quot;
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Stop Recording"
          style={styles.stopButton}
          leftIcon={<View style={styles.stopIcon} />}
          onPress={() => router.push('/voice-understanding')}
        />
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
  waveBlock: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  timer: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  promptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  promptText: {
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
  stopButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
});
