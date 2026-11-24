import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccountType } from '@/lib/auth/types';

export function AccountTypeSelector({ value, onChange, disabled = false }: {
  value: AccountType; onChange: (value: AccountType) => void; disabled?: boolean;
}) {
  return <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Account type">
    {(['user', 'tasker'] as const).map((type) => <Pressable key={type} accessibilityRole="radio"
      accessibilityLabel={type === 'user' ? 'User account' : 'Tasker account'}
      accessibilityState={{ checked: value === type, disabled }} disabled={disabled}
      onPress={() => onChange(type)} style={[styles.option, value === type && styles.selected]}>
      <Text style={[styles.label, value === type && styles.selectedLabel]}>{type === 'user' ? 'User · Hire a tasker' : 'Tasker · Find work'}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  option: { flex: 1, minHeight: 48, padding: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0ea', backgroundColor: '#fff' },
  selected: { borderColor: '#6c3bff', backgroundColor: '#f3eeff' },
  label: { fontFamily: 'Geist_500Medium', fontSize: 13, textAlign: 'center', color: '#5a5a70' },
  selectedLabel: { color: '#4621c0' },
});
