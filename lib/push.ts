import { router } from 'expo-router';

/**
 * OneSignal wiring. The backend's whole send pipeline (new tasks, bids, chat,
 * withdrawals) already targets OneSignal — this module is the device half:
 * initialize, get the subscription id, and deep-link notification taps.
 *
 * The native module only exists in dev-client/EAS builds, so it's required
 * lazily — in Expo Go every function here quietly no-ops.
 */

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '';

type OneSignalModule = typeof import('react-native-onesignal').OneSignal;

let oneSignal: OneSignalModule | null | undefined;

function getOneSignal(): OneSignalModule | null {
  if (oneSignal !== undefined) return oneSignal;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    oneSignal = (require('react-native-onesignal') as typeof import('react-native-onesignal'))
      .OneSignal;
  } catch {
    // Expo Go or a build without the native module.
    oneSignal = null;
  }
  return oneSignal;
}

/** Notification payloads the backend sends — see utils/notificationUtils.js. */
type PushData = {
  type?: string;
  taskId?: string;
  conversationId?: string;
  action?: string;
};

function openFromNotification(data: PushData) {
  if (data.taskId) {
    router.push({ pathname: '/task-details', params: { id: data.taskId } });
  } else if (data.conversationId) {
    router.push({ pathname: '/chat', params: { id: data.conversationId } });
  } else {
    router.push('/notifications');
  }
}

/**
 * Initialize the SDK and ask for permission. Called once at app launch;
 * safe to call when the app id is missing (no-op) or permission was already
 * answered (the OS ignores repeat requests).
 */
export function initPush() {
  const OneSignal = getOneSignal();
  if (!OneSignal || !APP_ID) return;

  OneSignal.initialize(APP_ID);
  // `false` = don't re-prompt through a fallback dialog if already declined.
  OneSignal.Notifications.requestPermission(false);

  OneSignal.Notifications.addEventListener(
    'click',
    (event: { notification: { additionalData?: unknown } }) => {
      openFromNotification((event.notification.additionalData ?? {}) as PushData);
    },
  );
}

/**
 * Deliver the push subscription id to `onReady` — immediately when the device
 * is already subscribed, otherwise when the subscription comes alive (e.g.
 * right after the user grants permission). Returns an unsubscribe function.
 */
export function watchPushSubscriptionId(onReady: (id: string) => void): () => void {
  const OneSignal = getOneSignal();
  if (!OneSignal || !APP_ID) return () => {};

  let stopped = false;

  OneSignal.User.pushSubscription.getIdAsync().then((id) => {
    if (!stopped && id) onReady(id);
  });

  const listener = (event: { current: { id?: string | null } }) => {
    if (!stopped && event.current.id) onReady(event.current.id);
  };
  OneSignal.User.pushSubscription.addEventListener('change', listener);

  return () => {
    stopped = true;
    OneSignal.User.pushSubscription.removeEventListener('change', listener);
  };
}
