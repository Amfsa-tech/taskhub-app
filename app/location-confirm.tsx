import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { ArrowRight } from '@/components/icons/arrow-right';
import { CheckCircle } from '@/components/icons/check-circle';
// Using Package as placeholder for a MapPin icon if it doesn't exist, though typically we'd have a MapPin
import { Package } from '@/components/icons/package';
import { useLocation } from '@/context/LocationContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  onBrand: '#ffffff',
  success: '#4caf50',
};

// Replace with a real API key from environment variable
const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';

export default function LocationConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customAddress, lat, lon } = useLocalSearchParams<{ customAddress?: string; lat?: string; lon?: string }>();
  
  const [loading, setLoading] = useState(!customAddress);
  const [address, setAddress] = useState<string | null>(customAddress || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLocationAndAddress() {
      // Skip if we already got it from params
      if (customAddress) {
        return;
      }

      try {
        setLoading(true);
        const { coords } = await Location.getCurrentPositionAsync({});
        
        if (!GEOAPIFY_API_KEY) {
          if (mounted) {
            setAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
            setError('Geoapify API Key not found. Showing coordinates instead.');
            setLoading(false);
          }
          return;
        }

        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${GEOAPIFY_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (mounted) {
          if (data.features && data.features.length > 0) {
            // Try to extract a sensible address
            const props = data.features[0].properties;
            const formatted = props.formatted || `${props.street}, ${props.city}`;
            setAddress(formatted);
          } else {
            setAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setError('Failed to find your exact address. You can adjust on map.');
          setAddress('Unknown Location');
          setLoading(false);
        }
      }
    }

    fetchLocationAndAddress();

    return () => {
      mounted = false;
    };
  }, [customAddress]);

  const { setSelectedLocation } = useLocation();

  const finish = async () => {
    await setSelectedLocation(address || 'UI Main gate');
    router.push('/success');
  };
  const adjustMap = () => router.push('/location-map');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>Your Location</Text>
          <Text style={styles.subtitle}>
            We found you! This address will be used to connect you with taskers nearby.
          </Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
             <Package size={24} color={COLORS.primary} />
          </View>
          <View style={styles.locationDetails}>
            <Text style={styles.currentLabel}>{customAddress ? 'Selected Location' : 'Current Location'}</Text>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="small" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <View style={styles.addressRow}>
                <CheckCircle size={16} color={COLORS.success} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {address}
                </Text>
              </View>
            )}
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.adjustWrapper}>
          <Text style={styles.adjustHint}>Need to be more precise?</Text>
          <Pressable onPress={adjustMap} hitSlop={8}>
            <Text style={styles.adjustLink}>Adjust on Map</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
          onPress={finish}
          disabled={loading}>
          <Text style={styles.buttonLabel}>Continue</Text>
          <ArrowRight size={18} color={COLORS.onBrand} />
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetails: {
    flex: 1,
    gap: 4,
  },
  currentLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
    marginTop: -8,
  },
  adjustWrapper: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  adjustHint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  adjustLink: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
});
