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

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.message}>
        {/* Illustration (cropped to match Figma) */}
        <View style={styles.illustrationClip}>
          <Image
            source={require('@/assets/images/success.png')}
            style={styles.illustration}
            contentFit="fill"
          />
        </View>

        <View style={styles.block}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>You’re all set!</Text>
            <Text style={styles.subtitle}>Post your first task to get matched instantly</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.replace('/home')}>
            <Text style={styles.buttonLabel}>Start Exploring</Text>
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
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  illustrationClip: {
    width: 172,
    height: 172,
    overflow: 'hidden',
  },
  illustration: {
    position: 'absolute',
    width: 206.55,
    height: 370.4,
    top: -97.15,
    left: -18.85,
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
    width: '100%',
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
