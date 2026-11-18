import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api/client';

export function ReferralCard({ code, link }: { code: string; link: string }) {
  const share = async () => {
    const info = await api.get<{ data: { shareMessage: string; referralCode: string } }>('/api/referrals/me').catch(() => null);
    const message = info?.data.referralCode === code
      ? info.data.shareMessage
      : `Join me on TaskHub! Sign up with my referral code ${code}: ${link}`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share your referral link', 'Please try again.');
    }
  };
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Invite friends</Text>
      <Text selectable style={styles.detail}>Referral code {code}</Text>
      <Text selectable style={styles.detail}>{link}</Text>
      <Pressable accessibilityRole="button" onPress={() => void share()}>
        <Text style={styles.action}>Share referral link</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderColor: '#e0e0ea', borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  title: { color: '#111122', fontSize: 16, fontWeight: '600' },
  detail: { color: '#5a5a70', fontSize: 14 },
  action: { color: '#6c3bff', fontSize: 14, fontWeight: '600', paddingVertical: 8 },
});
