import { Text } from 'react-native';

export function CaptchaNotice() {
  if (!process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim()) return null;
  return <Text style={{ fontSize: 12, color: '#5a5a70', lineHeight: 18 }}>A quick security check will appear before you continue.</Text>;
}
