import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  canvas: '#f9f9fb',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  onBrand: '#ffffff',
};

export default function ReportSubmittedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const done = () => {
    // Pop the report-issue + report-submitted screens back to the chat.
    if (router.canDismiss()) {
      router.dismiss(2);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.message}>
        {/* Illustration (cropped to match Figma) */}
        <View style={styles.illustrationClip}>
          <Image
            source={require('@/assets/images/report-submitted.png')}
            style={styles.illustration}
            contentFit="fill"
          />
        </View>

        <View style={styles.block}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Report Submitted</Text>
            <Text style={styles.subtitle}>
              Our team will review your report within 24 hours and take appropriate action
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={done}>
            <Text style={styles.buttonLabel}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  message: {
    width: 361,
    alignItems: 'center',
    gap: 24,
  },
  illustrationClip: {
    width: 111,
    height: 100,
    overflow: 'hidden',
  },
  illustration: {
    position: 'absolute',
    width: 171.84,
    height: 229.65,
    top: -64.82,
    left: -29.81,
  },
  block: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  textBlock: {
    width: 304,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
});
