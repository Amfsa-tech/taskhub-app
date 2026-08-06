import * as Location from 'expo-location';

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';

// Matches the "6.6900, 3.3066" strings the old fallback used to store when no
// Geoapify key was configured — kept so saved values can be migrated on read.
const COORDINATE_PAIR = /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/;

export function looksLikeCoordinates(address: string): boolean {
  return COORDINATE_PAIR.test(address.trim());
}

export function parseCoordinates(
  address: string,
): { latitude: number; longitude: number } | null {
  const match = address.trim().match(COORDINATE_PAIR);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/**
 * Resolve coordinates to a human-readable address. Tries Geoapify when a key
 * is configured (its formatted strings are the nicest), then falls back to the
 * device's native geocoder, which needs no API key. Returns null only when
 * both fail — callers decide what to show then.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (GEOAPIFY_API_KEY) {
    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const props = data.features?.[0]?.properties;
      if (props) {
        const formatted =
          props.formatted ||
          [props.street, props.city].filter(Boolean).join(', ');
        if (formatted) return formatted;
      }
    } catch {
      // Fall through to the device geocoder.
    }
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];
    if (place) {
      const parts = [
        place.street || place.name,
        place.city || place.subregion,
        place.region,
        place.country,
      ].filter((part): part is string => !!part);
      const deduped = parts.filter((part, i) => parts.indexOf(part) === i);
      if (deduped.length > 0) return deduped.slice(0, 3).join(', ');
    }
  } catch {
    // No geocoder available (e.g. web) or lookup failed.
  }

  return null;
}

/**
 * If `address` is a stored "lat, lon" pair, resolve it to a place name;
 * otherwise return it unchanged. Returns the original string when resolution
 * fails so callers can use the result directly.
 */
export async function resolveAddress(address: string): Promise<string> {
  const coords = parseCoordinates(address);
  if (!coords) return address;
  const resolved = await reverseGeocode(coords.latitude, coords.longitude);
  return resolved ?? address;
}
