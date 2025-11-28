export type AccountType = 'cash' | 'bank' | 'credit' | 'ewallet' | 'loan' | 'investment' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  initial_balance: number;
  hidden?: boolean;
  archived?: boolean;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initial_balance?: number;
  balance?: number;
  institution?: string;
  notes?: string;
  icon?: string;
  color?: string;
  hidden?: boolean;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  initial_balance?: number;
  institution?: string;
  notes?: string;
  hidden?: boolean;
  archived?: boolean;
  icon?: string;
  color?: string;
}
