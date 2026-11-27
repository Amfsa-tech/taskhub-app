import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

/** Present the calendar above the page without a compact date-chip step. */
export function CalendarOverlay({ value, minimumDate, onSelect, onDismiss }: {
  value: Date;
  minimumDate?: Date;
  onSelect: (date: Date) => void;
  onDismiss: () => void;
}) {
  const [initialValue] = useState(() => new Date(Math.max(value.getTime(), minimumDate?.getTime() ?? -Infinity)));
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const completedRef = useRef(false);
  const selectionRef = useRef<Date | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    Keyboard.dismiss();
    return () => { mountedRef.current = false; };
  }, []);

  const complete = () => {
    if (!mountedRef.current || completedRef.current) return;
    completedRef.current = true;
    onDismiss();
    if (selectionRef.current) onSelect(selectionRef.current);
  };
  const close = (date: Date | null = null) => {
    if (closingRef.current) return;
    closingRef.current = true;
    selectionRef.current = date;
    // Selection callbacks may start requests or show alerts. Finish the iOS
    // presentation's dismissal before handing control back to the page.
    if (Platform.OS === 'ios') setClosing(true);
    else complete();
  };
  const calendar = <DateTimePicker mode="date" value={initialValue} minimumDate={minimumDate}
    display={Platform.OS === 'ios' ? 'inline' : 'calendar'} themeVariant="light"
    onChange={(event, date) => close(event.type === 'set' && date ? date : null)} />;

  if (Platform.OS !== 'ios') return calendar;
  return <Modal visible={!closing} transparent animationType="fade" presentationStyle="overFullScreen"
    onDismiss={complete} onRequestClose={() => close()}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss calendar" style={StyleSheet.absoluteFill} onPress={() => close()} />
      <View accessibilityViewIsModal style={styles.card}>
        {calendar}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel date selection" style={styles.action} onPress={() => close()}>
            <Text style={styles.label}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Use selected date" style={styles.action} onPress={() => close(initialValue)}>
            <Text style={styles.label}>Use date</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(17,17,34,0.4)' },
  card: { maxWidth: '100%', backgroundColor: '#ffffff', borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', paddingVertical: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  label: { color: '#6c3bff', fontFamily: 'Geist_600SemiBold', fontSize: 15 },
});
