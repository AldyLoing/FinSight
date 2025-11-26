export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  currency: string;
  description?: string;
  merchant?: string;
  notes?: string;
  budget_id?: string | null;
  is_transfer?: boolean;
  transfer_account_id?: string | null;
  transfer_transaction_id?: string | null;
  occurred_at: string;
  created_at?: string;
  updated_at?: string;
  reconciled?: boolean;
  recurring_rule?: string | null;
  recurring_parent_id?: string | null;
  metadata?: Record<string, any>;
}

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  user_id: string;
  category_id?: string | null;
  amount: number;
  note?: string;
  created_at?: string;
}

export interface TransactionInput {
  account_id: string;
  amount: number;
  currency?: string;
  description?: string;
  category?: string;
  merchant?: string;
  notes?: string;
  budget_id?: string;
  occurred_at?: string;
  is_transfer?: boolean;
  transfer_account_id?: string;
  recurring_rule?: string;
  splits?: TransactionSplitInput[];
}

export interface TransactionSplitInput {
  category_id?: string;
  amount: number;
  note?: string;
}

export interface TransactionUpdate {
  account_id?: string;
  amount?: number;
  currency?: string;
  description?: string;
  category?: string;
  budget_id?: string;
  merchant?: string;
  notes?: string;
  occurred_at?: string;
  reconciled?: boolean;
}
