import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const CHECK_URL = 'https://www.ngtaskhub.com/security-check';
export default function TurnstileChallenge({ onToken }: { onToken: (token: string) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  return <View style={{ height: 240 }}>
    {error ? <View style={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="alert" style={{ color: '#b42318' }}>Could not load the security check. Check your connection and try again.</Text>
      <Pressable accessibilityRole="button" onPress={() => { setError(false); setAttempt(value => value + 1); }} style={{ padding: 12 }}><Text style={{ color: '#6c3bff', fontWeight: '600' }}>Retry security check</Text></Pressable>
    </View> : <WebView key={attempt} source={{ uri: CHECK_URL }} javaScriptEnabled domStorageEnabled
      originWhitelist={['https://www.ngtaskhub.com', 'https://challenges.cloudflare.com', 'about:*']}
      onShouldStartLoadWithRequest={request => request.url === CHECK_URL || request.url.startsWith(CHECK_URL + '?') || request.url.startsWith('https://challenges.cloudflare.com/') || request.url === 'about:blank' || request.url === 'about:srcdoc'}
      onError={() => setError(true)} onHttpError={event => { if (event.nativeEvent.statusCode >= 400) setError(true); }}
      startInLoadingState renderLoading={() => <ActivityIndicator color="#6c3bff" />}
      onMessage={event => {
        if (!active.current) return;
        if (event.nativeEvent.url !== CHECK_URL && !event.nativeEvent.url.startsWith(CHECK_URL + '?')) return;
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'turnstile-token' && typeof message.token === 'string' && message.token.length > 0 && message.token.length <= 2048) onToken(message.token);
        } catch { /* Ignore unrelated messages from the embedded browser. */ }
      }} />}
  </View>;
}
