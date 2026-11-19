import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

export function ReferralActions({ link, message }: { link?: string; message?: string }) {
  const [busy, setBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string>();
  const copy = async () => {
    if (!link) return;
    try {
      if (!await Clipboard.setStringAsync(link)) throw new Error('Copy failed');
      setCopiedLink(link);
    } catch {
      Alert.alert('Could not copy your link', 'You can long-press your referral link to copy it.');
    }
  };
  const share = async () => {
    if (!message || !link || busy) return;
    setBusy(true);
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share your referral link', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" disabled={!link} onPress={() => void copy()}
        style={[styles.button, !link && styles.disabled]}>
        <Text style={styles.copy}>{copiedLink === link && link ? 'Link copied' : 'Copy link'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={!link || !message || busy} onPress={() => void share()}
        style={[styles.button, styles.primary, (!link || !message || busy) && styles.disabled]}>
        <Text style={styles.share}>{busy ? 'Opening share…' : 'Share invite'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderWidth: 1, borderColor: '#e4d6ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: '#6c3bff', borderColor: '#6c3bff' },
  copy: { color: '#6c3bff', fontSize: 14, fontWeight: '600' },
  share: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
