import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LocationContextType = {
  selectedLocation: string | null;
  recentLocations: string[];
  setSelectedLocation: (location: string | null) => void;
  isLoadingLocation: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = '@taskhub_selected_location';
const RECENT_LOCATIONS_KEY = '@taskhub_recent_locations';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setLocationState] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
          setLocationState(storedLocation);
        }

        const storedRecents = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
        if (storedRecents) {
          setRecentLocations(JSON.parse(storedRecents));
        }
      } catch (e) {
        console.error('Failed to load location data', e);
      } finally {
        setIsLoadingLocation(false);
      }
    }
    loadData();
  }, []);

  const setSelectedLocation = async (location: string | null) => {
    try {
      setLocationState(location);
      if (location) {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, location);
        
        // Update recent locations (keep max 5, remove duplicates)
        setRecentLocations((prev) => {
          const filtered = prev.filter((loc) => loc !== location);
          const updated = [location, ...filtered].slice(0, 5);
          AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated)).catch(e => console.error(e));
          return updated;
        });
      } else {
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save location', e);
    }
  };

  return (
    <LocationContext.Provider value={{ selectedLocation, recentLocations, setSelectedLocation, isLoadingLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
