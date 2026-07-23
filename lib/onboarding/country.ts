// Shared selection for the sign-up "Country" field.
//
// The Create Account form and the dedicated `/country-selection` screen are two
// separate routes, so the choice lives in a tiny external store rather than
// being threaded through navigation params (which would drop the in-progress
// form state). Create Account stays mounted under the pushed picker, so it
// re-renders with the new value the moment the picker sets it.

import { useSyncExternalStore } from 'react';

export type Country = 'Nigeria' | 'United Kingdom (UK)';

export const COUNTRIES: Country[] = ['Nigeria', 'United Kingdom (UK)'];

let selected: Country = 'Nigeria';
const listeners = new Set<() => void>();

export function setSelectedCountry(country: Country): void {
  selected = country;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Country {
  return selected;
}

/** Reactively read the currently selected sign-up country. */
export function useSelectedCountry(): Country {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
