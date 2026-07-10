import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function NotificationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { title, message } = useLocalSearchParams<{ title?: string; message?: string }>();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Notification" />

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 8,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  message: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
});
