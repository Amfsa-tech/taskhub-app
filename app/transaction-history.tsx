import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import {
  MOCK_TRANSACTIONS,
  getStatusStyle,
  getTransactionIcon,
} from '@/lib/mock/transactions';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  success: '#12b76a',
};

type FilterType = 'All' | 'Escrow' | 'Completed' | 'Failed' | 'Withdrawn';

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const filterBtnRef = useRef<View>(null);

  const filterOptions: FilterType[] = ['All', 'Escrow', 'Completed', 'Failed', 'Withdrawn'];

  const filteredTransactions = MOCK_TRANSACTIONS.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Escrow') return item.status === 'In -Escrow';
    if (filter === 'Completed') return item.status === 'Success';
    if (filter === 'Failed') return item.status === 'Failed';
    if (filter === 'Withdrawn') return item.status === 'Released';
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Transaction History" />

      <View style={styles.subheaderRow}>
        <Text style={styles.subheaderText}>
          {filter === 'All' ? 'All Transactions' : `${filter} Transactions`}
        </Text>
        <View
          ref={filterBtnRef}
          onLayout={() => {
            filterBtnRef.current?.measureInWindow((x, y, w, h) => {
              setDropPos({ top: y + h + 4, right: 16 });
            });
          }}>
          <Pressable
            style={({ pressed }) => [styles.filterBtn, pressed && styles.btnPressed]}
            onPress={() => {
              filterBtnRef.current?.measureInWindow((x, y, w, h) => {
                setDropPos({ top: y + h + 4, right: 16 });
                setIsFilterOpen(true);
              });
            }}>
            <Ionicons name="options-outline" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found for this filter.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const icon = getTransactionIcon(item.type, item.status);
          const statusStyle = getStatusStyle(item.status);

          return (
            <View style={styles.card}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.transactionRow}>
                <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.txMeta}>{item.date} • {item.source}</Text>
                </View>
                <View style={styles.txPriceCol}>
                  <Text style={[styles.txAmount, item.amount.startsWith('+') ? styles.creditText : styles.debitText]}>
                    {item.amount}
                  </Text>
                  <Text style={[styles.txStatus, { color: statusStyle.color }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Filter Dropdown */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}>
        <Pressable style={styles.dropBackdrop} onPress={() => setIsFilterOpen(false)} />
        <View style={[styles.dropdown, { top: dropPos.top, right: dropPos.right }]}>
          {filterOptions.map((opt, idx) => (
            <Pressable
              key={opt}
              style={[
                styles.dropItem,
                idx < filterOptions.length - 1 && styles.dropItemBorder,
              ]}
              onPress={() => {
                setFilter(opt);
                setIsFilterOpen(false);
              }}>
              <Text style={[styles.dropItemText, filter === opt && styles.dropItemTextActive]}>
                {opt === 'All' ? 'All Transactions' : opt}
              </Text>
              {filter === opt && (
                <Ionicons name="checkmark" size={16} color={COLORS.brand} />
              )}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.canvas,
  },
  subheaderText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 4,
  },
  txTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  txMeta: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  txPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
  },
  txStatus: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
  },
  creditText: {
    color: COLORS.success,
  },
  debitText: {
    color: COLORS.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  optionText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  optionSelectedText: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.brand,
  },
  // Inline Dropdown
  dropBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  dropItemText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  dropItemTextActive: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.brand,
  },
});
