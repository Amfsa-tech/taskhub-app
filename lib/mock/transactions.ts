// Sample transaction data + row presentation helpers for the transaction
// history screen.
//
// These used to live in `app/wallet.tsx`, but that screen is now backed by the
// real wallet API (`useWalletBalance` / `useWalletTransactions`). They're kept
// here so `app/transaction-history.tsx` — which is still a static mockup —
// keeps working until it's wired to `getWalletTransactions` too.

const COLORS = {
  textSecondary: '#5a5a70',
  success: '#12b76a',
  warning: '#d97706',
  error: '#ef4444',
  info: '#2563eb',
};

export type Transaction = {
  id: string;
  title: string;
  amount: string;
  date: string;
  source: string;
  status: 'Released' | 'Success' | 'In -Escrow' | 'Failed';
  type: 'debit' | 'credit' | 'escrow';
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '2',
    title: 'Wallet funded',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Bank',
    status: 'Success',
    type: 'credit',
  },
  {
    id: '3',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'In -Escrow',
    type: 'escrow',
  },
  {
    id: '4',
    title: 'Refund - Cancelled Task',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Failed',
    type: 'credit',
  },
  {
    id: '5',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'In -Escrow',
    type: 'escrow',
  },
  {
    id: '6',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '7',
    title: 'Wallet funded',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Card',
    status: 'Failed',
    type: 'credit',
  },
  {
    id: '8',
    title: 'Escrow - Print Assignment...',
    amount: '- ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Released',
    type: 'debit',
  },
  {
    id: '9',
    title: 'Refund - Cancelled Task',
    amount: '+ ₦15,000',
    date: 'May 14, 2026',
    source: 'Wallet',
    status: 'Success',
    type: 'credit',
  },
];

export function getStatusStyle(status: Transaction['status']) {
  switch (status) {
    case 'Released':
    case 'Success':
      return { color: COLORS.success, label: status };
    case 'In -Escrow':
      return { color: COLORS.info, label: status };
    case 'Failed':
      return { color: COLORS.error, label: status };
    default:
      return { color: COLORS.textSecondary, label: status };
  }
}

export function getTransactionIcon(type: Transaction['type'], status: Transaction['status']) {
  if (status === 'Failed') {
    return {
      name: 'close-outline' as const,
      color: COLORS.error,
      bg: '#fff1f1',
    };
  }
  if (type === 'credit') {
    return {
      name: 'arrow-down-outline' as const,
      color: COLORS.success,
      bg: '#edfaf3',
    };
  }
  if (type === 'escrow') {
    return {
      name: 'wallet-outline' as const,
      color: COLORS.warning,
      bg: '#fffbeb',
    };
  }
  return {
    name: 'arrow-up-outline' as const,
    color: COLORS.warning,
    bg: '#fffbeb',
  };
}
