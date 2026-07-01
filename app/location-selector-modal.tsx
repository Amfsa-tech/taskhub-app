import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useLocation } from '@/context/LocationContext';
import MapPin from '@/assets/icons/map-pin.svg';

const COLORS = {
  canvas: '#ffffff',
  surface: '#f9f9fb', // slightly off-white for input background
  border: '#e0e0ea',
  brand: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  iconBg: '#f2f2f7',
  iconBrandBg: '#f3eeff',
};

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';

type AutocompleteResult = {
  id: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
};

export default function LocationSelectorModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSelectedLocation, recentLocations } = useLocation();

  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAutocomplete = async (text: string) => {
    if (!text.trim() || !GEOAPIFY_API_KEY) {
      setAutocompleteResults([]);
      setIsSearching(false);
      return;
    }
    
    try {
      setIsSearching(true);
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features) {
        const results = data.features.map((f: any) => ({
          id: f.properties.place_id || Math.random().toString(),
          formatted: f.properties.formatted,
          address_line1: f.properties.address_line1 || f.properties.street || f.properties.name || f.properties.formatted,
          address_line2: f.properties.address_line2 || f.properties.city || f.properties.country || '',
        }));
        setAutocompleteResults(results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    typingTimer.current = setTimeout(() => {
      fetchAutocomplete(text);
    }, 500);
  };

  const handleSelectLocation = async (address: string) => {
    await setSelectedLocation(address);
    router.back();
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      
      if (GEOAPIFY_API_KEY) {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${GEOAPIFY_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          const formatted = props.formatted || `${props.street}, ${props.city}`;
          await handleSelectLocation(formatted);
          return;
        }
      }
      
      await handleSelectLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapSelection = () => {
    // Replace current modal and go to location-map
    router.dismiss();
    router.push({ pathname: '/location-map', params: { fromModal: 'true' } });
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Location</Text>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={20} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter New Address"
          placeholderTextColor={COLORS.placeholder}
          value={search}
          onChangeText={handleSearchChange}
          autoFocus={false}
        />
        {isSearching && <ActivityIndicator size="small" color={COLORS.brand} style={{ marginRight: 8 }} />}
        {search.length > 0 && (
          <Pressable onPress={clearSearch} style={styles.clearBtn}>
            <Feather name="x-circle" size={16} color={COLORS.placeholder} />
          </Pressable>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]} 
          onPress={handleCurrentLocation}
          disabled={isLocating}
        >
          <Feather name="crosshair" size={20} color={COLORS.brand} />
          <Text style={styles.actionText}>{isLocating ? 'Locating...' : 'Use your current location'}</Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          onPress={handleMapSelection}
        >
          <Feather name="map-pin" size={20} color={COLORS.brand} />
          <Text style={styles.actionText}>Save new address</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={search.trim() ? autocompleteResults : recentLocations.map((loc, i) => ({ id: i.toString(), formatted: loc, address_line1: loc, address_line2: 'Recent search' }))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          search.trim() ? (
            <Pressable 
              style={({ pressed }) => [styles.actionRow, { marginTop: 12 }, pressed && { opacity: 0.7 }]}
              onPress={handleMapSelection}
            >
              <Feather name="map-pin" size={20} color={COLORS.brand} />
              <Text style={styles.actionText}>Need to be more precise? Adjust on map</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable 
            style={({ pressed }) => [styles.addressItem, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => handleSelectLocation(item.formatted)}
          >
            <View style={styles.addressIconWrap}>
              <MapPin width={20} height={20} color={COLORS.textPrimary} />
            </View>
            <View style={styles.addressTextWrap}>
              <Text style={styles.addressPrimary} numberOfLines={2}>
                {item.address_line1}
              </Text>
              {!!item.address_line2 && (
                <Text style={styles.addressSecondary}>{item.address_line2}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3eeff', // From the design, it looks like a very light purple
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 24,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.brand,
  },
  list: {
    paddingHorizontal: 24,
    gap: 20,
  },
  addressItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderRadius: 8,
  },
  addressIconWrap: {
    marginTop: 2,
  },
  addressTextWrap: {
    flex: 1,
    gap: 4,
  },
  addressPrimary: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  addressSecondary: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
