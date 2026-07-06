import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function VoiceRecordingScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/voice-post?autoStart=true');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9fb', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6c3bff" />
    </View>
  );
}
