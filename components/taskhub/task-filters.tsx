import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dateRangeError, emptyTaskFilters, hasTaskFilters, PENDING_TYPES, type FilterOption, type TaskFilters as Filters } from '@/lib/task-filters';

type Section = 'date' | 'categories' | 'statuses' | 'types';
export function TaskFilters({ value, onChange, categories = [], statuses = [], pending = false }: {
  value: Filters; onChange: (value: Filters) => void; categories?: FilterOption[]; statuses?: FilterOption[]; pending?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section | null>(null);
  const [draft, setDraft] = useState(value);
  const [dateField, setDateField] = useState<'from' | 'to' | null>(null);
  const close = () => { setSection(null); setDateField(null); };
  const open = (next: Section) => { setDraft({ ...value, categories: [...value.categories], statuses: [...value.statuses], types: [...value.types] }); setSection(next); };
  const options = section === 'categories' ? categories : section === 'types' ? PENDING_TYPES : statuses;
  const title = section === 'date' ? 'Date range' : section === 'categories' ? 'Filter by category' : section === 'types' ? 'Filter pending jobs' : 'Filter by status';
  const error = dateRangeError(draft);
  const chip = (key: Section, label: string, count: number, icon: keyof typeof Ionicons.glyphMap) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${label}${count ? `, ${count} selected` : ''}`} accessibilityState={{ expanded: section === key }} onPress={() => open(key)} style={[styles.chip, count > 0 && styles.chipActive]}>
    <Ionicons name={icon} size={14} color={count ? '#6c3bff' : '#5a5a70'} /><Text style={[styles.chipText, count > 0 && styles.purple]}>{label}{count ? ` (${count})` : ''}</Text><Ionicons name="chevron-down" size={12} color={count ? '#6c3bff' : '#5a5a70'} />
  </Pressable>;
  const toggle = (option: string) => {
    if (!section || section === 'date') return;
    setDraft(current => ({ ...current, [section]: current[section].includes(option) ? current[section].filter(item => item !== option) : [...current[section], option] }));
  };
  const resetSection = () => setDraft(current => section === 'date' ? { ...current, from: '', to: '' } : section ? { ...current, [section]: [] } : current);
  return <>
    <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
      {pending ? chip('types', 'Type', value.types.length, 'options-outline') : <>
        {chip('date', 'Date range', value.from || value.to ? 1 : 0, 'calendar-outline')}
        {chip('categories', 'Category', value.categories.length, 'grid-outline')}
        {chip('statuses', 'Status', value.statuses.length, 'options-outline')}
      </>}
      {hasTaskFilters(value) && <Pressable accessibilityRole="button" onPress={() => { onChange(emptyTaskFilters()); close(); }} style={styles.clear}><Text style={styles.purple}>Clear filters</Text></Pressable>}
    </ScrollView>
    <Modal visible={section !== null} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss filters" onPress={close} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom), paddingTop: 12 }]}>
          <View style={styles.handle} />
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close filters" hitSlop={8} onPress={close}><Ionicons name="close" size={22} color="#111122" /></Pressable></View>
          <Pressable accessibilityRole="button" onPress={resetSection} style={styles.reset}><Text style={styles.purple}>Reset selection</Text></Pressable>
          <ScrollView contentContainerStyle={styles.options}>
            {section === 'date' ? <>
              <Text style={styles.hint}>Filter by task posting date.</Text>
              {(['from', 'to'] as const).map(field => <Pressable key={field} accessibilityRole="button" accessibilityLabel={field === 'from' ? 'Start date' : 'End date'} onPress={() => setDateField(field)} style={styles.option}><Text style={styles.optionText}>{field === 'from' ? 'Start date' : 'End date'}</Text><Text style={styles.purple}>{draft[field] || 'Any date'}</Text></Pressable>)}
              {dateField && <DateTimePicker value={draft[dateField] ? new Date(`${draft[dateField]}T12:00:00`) : new Date()} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(event, date) => {
                if (Platform.OS !== 'ios') setDateField(null);
                if (event.type === 'dismissed' || !date) return;
                const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                setDraft(current => ({ ...current, [dateField]: iso }));
              }} />}
              {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            </> : options.length ? options.map(option => {
              const selected = section && draft[section].includes(option.value);
              return <Pressable key={option.value} accessibilityRole="checkbox" accessibilityLabel={option.label} accessibilityState={{ checked: !!selected }} onPress={() => toggle(option.value)} style={styles.option}><Text style={styles.optionText}>{option.label}</Text><Ionicons name={selected ? 'checkbox' : 'square-outline'} size={22} color={selected ? '#6c3bff' : '#a0a0ba'} /></Pressable>;
            }) : <Text style={styles.hint}>No categories are available in this history yet.</Text>}
          </ScrollView>
          <Pressable accessibilityRole="button" disabled={!!error} onPress={() => { onChange(draft); close(); }} style={[styles.apply, !!error && styles.disabled]}><Text style={styles.applyText}>Apply filters</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 11, minHeight: 36, borderRadius: 18, backgroundColor: '#f2f2f7', borderWidth: 1, borderColor: '#e0e0ea' },
  chipActive: { backgroundColor: '#f3eeff', borderColor: '#c7b5ff' }, chipText: { fontFamily: 'Geist_500Medium', fontSize: 12, color: '#5a5a70' },
  purple: { color: '#6c3bff', fontFamily: 'Geist_500Medium', fontSize: 13 }, clear: { padding: 8 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,17,34,0.45)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0ea', alignSelf: 'center', marginBottom: 16 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, title: { flex: 1, fontFamily: 'Geist_600SemiBold', fontSize: 19, color: '#111122' },
  reset: { alignSelf: 'flex-start', paddingVertical: 12 }, options: { gap: 10, paddingBottom: 16 },
  option: { backgroundColor: '#f9f9fb', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }, optionText: { flex: 1, fontFamily: 'Geist_500Medium', fontSize: 14, color: '#111122' },
  hint: { fontSize: 13, lineHeight: 20, color: '#5a5a70' }, error: { fontSize: 13, color: '#b01515' },
  apply: { backgroundColor: '#6c3bff', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 }, applyText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#fff' }, disabled: { opacity: 0.5 },
});
