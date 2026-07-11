import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Package } from '@/components/icons/package';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  onBrand: '#ffffff',
};

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby taskers automatically.');
        setLoading(false);
        return;
      }
      
      // Navigate to confirm location screen
      router.push('/location-confirm');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while requesting location permissions.');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => router.push('/success');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            Help us find taskers near you and improve service accuracy. Your exact location is never shared without your permission.
          </Text>
        </View>

        {/* Allow Location card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={requestPermission}
          disabled={loading}>
          <View style={styles.cardIcon}>
            <Package size={24} color={COLORS.onBrand} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{loading ? 'Requesting...' : 'Allow Location'}</Text>
            <Text style={styles.cardSubtitle}>Best experience - find nearby taskers</Text>
          </View>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable hitSlop={8} onPress={skip} style={styles.skipRow}>
          <Text style={styles.skipLabel}>Not Now</Text>
        </Pressable>
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
    paddingTop: 14,
    gap: 24,
  },
  heading: {
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.iconSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skipRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
