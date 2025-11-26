export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category_id?: string | null;
  start_date: string;
  end_date?: string | null;
  period: 'monthly' | 'yearly' | 'weekly' | 'custom';
  carry_over: boolean;
  total_amount: number;
  currency?: string;
  alert_threshold?: number;
  spent?: number; // Added for spent tracking
  created_at?: string;
  updated_at?: string;
}

export interface BudgetHistory {
  id: string;
  budget_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  allocated: number;
  spent: number;
  remaining: number;
  carry_over_from_previous?: number;
  created_at?: string;
}

export interface BudgetInput {
  name: string;
  category_id?: string;
  start_date: string;
  end_date?: string;
  period?: Budget['period'];
  carry_over?: boolean;
  total_amount: number;
  currency?: string;
  alert_threshold?: number;
}

export interface BudgetUpdate {
  name?: string;
  category_id?: string;
  total_amount?: number;
  currency?: string;
  carry_over?: boolean;
  alert_threshold?: number;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
}
