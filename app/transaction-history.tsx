import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
} from './wallet';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  success: '#12b76a',
};

type FilterType = 'All' | 'In Escrow' | 'Failed' | 'Success' | 'Released';

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('All');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const filterOptions: FilterType[] = ['All', 'In Escrow', 'Failed', 'Success', 'Released'];

  const filteredTransactions = MOCK_TRANSACTIONS.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'In Escrow') return item.status === 'In -Escrow';
    return item.status === filter;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Transaction History" />

      <View style={styles.subheaderRow}>
        <Text style={styles.subheaderText}>
          {filter === 'All' ? 'All Transactions' : `${filter} Transactions`}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.filterBtn, pressed && styles.btnPressed]}
          onPress={() => setIsFilterModalOpen(true)}>
          <Ionicons name="options-outline" size={20} color={COLORS.textPrimary} />
        </Pressable>
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

      {/* Filter Options Modal */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsFilterModalOpen(false)}>
          <View style={[styles.modalContent, { bottom: insets.bottom + 80 }]}>
            <Text style={styles.modalTitle}>Filter by Status</Text>
            
            {filterOptions.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [styles.optionRow, pressed && styles.rowPressed]}
                onPress={() => {
                  setFilter(opt);
                  setIsFilterModalOpen(false);
                }}>
                <Text style={[styles.optionText, filter === opt && styles.optionSelectedText]}>
                  {opt === 'All' ? 'All Transactions' : opt}
                </Text>
                {filter === opt && (
                  <Ionicons name="checkmark" size={20} color={COLORS.brand} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
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
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  optionSelectedText: {
    fontFamily: 'Geist_600SemiBold',
    color: COLORS.brand,
  },
});
