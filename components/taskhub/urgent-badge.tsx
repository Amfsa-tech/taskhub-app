import { useTaskUrgency } from '@/lib/use-task-urgency';
import type { UrgentTask } from '@/lib/task-urgency';
import { StyleSheet, Text, View } from 'react-native';
import Lightning from '@/assets/icons/lightning.svg';
export function UrgentBadge({ task }: { task: UrgentTask }) {
  const urgent = useTaskUrgency(task);
  if (!urgent) return null;
  return <View accessibilityLabel="Urgent task" style={styles.badge}><Lightning width={14} height={14} /><Text style={styles.text}>Urgent</Text></View>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#fff1f1' }, text: { fontFamily: 'Geist_500Medium', fontSize: 12, color: '#b01515' } });
