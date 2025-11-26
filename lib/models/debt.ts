export interface Debt {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  principal: number;
  current_balance: number;
  interest_rate: number;
  interest_type: 'simple' | 'compound';
  minimum_payment: number;
  due_day?: number;
  account_id?: string | null;
  status: 'active' | 'paid_off' | 'frozen';
  created_at: string;
  updated_at?: string;
}

export interface DebtInput {
  name: string;
  description?: string;
  principal: number;
  current_balance?: number;
  interest_rate: number;
  interest_type?: Debt['interest_type'];
  minimum_payment: number;
  due_day?: number;
  account_id?: string;
}

export interface DebtUpdate {
  name?: string;
  description?: string;
  current_balance?: number;
  interest_rate?: number;
  minimum_payment?: number;
  due_day?: number;
  status?: Debt['status'];
}

export interface DebtPayoffStrategy {
  strategy: 'snowball' | 'avalanche';
  debts: Debt[];
  extra_payment: number;
  months_to_payoff: number;
  total_interest_paid: number;
  schedule: Array<{
    month: number;
    debts: Array<{
      id: string;
      name: string;
      balance: number;
      payment: number;
    }>;
  }>;
}
