export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date?: string | null;
  account_id?: string | null;
  icon?: string;
  color?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface GoalInput {
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  monthly_contribution?: number;
  target_date?: string;
  account_id?: string;
  icon?: string;
  color?: string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  monthly_contribution?: number;
  target_date?: string;
  status?: Goal['status'];
}

export interface GoalSimulation {
  goal: Goal;
  months_to_target: number | null;
  estimated_completion: string | null;
  monthly_progress: Array<{
    month: number;
    balance: number;
    date: string;
  }>;
  is_achievable: boolean;
}
