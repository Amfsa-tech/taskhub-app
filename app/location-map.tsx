import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Region, UrlTile } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { Package } from '@/components/icons/package';
import { useLocation } from '@/context/LocationContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  onBrand: '#ffffff',
  overlay: 'rgba(108, 59, 255, 0.1)',
};

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';
// Geoapify Maps API URL for map tiles
const MAPS_URL_TEMPLATE = `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`;

// Default to Lagos, Nigeria
const DEFAULT_LOCATION = {
  latitude: 6.4446,
  longitude: 3.4833,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type AutocompleteResult = {
  id: string;
  formatted: string;
  lat: number;
  lon: number;
};

export default function LocationMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [address, setAddress] = useState('Loading...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);

  // Initialize with current location
  useEffect(() => {
    async function initLocation() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const { coords } = await Location.getCurrentPositionAsync({});
          const newRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
          reverseGeocode(coords.latitude, coords.longitude);
        } else {
          reverseGeocode(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        }
      } catch (err) {
        console.error(err);
        reverseGeocode(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      }
    }
    initLocation();
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    if (!GEOAPIFY_API_KEY) {
      setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      return;
    }

    setIsReverseGeocoding(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const formatted = props.formatted || `${props.street}, ${props.city}`;
        setAddress(formatted);
      } else {
        setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (e) {
      console.error(e);
      setAddress('Unknown Location');
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const fetchAutocomplete = async (text: string) => {
    if (!text.trim() || !GEOAPIFY_API_KEY) {
      setAutocompleteResults([]);
      return;
    }

    try {
      // Geoapify Autocomplete API
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        const results = data.features.map((f: any) => ({
          id: f.properties.place_id,
          formatted: f.properties.formatted,
          lat: f.properties.lat,
          lon: f.properties.lon,
        }));
        setAutocompleteResults(results);
      }
    } catch (e) {
      console.error(e);
      setAutocompleteResults([]);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    // Debounce autocomplete calls
    typingTimer.current = setTimeout(() => {
      fetchAutocomplete(text);
    }, 500);
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const selectAutocompleteResult = (result: AutocompleteResult) => {
    setSearchQuery(result.formatted);
    setAutocompleteResults([]);
    const newRegion = {
      latitude: result.lat,
      longitude: result.lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    setAddress(result.formatted);
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim() || !GEOAPIFY_API_KEY) return;

    setAutocompleteResults([]);
    setIsSearching(true);
    try {
      // Geoapify Geocoding API (Search)
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const newRegion = {
          latitude: props.lat,
          longitude: props.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        setAddress(props.formatted || searchQuery);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const { fromModal } = useLocalSearchParams<{ fromModal?: string }>();
  const { setSelectedLocation } = useLocation();

  const confirmLocation = async () => {
    if (fromModal === 'true') {
      await setSelectedLocation(address);
      router.dismissAll(); // close the modal stack
      return;
    }

    // Navigate back to confirmation screen with params for onboarding flow
    router.push({
      pathname: '/location-confirm',
      params: {
        customAddress: address,
        lat: region.latitude.toString(),
        lon: region.longitude.toString(),
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Geoapify Maps API integration via UrlTile */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType={GEOAPIFY_API_KEY ? "none" : "standard"}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {GEOAPIFY_API_KEY && (
          <UrlTile
            urlTemplate={MAPS_URL_TEMPLATE}
            maximumZ={19}
          />
        )}
      </MapView>

      {/* Center Pin Marker */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <View style={styles.pinBody}>
          <Package size={20} color={COLORS.onBrand} />
        </View>
        <View style={styles.pinTail} />
      </View>

      {/* Top Header & Search Overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Choose Location</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <MagnifyingGlass size={20} color={COLORS.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address..."
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={handleSearchTextChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {autocompleteResults.length > 0 && (
          <View style={styles.autocompleteDropdown}>
            <FlatList
              data={autocompleteResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.autocompleteRow} onPress={() => selectAutocompleteResult(item)}>
                  <Package size={16} color={COLORS.textSecondary} />
                  <Text style={styles.autocompleteText} numberOfLines={2}>{item.formatted}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {/* Bottom Action Card Overlay */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom || 24 }]}>
        <View style={styles.addressRow}>
          <Package size={24} color={COLORS.textSecondary} />
          <View style={styles.addressTextContainer}>
            {isReverseGeocoding ? (
              <Text style={styles.addressTextLoading}>Updating location...</Text>
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
            )}
            <Text style={styles.dragHint}>Drag the map to adjust</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={confirmLocation}>
          <Text style={styles.buttonLabel}>Select this location</Text>
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
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18, // half of total width (36)
    marginTop: -44, // full height so the tip points exactly to the center
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinBody: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -1, // slight overlap to prevent gap
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.canvas,
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  autocompleteDropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  autocompleteText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    gap: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  addressTextContainer: {
    flex: 1,
    gap: 4,
  },
  addressText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  addressTextLoading: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    color: COLORS.placeholder,
  },
  dragHint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.onBrand,
  },
});
