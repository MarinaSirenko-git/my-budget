export interface ExpenseCategory {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
}

export interface Expense {
  id: string;
  type: string;
  category?: string;
  title?: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual';
  date?: string;
  createdAt?: string;
  amountInDefaultCurrency?: number; // Converted amount in default currency
}

