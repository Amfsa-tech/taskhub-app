import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * React Query's `refetchOnWindowFocus` listens for a browser `focus` event,
 * which doesn't exist in React Native — so by default a query that went stale
 * while the app was backgrounded is never refetched when the user comes back.
 *
 * Bridging RN's `AppState` into `focusManager` restores that behaviour app-wide:
 * foregrounding the app refetches anything past its `staleTime` (30s), so the
 * home feed, task list and notification badge catch up on changes that happened
 * server-side while the app was away.
 */
export function useAppStateFocus() {
  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      // `focusManager` handles web natively; only RN needs the bridge.
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);
}
