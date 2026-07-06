import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { Spinner } from '@/components/taskhub/spinner';

const COLORS = {
  canvas: '#f9f9fb',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function VoiceOrganizingScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/review-task'), 2200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="" />

      <View style={styles.center}>
        <Spinner />
        <View style={styles.text}>
          <Text style={styles.title}>Organizing you Task</Text>
          <Text style={styles.subtitle}>This takes just a moment</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
});
